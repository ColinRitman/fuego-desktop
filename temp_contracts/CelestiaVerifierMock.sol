// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CelestiaVerifierMock
 * @dev Mock implementation of Celestia DA verifier for testing
 * @notice This is a simplified mock for development - replace with actual Celestia verifier in production
 */
contract CelestiaVerifierMock {
    // Mock state for testing
    mapping(bytes32 => mapping(bytes32 => bool)) public validCommitments;
    mapping(bytes32 => bool) public validNamespaces;
    
    event CommitmentVerified(bytes32 indexed namespace, bytes32 indexed commitment);
    event NamespaceRegistered(bytes32 indexed namespace);
    
    constructor() {
        // Register COLD namespace
        bytes32 coldNamespace = 0x434f4c4400000000000000000000000000000000000000000000000000000000;
        validNamespaces[coldNamespace] = true;
        emit NamespaceRegistered(coldNamespace);
    }
    
    /**
     * @dev Register a valid namespace for testing
     */
    function registerNamespace(bytes32 namespace) external {
        validNamespaces[namespace] = true;
        emit NamespaceRegistered(namespace);
    }
    
    /**
     * @dev Add a valid commitment for testing
     */
    function addValidCommitment(bytes32 namespace, bytes32 commitment) external {
        require(validNamespaces[namespace], "Invalid namespace");
        validCommitments[namespace][commitment] = true;
        emit CommitmentVerified(namespace, commitment);
    }
    
    /**
     * @dev Verify a DA commitment (mock implementation)
     */
    function verifyCommitment(
        bytes32 namespace,
        bytes32 commitment,
        bytes calldata proof
    ) external view returns (bool) {
        // In a real implementation, this would verify against Celestia's DA layer
        // For testing, we'll accept any commitment with a valid namespace and non-empty proof
        
        if (!validNamespaces[namespace]) {
            return false;
        }
        
        // If commitment was pre-registered, it's valid
        if (validCommitments[namespace][commitment]) {
            return true;
        }
        
        // Otherwise, accept any commitment with non-empty proof for testing
        return proof.length > 0 && commitment != bytes32(0);
    }
    
    /**
     * @dev Simulate successful verification for any valid input (testing only)
     */
    function simulateVerification(
        bytes32 namespace,
        bytes32 commitment,
        bytes calldata /* proof */
    ) external pure returns (bool) {
        // Always return true for non-zero inputs (testing only)
        return namespace != bytes32(0) && commitment != bytes32(0);
    }
    
    /**
     * @dev Get commitment status
     */
    function getCommitmentStatus(
        bytes32 namespace,
        bytes32 commitment
    ) external view returns (bool registered, bool valid) {
        registered = validNamespaces[namespace];
        valid = validCommitments[namespace][commitment];
    }
} 