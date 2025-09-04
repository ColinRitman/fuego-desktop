# Stealth Address Technical Specification

## Overview
Stealth addresses provide transaction-level privacy by generating unique, unlinkable addresses for each transaction while allowing recipients to detect and spend funds using their master private key.

## Cryptographic Foundations

### 1. Elliptic Curve Diffie-Hellman (ECDH)
```
- Curve: secp256k1 (same as Ethereum)
- Generator point: G
- Master key pair: (m, M) where M = m * G
- Ephemeral key pair: (r, R) where R = r * G
- Shared secret: S = r * M = m * R (ECDH property)
```

### 2. Address Derivation
```
- Shared secret: S = ECDH(ephemeralPrivKey, masterPubKey)
- Address seed: seed = keccak256(S || txData || nonce)
- Stealth private key: stealthPrivKey = seed
- Stealth address: stealthAddr = address(stealthPrivKey * G)
```

## Implementation Components

### 1. Master Key Management
```solidity
struct MasterKeys {
    bytes32 masterPrivateKey;    // Never revealed publicly
    bytes32 masterPublicKey;     // Published for senders to use
    address masterAddress;       // Optional: user's main address
}
```

### 2. Ephemeral Key Generation
```solidity
function generateEphemeralKeys(bytes32 entropy) internal pure returns (
    bytes32 ephemeralPrivKey,
    bytes32 ephemeralPubKey
) {
    ephemeralPrivKey = keccak256(abi.encodePacked(
        entropy,
        block.timestamp,
        block.difficulty
    ));
    // In practice, use proper secp256k1 point multiplication
    ephemeralPubKey = ecmul(ephemeralPrivKey, G);
}
```

### 3. Shared Secret Computation
```solidity
function computeSharedSecret(
    bytes32 ephemeralPrivKey,
    bytes32 masterPubKey
) internal pure returns (bytes32 sharedSecret) {
    // ECDH: shared secret = ephemeralPrivKey * masterPubKey
    // In practice, use proper elliptic curve operations
    sharedSecret = keccak256(abi.encodePacked(ephemeralPrivKey, masterPubKey));
}
```

### 4. Stealth Address Derivation
```solidity
function deriveStealthAddress(
    bytes32 sharedSecret,
    bytes32 txHash,
    uint256 nonce
) internal pure returns (address stealthAddress, bytes32 stealthPrivKey) {
    bytes32 addressSeed = keccak256(abi.encodePacked(
        sharedSecret,
        txHash,
        nonce
    ));
    
    stealthPrivKey = addressSeed;
    // In practice, derive public key properly: stealthPubKey = stealthPrivKey * G
    stealthAddress = address(uint160(uint256(keccak256(abi.encodePacked(addressSeed)))));
}
```

## Required Infrastructure

### 1. Elliptic Curve Operations
```solidity
// Need precompiled contracts or libraries for:
- Point multiplication: k * G
- Point addition: P + Q  
- ECDH computation: k * P
- Public key recovery: pubKey = privKey * G
```

### 2. Key Discovery System
```solidity
contract StealthKeyRegistry {
    mapping(address => bytes32) public masterPublicKeys;
    
    event MasterKeyRegistered(
        address indexed user,
        bytes32 masterPubKey
    );
    
    function registerMasterKey(bytes32 masterPubKey) external {
        masterPublicKeys[msg.sender] = masterPubKey;
        emit MasterKeyRegistered(msg.sender, masterPubKey);
    }
}
```

### 3. Transaction Scanning
```solidity
contract StealthTransactionRegistry {
    struct StealthTransaction {
        address stealthAddress;
        bytes32 ephemeralPubKey;
        uint256 amount;
        bytes32 txHash;
        uint256 blockNumber;
    }
    
    StealthTransaction[] public stealthTransactions;
    
    event StealthTransactionCreated(
        address indexed stealthAddress,
        bytes32 ephemeralPubKey,
        uint256 amount,
        bytes32 indexed txHash
    );
}
```

## Complete Stealth Minting Process

### 1. Recipient Setup
```javascript
// User generates master key pair
const masterWallet = ethers.Wallet.createRandom();
const masterPrivateKey = masterWallet.privateKey;
const masterPublicKey = masterWallet.publicKey;

// Register public key for others to use
await stealthRegistry.registerMasterKey(masterPublicKey);
```

### 2. Stealth Address Generation (Sender)
```javascript
async function generateStealthMint(recipientMasterPubKey, xfgTxHash, heatAmount) {
    // Generate ephemeral key pair
    const ephemeralWallet = ethers.Wallet.createRandom();
    const ephemeralPrivKey = ephemeralWallet.privateKey;
    const ephemeralPubKey = ephemeralWallet.publicKey;
    
    // Compute shared secret (ECDH)
    const sharedSecret = computeECDH(ephemeralPrivKey, recipientMasterPubKey);
    
    // Derive stealth address
    const addressSeed = ethers.utils.keccak256(
        ethers.utils.solidityPack(
            ["bytes32", "bytes32", "uint256"],
            [sharedSecret, xfgTxHash, Date.now()]
        )
    );
    
    const stealthAddress = ethers.utils.getAddress(
        "0x" + addressSeed.substring(26)
    );
    
    return {
        stealthAddress,
        ephemeralPubKey,
        sharedSecret
    };
}
```

### 3. Fund Detection (Recipient)
```javascript
async function scanForStealthFunds(masterPrivateKey) {
    const stealthFunds = [];
    
    // Get all stealth transactions
    const stealthTxs = await stealthRegistry.getStealthTransactions();
    
    for (const tx of stealthTxs) {
        // Try to derive stealth address using our master key
        const sharedSecret = computeECDH(masterPrivateKey, tx.ephemeralPubKey);
        const derivedAddress = deriveStealthAddress(sharedSecret, tx.txHash);
        
        if (derivedAddress === tx.stealthAddress) {
            // This stealth transaction belongs to us!
            stealthFunds.push({
                stealthAddress: tx.stealthAddress,
                amount: tx.amount,
                stealthPrivateKey: deriveStealthPrivateKey(sharedSecret, tx.txHash)
            });
        }
    }
    
    return stealthFunds;
}
```

### 4. Fund Recovery (Recipient)
```javascript
async function recoverStealthFunds(stealthFunds, destinationAddress) {
    for (const fund of stealthFunds) {
        // Create wallet from stealth private key
        const stealthWallet = new ethers.Wallet(fund.stealthPrivateKey);
        
        // Transfer funds from stealth address to destination
        const tx = await heatToken.connect(stealthWallet).transfer(
            destinationAddress,
            fund.amount
        );
        
        await tx.wait();
    }
}
```

## Implementation Complexity

### 🔴 **High Complexity Requirements:**
1. **Elliptic Curve Operations**: Need secp256k1 precompiles or libraries
2. **ECDH Implementation**: Proper cryptographic implementation
3. **Key Management**: Secure master key storage and usage
4. **Transaction Scanning**: Efficient detection of relevant transactions
5. **Private Key Derivation**: Secure stealth private key computation

### 🟡 **Medium Complexity Requirements:**
1. **Registry Contracts**: Master key and transaction registries
2. **Event Indexing**: Efficient scanning of stealth transactions
3. **Frontend Integration**: User interfaces for key management
4. **Recovery Tools**: Fund detection and recovery mechanisms

### 🟢 **Lower Complexity Requirements:**
1. **Address Generation**: Deterministic address derivation
2. **Storage Systems**: Tracking stealth transactions
3. **Access Control**: Authorization for minting operations

## Alternative: Simplified "Stealth" (One-Time Addresses)

If full cryptographic stealth addresses are too complex, you can achieve similar privacy with:

```solidity
// Simple one-time address rule
mapping(address => bool) public hasEverMinted;

function mintToFreshAddress(address recipient, uint256 amount) external {
    require(!hasEverMinted[recipient], "Address already used");
    hasEverMinted[recipient] = true;
    // ... mint logic
}
```

### Benefits of Simplified Approach:
- ✅ **Much simpler** to implement and understand
- ✅ **No cryptographic complexity** required
- ✅ **Prevents address reuse** effectively
- ✅ **Good privacy protection** for most use cases
- ✅ **Easy to audit** and verify

### Limitations:
- ❌ **Users must manage** multiple addresses manually
- ❌ **No automatic fund detection** 
- ❌ **Less sophisticated** than full stealth addresses

## Recommendation

For COLD L3 HEAT minting, I recommend starting with the **simplified one-time address approach** because:

1. **Immediate Implementation**: Can deploy today
2. **Effective Privacy**: Prevents address clustering
3. **Simple UX**: Easy for users to understand
4. **Lower Risk**: Fewer cryptographic attack vectors
5. **Upgradeable**: Can add full stealth addresses later

Would you like me to proceed with the simplified approach, or do you want to implement full cryptographic stealth addresses? 