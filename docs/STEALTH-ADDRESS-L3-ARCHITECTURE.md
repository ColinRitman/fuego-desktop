# COLD L3 Stealth Address + Direct Minting Architecture

## Overview

This document outlines the implementation of **stealth address privacy** combined with **direct HEAT minting on COLD L3** for the XFG → HEAT bridge.

## Privacy Requirements ⚡

### **HARD-CODED Stealth Address Requirements:**
1. **All HEAT minting MUST use stealth addresses** - no exceptions
2. **All O token minting MUST use stealth addresses** - no exceptions  
3. **Zero public linkage** between XFG burns and HEAT recipients
4. **Forward secrecy** through ephemeral key rotation
5. **Recovery mechanism** using master private keys

## Architecture: Pre-L3 vs Post-L3

### **Pre-L3 Launch (Arbitrum One)**
```
┌─────────────┐    ┌─────────────────┐    ┌───────────────────┐
│  XFG Burn   │───▶│  Fuego Oracle   │───▶│ Stealth HEAT Mint │
│ (Fuego Net) │    │ (Arbitrum One)  │    │  (Arbitrum One)   │
└─────────────┘    └─────────────────┘    └───────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ Bridge to COLD  │
                   │ L3 (if needed)  │
                   └─────────────────┘
```

**Components:**
- `StealthAddressHEATMinter.sol` on Arbitrum One
- `FuegoChainOracleV2.sol` for burn verification
- Bridge infrastructure for L3 transfers

### **Post-L3 Launch (Direct Minting)** ⭐ **RECOMMENDED**
```
┌─────────────┐    ┌─────────────────┐    ┌───────────────────┐
│  XFG Burn   │───▶│  Fuego Oracle   │───▶│ Stealth HEAT Mint │
│ (Fuego Net) │    │   (COLD L3)     │    │    (COLD L3)      │
└─────────────┘    └─────────────────┘    └───────────────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │ Ready for L3 TX │
                                          │   Gas Usage     │
                                          └─────────────────┘
```

**Components:**
- `COLDL3StealthMinter.sol` on COLD L3
- `COLDL3FuegoOracle.sol` for burn verification
- Native HEAT as L3 gas token

## Stealth Address Protocol

### **Address Generation Flow**
1. **User Master Key**: User maintains `masterPrivateKey` off-chain
2. **Ephemeral Key**: Generated per transaction: `ephemeralKey = keccak256(txHash, timestamp)`
3. **Shared Secret**: `sharedSecret = ECDH(masterPrivateKey, ephemeralPubKey)`
4. **Stealth Address**: `stealthAddress = address(keccak256(sharedSecret, txHash))`

### **Privacy Guarantee**
- **Observer**: Sees only random stealth addresses in transactions
- **No Linkage**: Cannot connect stealth addresses to real users
- **Recovery**: Only user with `masterPrivateKey` can recover funds

### **Recovery Process**
```javascript
// User can recover HEAT from any stealth address
function recoverHEAT(xfgTxHash, masterPrivateKey, recipientAddress) {
    // 1. Derive stealth address using master key
    stealthAddress = deriveStealthAddress(masterPrivateKey, ephemeralPubKey, xfgTxHash);
    
    // 2. Transfer HEAT from stealth to user's chosen address
    transfer(stealthAddress, recipientAddress, heatAmount);
}
```

## COLD L3 Native Implementation

### **L3 Advantages for Stealth Addresses**
1. **Lower Recovery Costs**: Stealth recovery transactions cost minimal HEAT
2. **Faster Processing**: No inter-chain delays for address generation
3. **Native Integration**: HEAT stealth addresses work seamlessly with L3 gas
4. **Privacy Scalability**: High-throughput private transactions

### **L3 Minting Process**
```solidity
contract COLDL3StealthHEATMinter {
    function verifyXFGBurnAndMintStealth(
        bytes32 xfgTxHash,
        bytes32 userMasterPubKey,    // For stealth generation
        uint256 xfgAmount,           // Amount burned on Fuego
        bytes calldata burnProof     // Cryptographic proof
    ) external {
        // 1. Verify XFG burn via Fuego oracle
        require(fuegoOracle.verifyBurn(xfgTxHash, burnProof), "Invalid burn");
        
        // 2. Generate stealth address
        address stealthAddress = generateStealthAddress(userMasterPubKey, xfgTxHash);
        
        // 3. Mint HEAT directly to stealth address on L3
        uint256 heatAmount = xfgAmount * XFG_TO_HEAT_RATIO;
        heatToken.mint(stealthAddress, heatAmount);
        
        // 4. User can recover later using master private key
        emit StealthHEATMinted(xfgTxHash, stealthAddress, heatAmount);
    }
}
```

## Implementation Phases

### **Phase 1: Pre-L3 Stealth Addresses (Immediate)**
- Deploy `StealthAddressHEATMinter.sol` on Arbitrum One
- **HARD-CODE** stealth requirement in all minting functions
- Integrate with existing `HEATXFGBurnVerifier.sol`
- Test with current XFG burn oracle

### **Phase 2: L3 Migration (Post-Launch)**
- Deploy `COLDL3StealthMinter.sol` on COLD L3
- Migrate oracle system to L3
- Enable direct HEAT minting on L3
- Retire Arbitrum → L3 bridge for new mints

### **Phase 3: O Token Integration**
- Extend stealth minting to O tokens
- Implement stealth governance voting
- Enable stealth liquidity provision

## Benefits of Direct L3 Minting

### 🔒 **Enhanced Privacy**
- **Stealth addresses** prevent recipient tracking
- **L3 privacy features** add additional anonymity layers
- **No bridge logs** that could leak timing information

### ⚡ **Better Performance**
- **Instant availability**: HEAT ready for L3 gas immediately
- **Lower costs**: No Arbitrum → L3 bridge fees
- **Single transaction**: XFG burn → HEAT available

### 🎯 **Native Integration**
- **Gas token synergy**: HEAT minted directly where it's used as gas
- **L3 ecosystem**: Perfect integration with COLD L3 features
- **Validator rewards**: HEAT fees directly benefit L3 validators

## Migration Strategy

### **Current State**: Arbitrum-based minting
```
User burns XFG → Arbitrum Oracle → Arbitrum HEAT → Bridge to L3
```

### **Post-L3 State**: Direct L3 stealth minting
```
User burns XFG → L3 Oracle → Stealth HEAT on L3 → Ready for use
```

### **Transition Plan**
1. **Parallel deployment**: Run both systems during transition
2. **User choice**: Allow users to choose Arbitrum or L3 minting
3. **Gradual migration**: Incentivize L3 minting with lower fees
4. **Full cutover**: Eventually sunset Arbitrum minting for new burns

## Recommendation

**Deploy stealth addresses NOW on Arbitrum** as hard-coded requirement, then **migrate to direct L3 minting** after launch for optimal privacy + performance.

This gives you:
- ✅ **Immediate privacy protection** via stealth addresses
- ✅ **Future performance gains** via direct L3 minting  
- ✅ **Seamless migration path** from Arbitrum to L3
- ✅ **Best of both worlds** security + convenience 