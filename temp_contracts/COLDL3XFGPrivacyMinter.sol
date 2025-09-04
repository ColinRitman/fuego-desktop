// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ICOLDL3Token {
    function requestXFGPrivacyMint(
        bytes32 commitment,
        bytes32 nullifierHash,
        uint256 xfgAmount,
        uint256 coldReward,
        bytes calldata zkProof
    ) external;
    
    function executeXFGPrivacyMint(bytes32 depositHash, address recipient) external;
    function getRemainingXFGAllocation() external view returns (uint256);
    function getXFGDepositInfo(bytes32 depositHash) external view returns (
        uint256 xfgAmount,
        uint256 coldReward,
        bool executed,
        uint256 timestamp
    );
}

interface ICOLDZKVerifier {
    enum ProofType { XFG_DEPOSIT, HEAT_MINT, O_TOKEN_MINT, LIQUIDITY_PROOF }
    
    function verifyZKProof(
        bytes calldata zkProof,
        ProofType proofType,
        bytes32 commitment,
        bytes32 nullifierHash,
        uint256 amount,
        address recipient
    ) external returns (bool);
    
    function isProofVerifiedForMinting(
        bytes32 proofHash,
        ProofType expectedType,
        uint256 expectedAmount
    ) external view returns (bool);
}

/**
 * @title COLD L3 XFG Privacy Minter
 * @dev Privacy-preserving minting of COLD tokens through XFG deposits
 * Uses the same ZK process as HEAT token minting for privacy
 * 
 * Only 8 COLD tokens can be minted through this mechanism (ultra-scarce)
 */
contract COLDL3XFGPrivacyMinter is ReentrancyGuard, AccessControl {
    
    bytes32 public constant PRIVACY_ADMIN_ROLE = keccak256("PRIVACY_ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    // Privacy Configuration
    struct PrivacyConfig {
        bool xfgPrivacyEnabled;
        uint256 minimumXFGDeposit;     // Minimum XFG required for COLD minting
        uint256 coldPerXFGRate;        // How much COLD per XFG (scaled by 1e18)
        uint256 maxDailyCOLDMint;      // Maximum COLD that can be minted per day
        uint256 zkProofValidityPeriod; // How long ZK proofs are valid
        uint256 minimumAnonymitySet;   // Minimum anonymity set size
    }
    
    // XFG Deposit Structure
    struct XFGDepositRequest {
        bytes32 commitment;          // ZK commitment to (xfgAmount, recipient, nonce)
        bytes32 nullifierHash;       // Prevents double spending
        uint256 xfgAmount;          // Amount of XFG deposited
        uint256 coldReward;         // COLD tokens to be minted
        bytes zkProof;             // Zero-knowledge proof
        address depositor;         // Who initiated the deposit (for tracking)
        uint256 timestamp;
        bool executed;
    }
    
    // Anonymity Set Management
    struct AnonymitySet {
        bytes32[] commitments;
        uint256 setSize;
        uint256 createdAt;
        bool isSealed;
    }
    
    // State Variables
    PrivacyConfig public privacyConfig;
    mapping(bytes32 => XFGDepositRequest) public xfgDepositRequests;
    mapping(bytes32 => bool) public usedNullifiers;
    mapping(uint256 => AnonymitySet) public anonymitySets;
    mapping(address => uint256) public dailyCOLDMinted;
    mapping(address => uint256) public lastMintDay;
    
    // Contract References
    ICOLDL3Token public coldL3Token;
    IERC20 public xfgToken;
    ICOLDZKVerifier public zkVerifier;
    
    // Privacy Metrics
    uint256 public totalXFGDeposited;
    uint256 public totalCOLDMinted;
    uint256 public totalPrivacyDeposits;
    uint256 public currentAnonymitySetId;
    
    // ZK Verification
    mapping(string => bytes) public verificationKeys;
    mapping(bytes32 => bool) public verifiedProofs;
    
    // Events
    event XFGPrivacyDepositRequested(
        bytes32 indexed depositHash,
        bytes32 commitment,
        uint256 xfgAmount,
        uint256 coldReward
    );
    event XFGPrivacyDepositExecuted(
        bytes32 indexed depositHash,
        address recipient,
        uint256 coldAmount
    );
    event AnonymitySetSealed(uint256 indexed setId, uint256 finalSize);
    event PrivacyConfigUpdated(PrivacyConfig newConfig);
    event ZKProofVerified(bytes32 indexed proofHash, string proofType);
    
    constructor(address initialOwner, address _coldL3Token, address _xfgToken, address _zkVerifier) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(PRIVACY_ADMIN_ROLE, initialOwner);
        _grantRole(VERIFIER_ROLE, initialOwner);
        
        coldL3Token = ICOLDL3Token(_coldL3Token);
        xfgToken = IERC20(_xfgToken);
        zkVerifier = ICOLDZKVerifier(_zkVerifier);
        
        // Initialize privacy configuration
        privacyConfig = PrivacyConfig({
            xfgPrivacyEnabled: true,
            minimumXFGDeposit: 1000 * 10**18,      // Minimum 1000 XFG
            coldPerXFGRate: 10**15,                // 0.001 COLD per XFG (very scarce)
            maxDailyCOLDMint: 1 * 10**18,          // Max 1 COLD per day per address
            zkProofValidityPeriod: 3600,           // 1 hour validity
            minimumAnonymitySet: 10                // Minimum 10 commitments per set
        });
    }
    
    /**
     * @dev Request XFG privacy deposit with ZK proof
     * @param commitment ZK commitment to (xfgAmount, recipient, nonce)
     * @param nullifierHash Unique nullifier to prevent double spending
     * @param xfgAmount Amount of XFG to deposit
     * @param zkProof Zero-knowledge proof of valid deposit
     */
    function requestXFGPrivacyDeposit(
        bytes32 commitment,
        bytes32 nullifierHash,
        uint256 xfgAmount,
        bytes calldata zkProof
    ) external nonReentrant {
        require(privacyConfig.xfgPrivacyEnabled, "XFG privacy deposits disabled");
        require(!usedNullifiers[nullifierHash], "Nullifier already used");
        require(xfgAmount >= privacyConfig.minimumXFGDeposit, "XFG amount too low");
        
        // Calculate COLD reward based on XFG amount
        uint256 coldReward = (xfgAmount * privacyConfig.coldPerXFGRate) / 10**18;
        require(coldReward > 0, "COLD reward must be positive");
        
        // Check daily minting limits
        uint256 today = block.timestamp / 86400;
        if (lastMintDay[msg.sender] != today) {
            dailyCOLDMinted[msg.sender] = 0;
            lastMintDay[msg.sender] = today;
        }
        require(
            dailyCOLDMinted[msg.sender] + coldReward <= privacyConfig.maxDailyCOLDMint,
            "Daily COLD mint limit exceeded"
        );
        
        // Check if we have remaining COLD allocation
        require(
            coldL3Token.getRemainingXFGAllocation() >= coldReward,
            "Insufficient COLD allocation remaining"
        );
        
        // Verify ZK proof through the ZK verifier contract
        bool proofValid = zkVerifier.verifyZKProof(
            zkProof,
            ICOLDZKVerifier.ProofType.XFG_DEPOSIT,
            commitment,
            nullifierHash,
            coldReward,  // Use COLD reward amount for verification
            msg.sender   // Temporary recipient for verification
        );
        require(proofValid, "ZK proof verification failed");
        
        // Transfer XFG tokens to this contract
        xfgToken.transferFrom(msg.sender, address(this), xfgAmount);
        
        bytes32 depositHash = keccak256(
            abi.encodePacked(commitment, nullifierHash, xfgAmount, coldReward, block.timestamp)
        );
        
        // Store deposit request
        xfgDepositRequests[depositHash] = XFGDepositRequest({
            commitment: commitment,
            nullifierHash: nullifierHash,
            xfgAmount: xfgAmount,
            coldReward: coldReward,
            zkProof: zkProof,
            depositor: msg.sender,
            timestamp: block.timestamp,
            executed: false
        });
        
        usedNullifiers[nullifierHash] = true;
        dailyCOLDMinted[msg.sender] += coldReward;
        totalXFGDeposited += xfgAmount;
        totalPrivacyDeposits++;
        
        // Add to anonymity set
        addToAnonymitySet(commitment);
        
        // Request privacy mint from COLD L3 token
        coldL3Token.requestXFGPrivacyMint(
            commitment,
            nullifierHash,
            xfgAmount,
            coldReward,
            zkProof
        );
        
        emit XFGPrivacyDepositRequested(depositHash, commitment, xfgAmount, coldReward);
    }
    
    /**
     * @dev Execute XFG privacy deposit after ZK proof verification
     * @param depositHash Hash of the deposit request
     * @param recipient Actual recipient address (revealed during execution)
     * @param revealNonce Nonce used in commitment (revealed)
     */
    function executeXFGPrivacyDeposit(
        bytes32 depositHash,
        address recipient,
        uint256 revealNonce
    ) external nonReentrant onlyRole(VERIFIER_ROLE) {
        XFGDepositRequest storage request = xfgDepositRequests[depositHash];
        require(!request.executed, "Deposit already executed");
        require(
            block.timestamp <= request.timestamp + privacyConfig.zkProofValidityPeriod,
            "ZK proof expired"
        );
        
        // Verify commitment opening
        bytes32 expectedCommitment = keccak256(
            abi.encodePacked(request.xfgAmount, recipient, revealNonce)
        );
        require(expectedCommitment == request.commitment, "Invalid commitment opening");
        
        request.executed = true;
        totalCOLDMinted += request.coldReward;
        
        // Execute COLD minting through COLD L3 token
        coldL3Token.executeXFGPrivacyMint(depositHash, recipient);
        
        emit XFGPrivacyDepositExecuted(depositHash, recipient, request.coldReward);
    }
    
    /**
     * @dev Verify if proof was already verified by ZK verifier
     */
    function isProofVerified(
        bytes32 depositHash,
        uint256 coldAmount
    ) internal view returns (bool) {
        bytes32 proofHash = keccak256(abi.encodePacked(depositHash, coldAmount));
        return zkVerifier.isProofVerifiedForMinting(
            proofHash,
            ICOLDZKVerifier.ProofType.XFG_DEPOSIT,
            coldAmount
        );
    }
    
    /**
     * @dev Add commitment to anonymity set
     */
    function addToAnonymitySet(bytes32 commitment) internal {
        AnonymitySet storage currentSet = anonymitySets[currentAnonymitySetId];
        
        currentSet.commitments.push(commitment);
        currentSet.setSize++;
        
        // Seal anonymity set if it reaches the minimum size
        if (currentSet.setSize >= privacyConfig.minimumAnonymitySet && !currentSet.isSealed) {
            currentSet.isSealed = true;
            currentAnonymitySetId++;
            
            // Initialize new anonymity set
            anonymitySets[currentAnonymitySetId].createdAt = block.timestamp;
            
            emit AnonymitySetSealed(currentAnonymitySetId - 1, currentSet.setSize);
        }
    }
    
    // Admin Functions
    function updatePrivacyConfig(PrivacyConfig memory newConfig) external onlyRole(PRIVACY_ADMIN_ROLE) {
        require(newConfig.coldPerXFGRate > 0, "Invalid COLD per XFG rate");
        require(newConfig.minimumXFGDeposit > 0, "Invalid minimum XFG deposit");
        
        privacyConfig = newConfig;
        emit PrivacyConfigUpdated(newConfig);
    }
    
    function setTokenContracts(address _coldL3Token, address _xfgToken, address _zkVerifier) 
        external onlyRole(PRIVACY_ADMIN_ROLE) 
    {
        coldL3Token = ICOLDL3Token(_coldL3Token);
        xfgToken = IERC20(_xfgToken);
        zkVerifier = ICOLDZKVerifier(_zkVerifier);
    }
    
    function emergencyWithdrawXFG(address to, uint256 amount) 
        external onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        xfgToken.transfer(to, amount);
    }
    
    // View Functions
    function getDepositRequestInfo(bytes32 depositHash) external view returns (
        uint256 xfgAmount,
        uint256 coldReward,
        bool executed,
        uint256 timestamp,
        address depositor
    ) {
        XFGDepositRequest memory request = xfgDepositRequests[depositHash];
        return (
            request.xfgAmount,
            request.coldReward,
            request.executed,
            request.timestamp,
            request.depositor
        );
    }
    
    function getAnonymitySetInfo(uint256 setId) external view returns (
        uint256 size,
        uint256 createdAt,
        bool isSealed
    ) {
        AnonymitySet memory anonSet = anonymitySets[setId];
        return (anonSet.setSize, anonSet.createdAt, anonSet.isSealed);
    }
    
    function getDailyMintStatus(address user) external view returns (
        uint256 todaysMinted,
        uint256 remainingLimit,
        uint256 dailyLimit
    ) {
        uint256 today = block.timestamp / 86400;
        uint256 todayAmount = (lastMintDay[user] == today) ? dailyCOLDMinted[user] : 0;
        
        return (
            todayAmount,
            privacyConfig.maxDailyCOLDMint > todayAmount ? 
                privacyConfig.maxDailyCOLDMint - todayAmount : 0,
            privacyConfig.maxDailyCOLDMint
        );
    }
    
    function getCOLDRewardForXFG(uint256 xfgAmount) external view returns (uint256) {
        return (xfgAmount * privacyConfig.coldPerXFGRate) / 10**18;
    }
    
    function getPrivacyStats() external view returns (
        uint256 totalXFGDeposited_,
        uint256 totalCOLDMinted_,
        uint256 totalDeposits,
        uint256 remainingCOLDAllocation,
        uint256 activeAnonymitySetSize
    ) {
        return (
            totalXFGDeposited,
            totalCOLDMinted,
            totalPrivacyDeposits,
            coldL3Token.getRemainingXFGAllocation(),
            anonymitySets[currentAnonymitySetId].setSize
        );
    }
} 