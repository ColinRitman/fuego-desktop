// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IVerifier {
    function verifyProof(
        uint[2] memory _pA,
        uint[2][2] memory _pB,
        uint[2] memory _pC,
        uint[3] memory _publicSignals
    ) external view returns (bool);
}

interface ICOLDL3Token {
    function mintLPReward(string memory pairName, address recipient, uint256 amount) external;
    function executeXFGPrivacyMint(bytes32 depositHash, address recipient, uint256 coldReward) external;
    function getRemainingLPAllocation(string memory pairName) external view returns (uint256);
    function getRemainingXFGAllocation() external view returns (uint256);
}

/**
 * @title COLD L3 Protocol
 * @dev Main protocol contract that mints ultra-scarce COLD tokens only after ZK proof verification
 * Follows established pattern: COLDprotocol as minter → verifier contract → nullifier tracking
 * 
 * Ultra-Scarce Tokenomics:
 * - Total Supply: 20 COLD tokens
 * - LP Rewards: 12 COLD (O/ETH, O/DIA, HEAT/ETH, HEAT/DIA)
 * - XFG Privacy Deposits: 8 COLD
 */
contract COLDL3Protocol is Ownable, ReentrancyGuard {
    
    // Verifier contracts for different proof types
    IVerifier public xfgDepositVerifier;    // For XFG → COLD minting (8 COLD allocation)
    IVerifier public liquidityVerifier;     // For LP rewards (12 COLD allocation) 
    
    // COLD L3 token contract
    ICOLDL3Token public coldL3Token;
    
    // XFG token for privacy deposits
    IERC20 public xfgToken;
    
    // Nullifier tracking (prevents double-spending)
    mapping(uint256 => bool) public nullifierSpent;
    
    // XFG Deposit tracking
    struct XFGDeposit {
        uint256 nullifier;
        uint256 xfgAmount;
        uint256 coldReward;
        address recipient;
        uint256 timestamp;
        bool processed;
    }
    
    mapping(bytes32 => XFGDeposit) public xfgDeposits;
    
    // LP Reward tracking  
    struct LPReward {
        uint256 nullifier;
        string pairName;
        uint256 lpAmount;
        uint256 coldReward;
        address recipient;
        uint256 timestamp;
        bool processed;
    }
    
    mapping(bytes32 => LPReward) public lpRewards;
    
    // Configuration
    uint256 public constant XFG_TO_COLD_RATE = 1000 * 10**18; // 1000 XFG = 1 COLD (very scarce)
    uint256 public constant LP_TO_COLD_RATE = 100 * 10**18;   // 100 LP tokens = 1 COLD
    
    // Metrics
    uint256 public totalXFGDeposited;
    uint256 public totalCOLDMintedFromXFG;
    uint256 public totalCOLDMintedFromLP;
    uint256 public totalProofsVerified;
    
    // Events following established pattern
    event XFGDepositProofVerified(
        uint256 indexed nullifier,
        address indexed recipient,
        uint256 xfgAmount,
        uint256 coldReward
    );
    event LPRewardProofVerified(
        uint256 indexed nullifier,
        address indexed recipient,
        string pairName,
        uint256 lpAmount,
        uint256 coldReward
    );
    event COLDMinted(address indexed recipient, uint256 amount, string mintType);
    event NullifierSpent(uint256 indexed nullifier);
    
    constructor(
        address initialOwner,
        address _coldL3Token,
        address _xfgToken,
        address _xfgDepositVerifier,
        address _liquidityVerifier
    ) Ownable(initialOwner) {
        coldL3Token = ICOLDL3Token(_coldL3Token);
        xfgToken = IERC20(_xfgToken);
        xfgDepositVerifier = IVerifier(_xfgDepositVerifier);
        liquidityVerifier = IVerifier(_liquidityVerifier);
    }
    
    /**
     * @dev Verify XFG deposit proof and mint COLD tokens (from 8 COLD allocation)
     * Follows established pattern: verify proof → check nullifier → mint
     */
    function verifyAndMintFromXFG(
        uint[2] memory _pA,
        uint[2][2] memory _pB, 
        uint[2] memory _pC,
        uint256 _nullifier,
        uint256 _xfgAmount,
        address _recipient
    ) external nonReentrant {
        require(!nullifierSpent[_nullifier], "Nullifier already spent");
        require(_xfgAmount > 0, "XFG amount must be positive");
        
        // Calculate COLD reward (very scarce rate)
        uint256 coldReward = (_xfgAmount * 10**18) / XFG_TO_COLD_RATE;
        require(coldReward > 0, "XFG amount too small for COLD reward");
        
        // Check remaining allocation
        require(
            coldL3Token.getRemainingXFGAllocation() >= coldReward,
            "Insufficient COLD allocation remaining"
        );
        
        // Prepare public signals for verification
        uint256 recipientHash = uint256(keccak256(abi.encodePacked(_recipient))) >> 8;
        uint[3] memory publicSignals = [_nullifier, _xfgAmount, recipientHash];
        
        // Verify ZK proof
        require(
            xfgDepositVerifier.verifyProof(_pA, _pB, _pC, publicSignals),
            "Invalid ZK proof"
        );
        
        // Transfer XFG tokens to this contract (proof of deposit)
        xfgToken.transferFrom(msg.sender, address(this), _xfgAmount);
        
        // Mark nullifier as spent
        nullifierSpent[_nullifier] = true;
        
        // Store deposit info
        bytes32 depositHash = keccak256(
            abi.encodePacked(_nullifier, _xfgAmount, _recipient, block.timestamp)
        );
        
        xfgDeposits[depositHash] = XFGDeposit({
            nullifier: _nullifier,
            xfgAmount: _xfgAmount,
            coldReward: coldReward,
            recipient: _recipient,
            timestamp: block.timestamp,
            processed: false
        });
        
        // Execute COLD minting through L3 token contract
        coldL3Token.executeXFGPrivacyMint(depositHash, _recipient, coldReward);
        
        // Update metrics
        totalXFGDeposited += _xfgAmount;
        totalCOLDMintedFromXFG += coldReward;
        totalProofsVerified++;
        
        // Mark as processed
        xfgDeposits[depositHash].processed = true;
        
        emit XFGDepositProofVerified(_nullifier, _recipient, _xfgAmount, coldReward);
        emit COLDMinted(_recipient, coldReward, "XFG_DEPOSIT");
        emit NullifierSpent(_nullifier);
    }
    
    /**
     * @dev Verify LP reward proof and mint COLD tokens (from 12 COLD allocation)
     * For O/ETH, O/DIA, HEAT/ETH, HEAT/DIA pairs
     */
    function verifyAndMintFromLP(
        uint[2] memory _pA,
        uint[2][2] memory _pB,
        uint[2] memory _pC, 
        uint256 _nullifier,
        string memory _pairName,
        uint256 _lpAmount,
        address _recipient
    ) external nonReentrant {
        require(!nullifierSpent[_nullifier], "Nullifier already spent");
        require(_lpAmount > 0, "LP amount must be positive");
        
        // Validate pair name
        require(
            keccak256(bytes(_pairName)) == keccak256(bytes("O/ETH")) ||
            keccak256(bytes(_pairName)) == keccak256(bytes("O/DIA")) ||
            keccak256(bytes(_pairName)) == keccak256(bytes("HEAT/ETH")) ||
            keccak256(bytes(_pairName)) == keccak256(bytes("HEAT/DIA")),
            "Invalid LP pair"
        );
        
        // Calculate COLD reward
        uint256 coldReward = (_lpAmount * 10**18) / LP_TO_COLD_RATE;
        require(coldReward > 0, "LP amount too small for COLD reward");
        
        // Check remaining allocation for this pair
        require(
            coldL3Token.getRemainingLPAllocation(_pairName) >= coldReward,
            "Insufficient COLD allocation for this pair"
        );
        
        // Prepare public signals for verification
        uint256 pairHash = uint256(keccak256(bytes(_pairName))) >> 8;
        uint256 recipientHash = uint256(keccak256(abi.encodePacked(_recipient))) >> 8;
        uint[3] memory publicSignals = [_nullifier, pairHash, recipientHash];
        
        // Verify ZK proof
        require(
            liquidityVerifier.verifyProof(_pA, _pB, _pC, publicSignals),
            "Invalid ZK proof"
        );
        
        // Mark nullifier as spent
        nullifierSpent[_nullifier] = true;
        
        // Store LP reward info
        bytes32 rewardHash = keccak256(
            abi.encodePacked(_nullifier, _pairName, _lpAmount, _recipient, block.timestamp)
        );
        
        lpRewards[rewardHash] = LPReward({
            nullifier: _nullifier,
            pairName: _pairName,
            lpAmount: _lpAmount,
            coldReward: coldReward,
            recipient: _recipient,
            timestamp: block.timestamp,
            processed: false
        });
        
        // Execute COLD minting through L3 token contract
        coldL3Token.mintLPReward(_pairName, _recipient, coldReward);
        
        // Update metrics
        totalCOLDMintedFromLP += coldReward;
        totalProofsVerified++;
        
        // Mark as processed
        lpRewards[rewardHash].processed = true;
        
        emit LPRewardProofVerified(_nullifier, _recipient, _pairName, _lpAmount, coldReward);
        emit COLDMinted(_recipient, coldReward, "LP_REWARD");
        emit NullifierSpent(_nullifier);
    }
    
    // Admin Functions (following established owner pattern)
    function setVerifiers(address _xfgVerifier, address _lpVerifier) external onlyOwner {
        xfgDepositVerifier = IVerifier(_xfgVerifier);
        liquidityVerifier = IVerifier(_lpVerifier);
    }
    
    function setTokenContracts(address _coldL3Token, address _xfgToken) external onlyOwner {
        coldL3Token = ICOLDL3Token(_coldL3Token);
        xfgToken = IERC20(_xfgToken);
    }
    
    function updateRates(uint256 _xfgToColdRate, uint256 _lpToColdRate) external onlyOwner {
        // Note: These are constants for ultra-scarcity, but allow admin override if needed
        require(_xfgToColdRate >= 500 * 10**18, "XFG rate too low"); // Min 500 XFG per COLD
        require(_lpToColdRate >= 50 * 10**18, "LP rate too low");    // Min 50 LP per COLD
    }
    
    // Emergency withdrawal (only for stuck funds)
    function emergencyWithdraw(address token, address to, uint256 amount) external onlyOwner {
        IERC20(token).transfer(to, amount);
    }
    
    // View Functions
    function getXFGDepositInfo(bytes32 depositHash) external view returns (
        uint256 nullifier,
        uint256 xfgAmount,
        uint256 coldReward,
        address recipient,
        bool processed
    ) {
        XFGDeposit memory deposit = xfgDeposits[depositHash];
        return (
            deposit.nullifier,
            deposit.xfgAmount,
            deposit.coldReward,
            deposit.recipient,
            deposit.processed
        );
    }
    
    function getLPRewardInfo(bytes32 rewardHash) external view returns (
        uint256 nullifier,
        string memory pairName,
        uint256 lpAmount,
        uint256 coldReward,
        address recipient,
        bool processed
    ) {
        LPReward memory reward = lpRewards[rewardHash];
        return (
            reward.nullifier,
            reward.pairName,
            reward.lpAmount,
            reward.coldReward,
            reward.recipient,
            reward.processed
        );
    }
    
    function getProtocolStats() external view returns (
        uint256 totalXFGDeposited_,
        uint256 totalCOLDFromXFG,
        uint256 totalCOLDFromLP,
        uint256 totalProofs,
        uint256 remainingXFGAllocation,
        uint256 remainingLPAllocation
    ) {
        return (
            totalXFGDeposited,
            totalCOLDMintedFromXFG,
            totalCOLDMintedFromLP,
            totalProofsVerified,
            coldL3Token.getRemainingXFGAllocation(),
            coldL3Token.getRemainingLPAllocation("O/ETH") +
            coldL3Token.getRemainingLPAllocation("O/DIA") +
            coldL3Token.getRemainingLPAllocation("HEAT/ETH") +
            coldL3Token.getRemainingLPAllocation("HEAT/DIA")
        );
    }
    
    function calculateCOLDRewardForXFG(uint256 xfgAmount) external pure returns (uint256) {
        return (xfgAmount * 10**18) / XFG_TO_COLD_RATE;
    }
    
    function calculateCOLDRewardForLP(uint256 lpAmount) external pure returns (uint256) {
        return (lpAmount * 10**18) / LP_TO_COLD_RATE;
    }
} 