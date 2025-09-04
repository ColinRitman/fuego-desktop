# Fuego Blockchain - Fresh Source Code Analysis

> **Based on actual analysis of https://github.com/usexfg/fuego**
> 
> ❌ **Previous assumptions were INCORRECT** - this document contains facts from real source code analysis

## ✅ Corrected Facts

### Monetary System
- **Max Supply**: 8,000,008.8000008 XFG
  - Raw units: 80,000,088,000,008
  - Decimal places: 7 (confirmed in `CRYPTONOTE_DISPLAY_DECIMAL_POINT = 7`)
  - COIN unit: 10,000,000 (10^7)
  - The decimal point (7 places) is indeed in the exact middle of "80000088000008"

### Cryptographic Hash Functions (Confirmed in src/crypto/)
✅ **Actually Found**:
- `keccak` (keccak.c/h)
- `blake256` (blake256.c/h) - **NOT blake2b**
- `skein` (skein.c/h)  
- `groestl` (groestl.c/h)
- `chacha8` (chacha8.c/h)
- `jh` (jh.c/h)

### Core Cryptographic Functions (Found in source)
✅ **Confirmed Functions**:
- `cn_slow_hash` (4 occurrences) - PoW algorithm
- `cn_fast_hash` (4 occurrences) - Fast hashing
- `check_tx_ring_signature` (1 occurrence) - Ring signature verification
- `generate_signature` (3 occurrences) - Signature generation
- `check_signature` (3 occurrences) - Signature verification
- `generate_key_image` (3 occurrences) - Key image generation
- `generate_key_image_helper` (2 occurrences) - Key image helper
- `generateKeyPair` (2 occurrences) - Key pair generation
- `hash_to_scalar` (1 occurrence) - Hash to scalar conversion

### Network Configuration
- **P2P Port**: 10808
- **RPC Port**: 18180  
- **Block Target**: 480 seconds (8 minutes)
- **Address Prefix**: 1753191 ("fire" address prefix)

### Architecture
- **Base**: CryptoNote protocol
- **Privacy**: Ring signatures + key images for double-spend prevention
- **Address System**: Standard CryptoNote dual-key addresses (spendPublicKey/viewPublicKey)
- **Transaction Extra**: Used for storing commitments and additional data

## ❌ Previous Incorrect Assumptions

### What Was Wrong:
1. **Stealth Addresses**: No evidence found in source code
2. **Hash Functions**: Incorrectly claimed Blake2b instead of blake256
3. **Signature Schemes**: Incorrectly claimed Ed25519
4. **Supply**: Incorrectly stated ~8M instead of 8,000,008.8000008 XFG

## 🔍 Source Analysis Statistics

- **Repository**: https://github.com/usexfg/fuego
- **Files Indexed**: 474 source files
- **Functions Found**: Thousands across multiple categories
- **Hash Implementations**: 6 confirmed algorithms
- **Crypto Functions**: 12+ core cryptographic operations

## 🔐 Cryptographic Architecture

### Ring Signatures
```cpp
// Found in src/CryptoNoteCore/Core.h
check_tx_ring_signature()

// Found in src/crypto/crypto.h  
generate_signature()
check_signature()
```

### Key Management
```cpp
// Found in src/CryptoNoteCore/CryptoNoteFormatUtils.h
generate_key_image_helper()

// Found in src/CryptoNoteCore/CryptoNoteBasic.h
generateKeyPair()
```

### Hash Functions
```cpp
// Found in src/crypto/hash-ops.h
cn_slow_hash()  // PoW
cn_fast_hash()  // General hashing
hash_extra_blake()
hash_extra_groestl() 
hash_extra_jh()
hash_extra_skein()
```

## 🌐 Network & Protocol

### Constants (from CryptoNoteConfig.h)
```cpp
const uint64_t MONEY_SUPPLY = UINT64_C(80000088000008);
const uint64_t COIN = UINT64_C(10000000);
const size_t CRYPTONOTE_DISPLAY_DECIMAL_POINT = 7;
const uint64_t CRYPTONOTE_PUBLIC_ADDRESS_BASE58_PREFIX = 1753191;
const uint64_t DIFFICULTY_TARGET = 480;
const int P2P_DEFAULT_PORT = 10808;
const int RPC_DEFAULT_PORT = 18180;
```

## 🔗 Bridge Development Implications

For developing a bridge from XFG burns to HEAT token minting:

### Transaction Verification
- Use `check_tx_ring_signature()` for signature validation
- Parse `TransactionExtra` field for commitments
- Verify against actual blockchain via RPC (port 18180)

### Burn Detection
- Look for outputs to null/burn addresses
- Validate ring signature authenticity
- Extract commitment from tx_extra field
- Ensure minimum confirmations

### Oracle Service Integration
- Fresh analysis provides accurate function names
- Correct hash functions for commitment verification
- Proper decimal handling (7 places, not assumptions)

## 📚 Usage Commands

```bash
# Build fresh index from source
npm run fuego:fresh-index

# Search for functions
npm run fuego:fresh-search search <query>

# Search for constants  
npm run fuego:fresh-search constants <query>

# Show cryptographic functions
npm run fuego:fresh-search crypto

# Show corrected facts
npm run fuego:fresh-search facts

# Show index statistics
npm run fuego:fresh-search stats
```

## 🎯 Key Takeaway

**Always analyze actual source code instead of making assumptions.**

The fresh indexing system revealed multiple incorrect assumptions about Fuego's implementation. This highlights the importance of source-code-driven development rather than protocol-knowledge-based assumptions.

---

*Analysis generated: ${new Date().toISOString()}* 