// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title COLDL3Settlement
 * @dev Settlement contract for COLD L3 on Arbitrum
 * @notice Handles state commitments, withdrawals, and dispute resolution
 */
contract COLDL3Settlement is Ownable, ReentrancyGuard {
    struct StateCommitment {
        bytes32 stateRoot;
        bytes32 celestiaCommitment;
        uint256 blockNumber;
        uint256 timestamp;
        bool finalized;
    }
    
    struct WithdrawalRequest {
        address user;
        uint256 amount;
        bytes32 l3TxHash;
        bytes32 stateRoot;
        bool processed;
        uint256 timestamp;
    }
    
    // Events
    event StateCommitted(uint256 indexed blockNumber, bytes32 stateRoot, bytes32 celestiaCommitment);
    event StateFinalized(uint256 indexed blockNumber, bytes32 stateRoot);
    event WithdrawalRequested(address indexed user, uint256 amount, bytes32 l3TxHash);
    event WithdrawalProcessed(address indexed user, uint256 amount, bytes32 l3TxHash);
    event DisputeRaised(uint256 indexed blockNumber, address challenger);
    event DisputeResolved(uint256 indexed blockNumber, bool valid);
    
    // State management
    mapping(uint256 => StateCommitment) public stateCommitments;
    mapping(bytes32 => WithdrawalRequest) public withdrawalRequests;
    mapping(address => bool) public authorized;
    
    uint256 public currentBlock;
    uint256 public finalizationDelay = 7 days;
    uint256 public disputePeriod = 1 days;
    
    // HEAT token on Arbitrum (wrapped version)
    address public heatTokenArbitrum;
    
    // Celestia DA configuration
    bytes32 public celestiaNamespace;
    address public celestiaVerifier;
    
    modifier onlyAuthorized() {
        require(authorized[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    modifier validWithdrawal(bytes32 withdrawalHash) {
        require(withdrawalRequests[withdrawalHash].user != address(0), "Invalid withdrawal");
        require(!withdrawalRequests[withdrawalHash].processed, "Withdrawal already processed");
        _;
    }
    
    constructor(
        address initialOwner,
        address _heatTokenArbitrum,
        bytes32 _celestiaNamespace,
        address _celestiaVerifier
    )  Ownable(initialOwner) {
        heatTokenArbitrum = _heatTokenArbitrum;
        celestiaNamespace = _celestiaNamespace;
        celestiaVerifier = _celestiaVerifier;
    }
    
    /**
     * @dev Set authorized addresses (L3 sequencers/validators)
     */
    function setAuthorized(address user, bool status) external onlyOwner {
        authorized[user] = status;
    }
    
    /**
     * @dev Set finalization delay
     */
    function setFinalizationDelay(uint256 _delay) external onlyOwner {
        finalizationDelay = _delay;
    }
    
    /**
     * @dev Commit new L3 state to Arbitrum
     */
    function commitState(
        uint256 blockNumber,
        bytes32 stateRoot,
        bytes32 celestiaCommitment,
        bytes calldata celestiaProof
    ) external onlyAuthorized {
        require(blockNumber > currentBlock, "Invalid block number");
        
        // Verify Celestia DA commitment
        require(
            verifyCelestiaCommitment(celestiaCommitment, celestiaProof),
            "Invalid Celestia commitment"
        );
        
        stateCommitments[blockNumber] = StateCommitment({
            stateRoot: stateRoot,
            celestiaCommitment: celestiaCommitment,
            blockNumber: blockNumber,
            timestamp: block.timestamp,
            finalized: false
        });
        
        currentBlock = blockNumber;
        
        emit StateCommitted(blockNumber, stateRoot, celestiaCommitment);
    }
    
    /**
     * @dev Finalize a state commitment after dispute period
     */
    function finalizeState(uint256 blockNumber) external {
        StateCommitment storage commitment = stateCommitments[blockNumber];
        require(commitment.timestamp > 0, "State commitment not found");
        require(!commitment.finalized, "Already finalized");
        require(
            block.timestamp >= commitment.timestamp + finalizationDelay,
            "Finalization delay not met"
        );
        
        commitment.finalized = true;
        emit StateFinalized(blockNumber, commitment.stateRoot);
    }
    
    /**
     * @dev Request withdrawal from L3 to Arbitrum
     */
    function requestWithdrawal(
        address user,
        uint256 amount,
        bytes32 l3TxHash,
        bytes32 stateRoot,
        bytes32[] calldata merkleProof
    ) external {
        bytes32 withdrawalHash = keccak256(abi.encodePacked(user, amount, l3TxHash));
        
        require(withdrawalRequests[withdrawalHash].user == address(0), "Withdrawal already exists");
        
        // Verify withdrawal is included in finalized state
        require(isStateFinalized(stateRoot), "State not finalized");
        
        // Verify merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(user, amount, l3TxHash));
        require(
            MerkleProof.verify(merkleProof, stateRoot, leaf),
            "Invalid merkle proof"
        );
        
        withdrawalRequests[withdrawalHash] = WithdrawalRequest({
            user: user,
            amount: amount,
            l3TxHash: l3TxHash,
            stateRoot: stateRoot,
            processed: false,
            timestamp: block.timestamp
        });
        
        emit WithdrawalRequested(user, amount, l3TxHash);
    }
    
    /**
     * @dev Process withdrawal and transfer HEAT tokens
     */
    function processWithdrawal(
        bytes32 withdrawalHash
    ) external nonReentrant validWithdrawal(withdrawalHash) {
        WithdrawalRequest storage withdrawal = withdrawalRequests[withdrawalHash];
        
        withdrawal.processed = true;
        
        // Transfer HEAT tokens from settlement contract to user
        require(
            IERC20(heatTokenArbitrum).transfer(withdrawal.user, withdrawal.amount),
            "Transfer failed"
        );
        
        emit WithdrawalProcessed(withdrawal.user, withdrawal.amount, withdrawal.l3TxHash);
    }
    
    /**
     * @dev Raise dispute for invalid state commitment
     */
    function raiseDispute(
        uint256 blockNumber,
        bytes calldata fraudProof
    ) external {
        StateCommitment storage commitment = stateCommitments[blockNumber];
        require(commitment.timestamp > 0, "State commitment not found");
        require(!commitment.finalized, "State already finalized");
        require(
            block.timestamp <= commitment.timestamp + disputePeriod,
            "Dispute period expired"
        );
        
        // Verify fraud proof (simplified - in practice would be more complex)
        require(verifyFraudProof(commitment.stateRoot, fraudProof), "Invalid fraud proof");
        
        // Slash the state commitment
        delete stateCommitments[blockNumber];
        
        emit DisputeRaised(blockNumber, msg.sender);
        emit DisputeResolved(blockNumber, false);
    }
    
    /**
     * @dev Check if a state is finalized
     */
    function isStateFinalized(bytes32 stateRoot) public view returns (bool) {
        for (uint256 i = 1; i <= currentBlock; i++) {
            StateCommitment storage commitment = stateCommitments[i];
            if (commitment.stateRoot == stateRoot && commitment.finalized) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev Verify Celestia DA commitment
     */
    function verifyCelestiaCommitment(
        bytes32 commitment,
        bytes calldata proof
    ) internal view returns (bool) {
        // In practice, this would verify the DA commitment against Celestia
        // For now, we'll use a simple verification through the celestiaVerifier
        return ICelestiaVerifier(celestiaVerifier).verifyCommitment(
            celestiaNamespace,
            commitment,
            proof
        );
    }
    
    /**
     * @dev Verify fraud proof
     */
    function verifyFraudProof(
        bytes32 stateRoot,
        bytes calldata fraudProof
    ) internal pure returns (bool) {
        // Simplified fraud proof verification
        // In practice, this would involve complex state transition verification
        return fraudProof.length > 0 && stateRoot != bytes32(0);
    }
    
    /**
     * @dev Emergency functions
     */
    function emergencyPause() external onlyOwner {
        // Implementation for emergency pause
    }
    
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "Transfer failed");
    }
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface ICelestiaVerifier {
    function verifyCommitment(
        bytes32 namespace,
        bytes32 commitment,
        bytes calldata proof
    ) external view returns (bool);
} 