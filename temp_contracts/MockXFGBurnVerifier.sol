// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Mock XFG Burn Verifier
 * @dev Mock implementation for testing - replace with real Fuego chain verifier
 * @notice This is for development/testing only - production requires real cryptographic verification
 */
contract MockXFGBurnVerifier is Ownable {
    
    mapping(bytes32 => bool) public processedTransactions;
    mapping(bytes32 => bool) public validTransactions;
    
    event TransactionMarkedValid(bytes32 indexed txHash, uint256 xfgAmount);
    event BurnVerified(bytes32 indexed txHash, address burnAddress, uint256 xfgAmount);
    
    constructor(address initialOwner) Ownable(initialOwner) {
        // Mark genesis transaction as valid
        bytes32 genesisTx = 0x77c45ea61513b10ed0a638218dc9bd113fe55aea4f322856d373a3594087e304;
        validTransactions[genesisTx] = true;
        processedTransactions[genesisTx] = true;
        
        emit TransactionMarkedValid(genesisTx, 800 * 10**18);
    }
    
    /**
     * @dev Mock verification - in production this would verify Fuego chain proofs
     */
    function verifyXFGBurn(
        bytes32 txHash,
        address burnAddress,
        uint256 xfgAmount,
        bytes calldata proof
    ) external view returns (bool) {
        // Mock verification - just check if transaction is marked as valid
        return validTransactions[txHash] && !processedTransactions[txHash];
    }
    
    /**
     * @dev Check if transaction has been processed
     */
    function isXFGBurnProcessed(bytes32 txHash) external view returns (bool) {
        return processedTransactions[txHash];
    }
    
    /**
     * @dev Mark transaction as valid (owner only - for testing)
     */
    function markTransactionValid(bytes32 txHash, uint256 xfgAmount) external onlyOwner {
        validTransactions[txHash] = true;
        emit TransactionMarkedValid(txHash, xfgAmount);
    }
    
    /**
     * @dev Mark transaction as processed (called by verifier contract)
     */
    function markTransactionProcessed(bytes32 txHash) external {
        // In production, this would have proper access control
        processedTransactions[txHash] = true;
    }
    
    /**
     * @dev Batch mark transactions as valid (for testing)
     */
    function batchMarkValid(bytes32[] calldata txHashes, uint256[] calldata amounts) external onlyOwner {
        require(txHashes.length == amounts.length, "Array length mismatch");
        
        for (uint i = 0; i < txHashes.length; i++) {
            validTransactions[txHashes[i]] = true;
            emit TransactionMarkedValid(txHashes[i], amounts[i]);
        }
    }
} 