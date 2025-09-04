// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Mock Fuego Block Header Oracle
 * @dev Mock implementation for testing XFG burn verification
 * @notice In production, this would connect to actual Fuego chain validators/relayers
 */
contract MockFuegoOracle is Ownable {
    
    struct BlockHeader {
        bytes32 blockHash;
        bytes32 merkleRoot;
        uint256 timestamp;
        bool verified;
    }
    
    mapping(uint256 => BlockHeader) public blockHeaders;
    mapping(bytes32 => bool) public verifiedTransactions;
    
    uint256 public latestBlockHeight;
    uint256 public confirmationDelay = 6; // 6 blocks confirmation
    
    event BlockHeaderCommitted(uint256 indexed blockHeight, bytes32 blockHash, bytes32 merkleRoot);
    event TransactionVerified(bytes32 indexed txHash, uint256 blockHeight);
    
    constructor(address initialOwner) Ownable(initialOwner) {
        // Initialize genesis block and your specific transaction
        _commitGenesisBlock();
    }
    
    function _commitGenesisBlock() internal {
        bytes32 genesisTxHash = 0x77c45ea61513b10ed0a638218dc9bd113fe55aea4f322856d373a3594087e304;
        bytes32 genesisBlockHash = keccak256(abi.encodePacked("FUEGO_GENESIS_BLOCK"));
        bytes32 genesisMerkleRoot = keccak256(abi.encodePacked(genesisTxHash, "genesis_proof"));
        
        blockHeaders[1] = BlockHeader({
            blockHash: genesisBlockHash,
            merkleRoot: genesisMerkleRoot,
            timestamp: block.timestamp - 86400, // 1 day ago
            verified: true
        });
        
        verifiedTransactions[genesisTxHash] = true;
        latestBlockHeight = 1;
        
        emit BlockHeaderCommitted(1, genesisBlockHash, genesisMerkleRoot);
        emit TransactionVerified(genesisTxHash, 1);
    }
    
    /**
     * @dev Commit a new Fuego block header (oracle admin only)
     */
    function commitBlockHeader(
        uint256 blockHeight,
        bytes32 blockHash,
        bytes32 merkleRoot,
        uint256 blockTimestamp,
        bytes32[] calldata transactionHashes
    ) external onlyOwner {
        require(blockHeight > latestBlockHeight, "Block height must be increasing");
        require(blockHash != bytes32(0), "Invalid block hash");
        require(merkleRoot != bytes32(0), "Invalid merkle root");
        require(blockTimestamp > 0, "Invalid timestamp");
        
        blockHeaders[blockHeight] = BlockHeader({
            blockHash: blockHash,
            merkleRoot: merkleRoot,
            timestamp: blockTimestamp,
            verified: true
        });
        
        // Mark all transactions in this block as verified
        for (uint256 i = 0; i < transactionHashes.length; i++) {
            verifiedTransactions[transactionHashes[i]] = true;
            emit TransactionVerified(transactionHashes[i], blockHeight);
        }
        
        latestBlockHeight = blockHeight;
        
        emit BlockHeaderCommitted(blockHeight, blockHash, merkleRoot);
    }
    
    /**
     * @dev Simplified block commitment for testing
     */
    function commitTestBlock(
        bytes32 fuegoTxHash,
        uint256 xfgAmount,
        address fromAddress
    ) external onlyOwner returns (uint256 blockHeight) {
        blockHeight = latestBlockHeight + 1;
        
        // Create mock block data
        bytes32 blockHash = keccak256(abi.encodePacked("FUEGO_BLOCK_", blockHeight));
        bytes32 merkleRoot = keccak256(abi.encodePacked(
            fuegoTxHash,
            fromAddress,
            0x000000000000000000000000000000000000dEaD, // burn address
            xfgAmount
        ));
        
        blockHeaders[blockHeight] = BlockHeader({
            blockHash: blockHash,
            merkleRoot: merkleRoot,
            timestamp: block.timestamp,
            verified: true
        });
        
        verifiedTransactions[fuegoTxHash] = true;
        latestBlockHeight = blockHeight;
        
        emit BlockHeaderCommitted(blockHeight, blockHash, merkleRoot);
        emit TransactionVerified(fuegoTxHash, blockHeight);
        
        return blockHeight;
    }
    
    /**
     * @dev Get block header information
     */
    function getBlockHeader(uint256 blockHeight) external view returns (
        bytes32 blockHash,
        bytes32 merkleRoot,
        uint256 timestamp,
        bool verified
    ) {
        BlockHeader memory header = blockHeaders[blockHeight];
        return (header.blockHash, header.merkleRoot, header.timestamp, header.verified);
    }
    
    /**
     * @dev Check if block is verified and has enough confirmations
     */
    function isBlockVerified(uint256 blockHeight) external view returns (bool) {
        if (blockHeight == 0 || blockHeight > latestBlockHeight) {
            return false;
        }
        
        BlockHeader memory header = blockHeaders[blockHeight];
        if (!header.verified) {
            return false;
        }
        
        // Check confirmations
        uint256 confirmations = latestBlockHeight - blockHeight;
        return confirmations >= confirmationDelay;
    }
    
    /**
     * @dev Check if transaction is verified
     */
    function isTransactionVerified(bytes32 txHash) external view returns (bool) {
        return verifiedTransactions[txHash];
    }
    
    /**
     * @dev Generate mock Merkle proof for testing
     */
    function generateMockMerkleProof(
        bytes32 fuegoTxHash,
        uint256 blockHeight
    ) external view returns (bytes32[] memory) {
        require(blockHeaders[blockHeight].verified, "Block not verified");
        require(verifiedTransactions[fuegoTxHash], "Transaction not verified");
        
        // Create simple mock proof (in reality would be complex Merkle tree)
        bytes32[] memory proof = new bytes32[](3);
        proof[0] = keccak256(abi.encodePacked(fuegoTxHash, "sibling1"));
        proof[1] = keccak256(abi.encodePacked(fuegoTxHash, "sibling2"));
        proof[2] = keccak256(abi.encodePacked(fuegoTxHash, "sibling3"));
        
        return proof;
    }
    
    /**
     * @dev Set confirmation delay
     */
    function setConfirmationDelay(uint256 _delay) external onlyOwner {
        require(_delay > 0, "Invalid delay");
        confirmationDelay = _delay;
    }
    
    /**
     * @dev Batch commit multiple blocks (for testing)
     */
    function batchCommitBlocks(
        uint256 startHeight,
        uint256 count,
        bytes32[] calldata txHashes
    ) external onlyOwner {
        require(startHeight > latestBlockHeight, "Invalid start height");
        require(count > 0, "Invalid count");
        
        for (uint256 i = 0; i < count; i++) {
            uint256 blockHeight = startHeight + i;
            bytes32 blockHash = keccak256(abi.encodePacked("FUEGO_BATCH_BLOCK_", blockHeight));
            bytes32 merkleRoot = keccak256(abi.encodePacked("BATCH_MERKLE_", blockHeight));
            
            blockHeaders[blockHeight] = BlockHeader({
                blockHash: blockHash,
                merkleRoot: merkleRoot,
                timestamp: block.timestamp - (count - i) * 12, // 12 second block times
                verified: true
            });
            
            emit BlockHeaderCommitted(blockHeight, blockHash, merkleRoot);
        }
        
        // Mark provided transactions as verified
        for (uint256 i = 0; i < txHashes.length; i++) {
            verifiedTransactions[txHashes[i]] = true;
            emit TransactionVerified(txHashes[i], startHeight);
        }
        
        latestBlockHeight = startHeight + count - 1;
    }
    
    /**
     * @dev Get oracle statistics
     */
    function getOracleStats() external view returns (
        uint256 _latestBlockHeight,
        uint256 _confirmationDelay,
        uint256 _totalVerifiedBlocks
    ) {
        uint256 verifiedCount = 0;
        for (uint256 i = 1; i <= latestBlockHeight; i++) {
            if (blockHeaders[i].verified) {
                verifiedCount++;
            }
        }
        
        return (latestBlockHeight, confirmationDelay, verifiedCount);
    }
} 