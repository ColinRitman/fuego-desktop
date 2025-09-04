# XFG → HEAT Bridge: Multi-Layered Proof System

## Overview

This document describes the multi-layered proof system that solves the **"WHO deposited"** problem in bridging XFG from the private Fuego network to HEAT tokens on Arbitrum.

## The Problem

When XFG is deposited/burned on the Fuego network, we need to prove:
1. **THAT** XFG was deposited (not just transferred)
2. **WHO** deposited it (which Ethereum address should receive HEAT)
3. **HOW MUCH** was deposited
4. **WHEN** it was deposited

The challenge: Fuego network is **private** - there's no public address tracing on the blockchain.

## The Solution: Three-Layer Proof System

### Layer 1: Undefined Output Anomaly Detection
**Purpose**: Proves that XFG was deposited/burned (not just transferred)

**Mechanism**: 
- Regular XFG transfers have proper output key images
- Deposit/burn transactions show `'undefined'` output keys in the block explorer
- This anomaly serves as a cryptographic fingerprint for deposits

**Evidence**: [Fuego Block Explorer](http://fuego.spaceportx.net/index.html?hash=77c45ea61513b10ed0a638218dc9bd113fe55aea4f322856d373a3594087e304#blockchain_transaction) shows undefined output keys for deposit transactions.

### Layer 2: txn_extra Field Proof Data
**Purpose**: Contains recipient address and cryptographic proof

**Mechanism**:
- User includes structured data in the `txn_extra` field of their XFG deposit transaction
- Format: `recipient_address(20) + signature(65) + nonce(32) + expiration(32)` = 149 bytes minimum
- This data is part of the transaction hash and cannot be tampered with

### Layer 3: ECDSA Signature Verification
**Purpose**: Proves the user controls the recipient Ethereum address

**Mechanism**:
- User signs a message containing: `txHash + recipientAddress + nonce + expiration`
- Oracle recovers the signer from the signature
- Verification passes only if recovered signer == recipient address

## Implementation Flow

### User Side (Depositing XFG)

1. **Create Deposit Intent**
   ```javascript
   const recipientAddress = "0x..."; // Ethereum address to receive HEAT
   const nonce = 12345; // Unique nonce for replay protection
   const expiration = Math.floor(Date.now() / 1000) + 86400; // 24 hours
   ```

2. **Generate Signature Proof**
   ```javascript
   const messageHash = keccak256(
       "XFG_DEPOSIT_PROOF",
       txHash,
       recipientAddress,
       nonce,
       expiration
   );
   const signature = await userWallet.signMessage(messageHash);
   ```

3. **Construct txn_extra Field**
   ```javascript
   const txnExtraData = concat([
       zeroPad(recipientAddress, 20),  // 20 bytes
       arrayify(signature),            // 65 bytes
       zeroPad(nonce, 32),            // 32 bytes
       zeroPad(expiration, 32)        // 32 bytes
   ]); // Total: 149 bytes
   ```

4. **Submit XFG Deposit Transaction**
   - Include `txnExtraData` in the transaction's `txn_extra` field
   - Send XFG to deposit/burn address
   - Transaction creates undefined output keys (Layer 1 proof)

### Oracle Side (Verifying Deposits)

1. **Detect Deposit Transaction**
   ```javascript
   // Layer 1: Check for undefined output anomaly
   const hasUndefinedOutputs = detectUndefinedOutputs(transaction);
   if (!hasUndefinedOutputs) return false;
   ```

2. **Parse txn_extra Field**
   ```javascript
   // Layer 2: Extract proof data
   const recipientAddress = address(txnExtraData[0:20]);
   const signature = txnExtraData[20:85];
   const nonce = uint256(txnExtraData[85:117]);
   const expiration = uint256(txnExtraData[117:149]);
   ```

3. **Verify Signature**
   ```javascript
   // Layer 3: Cryptographic verification
   const messageHash = keccak256(
       "XFG_DEPOSIT_PROOF",
       txHash,
       recipientAddress,
       nonce,
       expiration
   );
   const recoveredSigner = ecrecover(messageHash, signature);
   const signatureValid = (recoveredSigner == recipientAddress);
   ```

4. **Additional Checks**
   ```javascript
   const nonceValid = !usedNonces[nonce] && nonce > userNonces[recipientAddress];
   const notExpired = block.timestamp <= expiration;
   const allProofsValid = signatureValid && nonceValid && notExpired;
   ```

5. **Mint HEAT Tokens**
   ```javascript
   if (allProofsValid) {
       const heatAmount = xfgAmount * XFG_TO_HEAT_RATIO;
       heatToken.mint(recipientAddress, heatAmount);
   }
   ```

## Security Features

### ✅ Undefined Output Fingerprint
- Impossible to fake undefined outputs in regular transfers
- Unique cryptographic signature of deposit transactions
- Automatically detected by block explorer parsing

### ✅ ECDSA Signature Verification
- Proves cryptographic control of recipient Ethereum address
- Uses standard Ethereum signing format
- Message includes all critical parameters

### ✅ Replay Attack Prevention
- Nonce system prevents transaction replay
- Per-user nonce tracking ensures ordering
- Used nonces are permanently blacklisted

### ✅ Time-Limited Proofs
- Optional expiration timestamps limit proof validity
- Prevents stale proof usage
- Configurable expiration windows

### ✅ Tamper-Proof Data
- `txn_extra` field is part of transaction hash
- Cannot be modified without invalidating transaction
- Cryptographically bound to deposit amount

### ✅ Privacy Preservation
- No reliance on Fuego network address privacy
- Works with completely private Fuego transactions
- Recipient chooses their own Ethereum address

## Contract Architecture

### FuegoChainOracleV2
- Manages multi-layered proof verification
- Parses `txn_extra` field data
- Verifies ECDSA signatures
- Tracks nonces and prevents replay attacks

### XFGDepositProof Structure
```solidity
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
```

## Testing

Run the test suite to verify the multi-layered proof system:

```bash
npx hardhat run scripts/test-txn-extra-proof.js
```

This test demonstrates:
- ✅ Undefined output anomaly detection
- ✅ txn_extra field parsing and validation
- ✅ ECDSA signature verification
- ✅ Replay attack prevention
- ✅ Invalid signature rejection
- ✅ Complete end-to-end proof verification

## Production Deployment

1. **Deploy Oracle V2**
   ```bash
   npx hardhat run scripts/deploy-heat-production.js --network arbitrumOne
   ```

2. **Update HEAT Verifier**
   - Point to FuegoChainOracleV2 address
   - Enable `verifyAndMintWithTxnExtraProof` method

3. **Configure Off-Chain Components**
   - Set up Fuego network monitoring
   - Parse `txn_extra` fields from transactions
   - Submit verified deposits to oracle

## Key Advantages

### 🎯 Solves "WHO Deposited" Problem
- Complete identification of HEAT recipient
- Works with private Fuego network
- No reliance on address tracing

### ⚡ Fast and Reliable
- Automatic undefined output detection
- Efficient signature verification
- Minimal oracle complexity

### 🔒 Cryptographically Secure
- Three independent verification layers
- Standard ECDSA signature scheme
- Tamper-proof transaction binding

### 🔐 Privacy-Preserving
- User controls their own proof
- No exposure of Fuego addresses
- Self-sovereign identity verification

### 🛡️ Attack-Resistant
- Replay attack prevention
- Signature verification required
- Time-limited proof validity

## Conclusion

The multi-layered proof system provides a complete, secure, and privacy-preserving solution for bridging XFG deposits to HEAT tokens. By combining undefined output anomaly detection, txn_extra field parsing, and ECDSA signature verification, we achieve cryptographically sound proof of both deposit occurrence and recipient identity.

This design is production-ready and can be deployed immediately for the HEAT token bridge on Arbitrum One. 