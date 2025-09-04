// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Fuego Chain Oracle V2 - Simplified for Testing
 * @dev Multi-layered proof system with txn_extra field parsing
 */
contract FuegoChainOracleV2Simple is Ownable {
    
    struct XFGDepositProof {
        bytes32 txHash;
        uint256 blockHeight;
        uint256 xfgAmount;
        
        // Layer 1: Undefined Output Anomaly
        bool hasUndefinedOutputs;
        uint256 undefinedOutputCount;
        
        // Layer 2: txn_extra Field Data
        bytes txnExtraData;
        address recipientAddress;
        bytes recipientSignature;
        uint256 nonce;
        uint256 expirationTimestamp;
        
        // Layer 3: Verification Results
        bool signatureVerified;
        bool nonceValid;
        bool notExpired;
        bool allProofsValid;
        
        uint256 timestamp;
        bool isValidDeposit;
    }
    
    // State
    mapping(bytes32 => XFGDepositProof) public depositProofs;
    mapping(uint256 => bool) public usedNonces;
    mapping(address => uint256) public userNonces;
    
    uint256 public totalDepositsDetected;
    uint256 public totalSignaturesVerified;
    
    // Events
    event XFGDepositVerified(
        bytes32 indexed txHash,
        address indexed recipientAddress,
        uint256 xfgAmount,
        bool hasUndefinedOutputs,
        bool signatureVerified
    );
    
    event TxnExtraDataParsed(
        bytes32 indexed txHash,
        address indexed recipientAddress,
        uint256 nonce
    );
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Submit XFG deposit with multi-layered proof
     */
    function submitDepositWithTxnExtra(
        bytes32 txHash,
        uint256 blockHeight,
        uint256 xfgAmount,
        bool hasUndefinedOutputs,
        uint256 undefinedOutputCount,
        bytes calldata txnExtraData
    ) external onlyOwner {
        require(txHash != bytes32(0), "Invalid tx hash");
        require(hasUndefinedOutputs, "No undefined output anomaly");
        require(txnExtraData.length >= 149, "txn_extra too short");
        
        // Parse txn_extra field
        (
            address recipientAddress,
            bytes memory recipientSignature,
            uint256 nonce,
            uint256 expirationTimestamp
        ) = _parseTxnExtraData(txnExtraData);
        
        // Verify signature
        bool signatureValid = _verifyRecipientSignature(
            txHash,
            recipientAddress,
            recipientSignature,
            nonce,
            expirationTimestamp
        );
        
        // Verify nonce and expiration
        bool nonceValid = !usedNonces[nonce] && nonce > userNonces[recipientAddress];
        bool notExpired = expirationTimestamp == 0 || block.timestamp <= expirationTimestamp;
        
        bool allValid = signatureValid && nonceValid && notExpired;
        
        // Store proof
        depositProofs[txHash] = XFGDepositProof({
            txHash: txHash,
            blockHeight: blockHeight,
            xfgAmount: xfgAmount,
            hasUndefinedOutputs: hasUndefinedOutputs,
            undefinedOutputCount: undefinedOutputCount,
            txnExtraData: txnExtraData,
            recipientAddress: recipientAddress,
            recipientSignature: recipientSignature,
            nonce: nonce,
            expirationTimestamp: expirationTimestamp,
            signatureVerified: signatureValid,
            nonceValid: nonceValid,
            notExpired: notExpired,
            allProofsValid: allValid,
            timestamp: block.timestamp,
            isValidDeposit: allValid
        });
        
        if (allValid) {
            usedNonces[nonce] = true;
            userNonces[recipientAddress] = nonce;
            totalSignaturesVerified++;
        }
        
        totalDepositsDetected++;
        
        emit TxnExtraDataParsed(txHash, recipientAddress, nonce);
        emit XFGDepositVerified(
            txHash,
            recipientAddress,
            xfgAmount,
            hasUndefinedOutputs,
            signatureValid
        );
    }
    
    /**
     * @dev Parse txn_extra field: address(20) + signature(65) + nonce(32) + expiration(32)
     */
    function _parseTxnExtraData(bytes calldata txnExtraData) internal pure returns (
        address recipientAddress,
        bytes memory recipientSignature,
        uint256 nonce,
        uint256 expirationTimestamp
    ) {
        recipientAddress = address(bytes20(txnExtraData[0:20]));
        recipientSignature = txnExtraData[20:85];
        nonce = uint256(bytes32(txnExtraData[85:117]));
        expirationTimestamp = uint256(bytes32(txnExtraData[117:149]));
    }
    
    /**
     * @dev Verify ECDSA signature (simplified)
     */
    function _verifyRecipientSignature(
        bytes32 txHash,
        address recipientAddress,
        bytes memory signature,
        uint256 nonce,
        uint256 expirationTimestamp
    ) internal pure returns (bool) {
        bytes32 messageHash = keccak256(abi.encodePacked(
            "XFG_DEPOSIT_PROOF",
            txHash,
            recipientAddress,
            nonce,
            expirationTimestamp
        ));
        
        // Convert to Ethereum signed message format
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            messageHash
        ));
        
        // Extract r, s, v from signature
        if (signature.length != 65) {
            return false;
        }
        
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        
        // Adjust v if needed
        if (v < 27) {
            v += 27;
        }
        
        // Recover address
        address recoveredSigner = ecrecover(ethSignedMessageHash, v, r, s);
        return recoveredSigner == recipientAddress;
    }
    
    /**
     * @dev Verify XFG deposit with complete proof
     */
    function verifyXFGDeposit(bytes32 txHash) external view returns (
        bool isValidDeposit,
        uint256 xfgAmount,
        address recipientAddress,
        bool hasUndefinedOutputs,
        bool signatureVerified
    ) {
        XFGDepositProof memory proof = depositProofs[txHash];
        return (
            proof.allProofsValid,
            proof.xfgAmount,
            proof.recipientAddress,
            proof.hasUndefinedOutputs,
            proof.signatureVerified
        );
    }
    
    function getDepositProof(bytes32 txHash) external view returns (XFGDepositProof memory) {
        return depositProofs[txHash];
    }
} 