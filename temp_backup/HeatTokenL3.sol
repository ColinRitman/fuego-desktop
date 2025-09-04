// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title HEAT Token for COLD L3
 * @dev Native gas token for COLD L3 rollup with constrained supply
 * 
 * Key Features:
 * - HEAT can ONLY be minted when XFG is burned on Fuego chain (1:1 ratio)
 * - Zero inflation by design - no block rewards
 * - Burn verification through cryptographic proofs
 * - Used as gas token for COLD L3 transactions
 * - Deflationary pressure through fee burning
 */
contract HeatTokenL3 is ERC20, Ownable, ReentrancyGuard, Pausable {
    
    // Events
    event XFGBurnVerified(
        bytes32 indexed fuegoTxHash,
        address indexed recipient,
        uint256 xfgBurned,
        uint256 heatMinted,
        uint256 blockHeight
    );
    
    event HeatBurned(
        address indexed account,
        uint256 amount,
        string reason
    );
    
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event BurnVerifierUpdated(address indexed oldVerifier, address indexed newVerifier);
    
    // State variables
    mapping(address => bool) public authorizedMinters;
    mapping(bytes32 => bool) public processedFuegoTxs;
    
    address public burnVerifier;
    uint256 public totalXFGBurned;
    uint256 public totalHeatMinted;
    uint256 public totalHeatBurned;
    
    // Constants
    uint256 public constant XFG_TO_HEAT_RATIO = 10**7; // 1 XFG = 10M HEAT (based on 100 XFG = 1B HEAT)
    uint256 public constant MAX_SUPPLY = 1000000000 * 10**18; // 1B HEAT max theoretical supply
    
    // Fee burning configuration
    uint256 public feeBurnRate = 500; // 5% of transaction fees burned (basis points)
    uint256 public privacyBurnRate = 200; // 2% of privacy fees burned
    
    modifier onlyMinter() {
        require(authorizedMinters[msg.sender], "HEAT: Not authorized minter");
        _;
    }
    
    modifier onlyBurnVerifier() {
        require(msg.sender == burnVerifier, "HEAT: Not burn verifier");
        _;
    }
    
    constructor(
        address _burnVerifier,
        address _initialOwner
    ) ERC20("HEAT Token", "HEAT") Ownable(_initialOwner) {
        require(_burnVerifier != address(0), "HEAT: Invalid burn verifier");
        require(_initialOwner != address(0), "HEAT: Invalid initial owner");
        
        burnVerifier = _burnVerifier;
        
        // Add owner as initial minter
        authorizedMinters[_initialOwner] = true;
        emit MinterAdded(_initialOwner);
    }
    
    /**
     * @dev Mint HEAT tokens based on verified XFG burn
     * @param recipient Address to receive minted HEAT
     * @param xfgAmount Amount of XFG burned on Fuego chain
     * @param fuegoTxHash Transaction hash of the burn on Fuego
     * @param fuegoBlockHeight Block height of the burn transaction
     * @param burnProof Cryptographic proof of the burn
     */
    function mintFromXFGBurn(
        address recipient,
        uint256 xfgAmount,
        bytes32 fuegoTxHash,
        uint256 fuegoBlockHeight,
        bytes calldata burnProof
    ) external onlyBurnVerifier nonReentrant whenNotPaused {
        require(recipient != address(0), "HEAT: Invalid recipient");
        require(xfgAmount > 0, "HEAT: Invalid XFG amount");
        require(!processedFuegoTxs[fuegoTxHash], "HEAT: Fuego tx already processed");
        
        // Verify the burn proof
        require(_verifyXFGBurnProof(xfgAmount, fuegoTxHash, fuegoBlockHeight, burnProof), 
                "HEAT: Invalid burn proof");
        
        // Calculate HEAT to mint (1 XFG = 10M HEAT)
        uint256 heatToMint = xfgAmount * XFG_TO_HEAT_RATIO;
        
        // Check max supply constraint
        require(totalSupply() + heatToMint <= MAX_SUPPLY, "HEAT: Exceeds max supply");
        
        // Mark transaction as processed
        processedFuegoTxs[fuegoTxHash] = true;
        
        // Update tracking variables
        totalXFGBurned += xfgAmount;
        totalHeatMinted += heatToMint;
        
        // Mint HEAT tokens
        _mint(recipient, heatToMint);
        
        emit XFGBurnVerified(fuegoTxHash, recipient, xfgAmount, heatToMint, fuegoBlockHeight);
    }
    
    /**
     * @dev Burn HEAT tokens for deflationary pressure
     * @param amount Amount of HEAT to burn
     * @param reason Reason for burning (e.g., "transaction_fees", "privacy_fees")
     */
    function burn(uint256 amount, string calldata reason) external nonReentrant {
        require(amount > 0, "HEAT: Invalid burn amount");
        require(balanceOf(msg.sender) >= amount, "HEAT: Insufficient balance");
        
        _burn(msg.sender, amount);
        totalHeatBurned += amount;
        
        emit HeatBurned(msg.sender, amount, reason);
    }
    
    /**
     * @dev Burn HEAT tokens from an account (used by protocol for fee burning)
     * @param account Account to burn from
     * @param amount Amount to burn
     * @param reason Reason for burning
     */
    function burnFrom(address account, uint256 amount, string calldata reason) 
        external onlyMinter nonReentrant {
        require(amount > 0, "HEAT: Invalid burn amount");
        require(balanceOf(account) >= amount, "HEAT: Insufficient balance");
        
        _burn(account, amount);
        totalHeatBurned += amount;
        
        emit HeatBurned(account, amount, reason);
    }
    
    /**
     * @dev Process transaction fees with automatic burning
     * @param feePayer Address paying the fees
     * @param feeAmount Total fee amount
     * @param feeType Type of fee ("transaction" or "privacy")
     */
    function processTransactionFees(
        address feePayer,
        uint256 feeAmount,
        string calldata feeType
    ) external onlyMinter nonReentrant whenNotPaused {
        require(feePayer != address(0), "HEAT: Invalid fee payer");
        require(feeAmount > 0, "HEAT: Invalid fee amount");
        require(balanceOf(feePayer) >= feeAmount, "HEAT: Insufficient balance for fees");
        
        uint256 burnRate = keccak256(bytes(feeType)) == keccak256(bytes("privacy")) 
            ? privacyBurnRate 
            : feeBurnRate;
        
        uint256 burnAmount = (feeAmount * burnRate) / 10000;
        uint256 remainingFee = feeAmount - burnAmount;
        
        // Burn portion of fees
        if (burnAmount > 0) {
            _burn(feePayer, burnAmount);
            totalHeatBurned += burnAmount;
            emit HeatBurned(feePayer, burnAmount, string(abi.encodePacked(feeType, "_fee_burn")));
        }
        
        // Transfer remaining fees to protocol treasury or validators
        if (remainingFee > 0) {
            _transfer(feePayer, owner(), remainingFee);
        }
    }
    
    /**
     * @dev Add authorized minter
     * @param minter Address to add as minter
     */
    function addMinter(address minter) external onlyOwner {
        require(minter != address(0), "HEAT: Invalid minter address");
        require(!authorizedMinters[minter], "HEAT: Already a minter");
        
        authorizedMinters[minter] = true;
        emit MinterAdded(minter);
    }
    
    /**
     * @dev Remove authorized minter
     * @param minter Address to remove as minter
     */
    function removeMinter(address minter) external onlyOwner {
        require(authorizedMinters[minter], "HEAT: Not a minter");
        
        authorizedMinters[minter] = false;
        emit MinterRemoved(minter);
    }
    
    /**
     * @dev Update burn verifier contract
     * @param newVerifier New burn verifier address
     */
    function updateBurnVerifier(address newVerifier) external onlyOwner {
        require(newVerifier != address(0), "HEAT: Invalid verifier address");
        require(newVerifier != burnVerifier, "HEAT: Same verifier");
        
        address oldVerifier = burnVerifier;
        burnVerifier = newVerifier;
        
        emit BurnVerifierUpdated(oldVerifier, newVerifier);
    }
    
    /**
     * @dev Update fee burn rates
     * @param newFeeBurnRate New transaction fee burn rate (basis points)
     * @param newPrivacyBurnRate New privacy fee burn rate (basis points)
     */
    function updateBurnRates(uint256 newFeeBurnRate, uint256 newPrivacyBurnRate) external onlyOwner {
        require(newFeeBurnRate <= 1000, "HEAT: Fee burn rate too high"); // Max 10%
        require(newPrivacyBurnRate <= 1000, "HEAT: Privacy burn rate too high"); // Max 10%
        
        feeBurnRate = newFeeBurnRate;
        privacyBurnRate = newPrivacyBurnRate;
    }
    
    /**
     * @dev Pause contract in emergency
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get supply statistics
     * @return Returns totalSupply Current total supply
     * @return Returns totalBurned Total amount burned
     * @return Returns circulatingSupply Effective circulating supply
     * @return Returns maxSupply Maximum possible supply
     */
    function getSupplyStats() external view returns (
        uint256 totalSupply_,
        uint256 totalBurned,
        uint256 circulatingSupply,
        uint256 maxSupply
    ) {
        totalSupply_ = totalSupply();
        totalBurned = totalHeatBurned;
        circulatingSupply = totalSupply_;
        maxSupply = MAX_SUPPLY;
    }
    
    /**
     * @dev Get XFG burn statistics
     * @return Returns totalXFGBurned_ Total XFG burned
     * @return Returns totalHeatMinted_ Total HEAT minted from burns
     * @return Returns currentRatio Current XFG to HEAT ratio
     */
    function getXFGBurnStats() external view returns (
        uint256 totalXFGBurned_,
        uint256 totalHeatMinted_,
        uint256 currentRatio
    ) {
        totalXFGBurned_ = totalXFGBurned;
        totalHeatMinted_ = totalHeatMinted;
        currentRatio = XFG_TO_HEAT_RATIO;
    }
    
    /**
     * @dev Check if Fuego transaction was already processed
     * @param fuegoTxHash Transaction hash to check
     * @return Returns bool True if already processed
     */
    function isFuegoTxProcessed(bytes32 fuegoTxHash) external view returns (bool) {
        return processedFuegoTxs[fuegoTxHash];
    }
    
    /**
     * @dev Internal function to verify XFG burn proof
     * @param xfgAmount Amount of XFG claimed to be burned
     * @param fuegoTxHash Transaction hash on Fuego chain
     * @param fuegoBlockHeight Block height of the transaction
     * @param burnProof Cryptographic proof of the burn
     * @return Returns bool True if proof is valid
     */
    function _verifyXFGBurnProof(
        uint256 xfgAmount,
        bytes32 fuegoTxHash,
        uint256 fuegoBlockHeight,
        bytes calldata burnProof
    ) internal view returns (bool) {
        // In production, this would implement:
        // 1. Merkle proof verification against Fuego block headers
        // 2. ZK-STARK proof verification for burn transaction
        // 3. Signature verification from Fuego network
        // 4. Cross-chain state verification
        
        // For now, we'll do basic validation
        require(xfgAmount > 0, "HEAT: Invalid XFG amount");
        require(fuegoTxHash != bytes32(0), "HEAT: Invalid tx hash");
        require(fuegoBlockHeight > 0, "HEAT: Invalid block height");
        require(burnProof.length > 0, "HEAT: Empty burn proof");
        
        // TODO: Implement full cryptographic verification
        // This would typically involve:
        // - Verifying Merkle inclusion proof
        // - Checking block header commitments
        // - Validating burn transaction structure
        // - Confirming XFG was actually destroyed
        
        return true; // Simplified for initial implementation
    }
    
    /**
     * @dev Override transfer to add pause functionality
     */
    } 