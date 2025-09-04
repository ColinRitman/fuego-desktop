# XFG Burn Proof System

A zero-knowledge proof system for proving XFG burns and enabling cross-chain HEAT/O token minting using Winterfell STARK proofs.

## Overview

This system enables users to burn XFG tokens on the Fuego chain and prove this burn to mint HEAT/O tokens on destination chains (like Ethereum) without revealing sensitive transaction details.

## Architecture

### Cross-Chain Flow

```
Fuego Chain                    Proof System              Destination Chain
     |                              |                          |
     | 1. Burn XFG                  |                          |
     |    (store secret in tx_extra)|                          |
     |                              |                          |
     | 2. Generate ZK Proof         |                          |
     |    (prove burn occurred)     |                          |
     |                              |                          |
     | 3. Submit Proof              |                          |
     |                              |                          |
     |                              | 4. Verify Proof          |
     |                              |    (mint HEAT/O)         |
```

### Key Components

- **Secret**: Private value stored in Fuego transaction's `tx_extra` field
- **Nullifier**: Public value derived from secret, prevents double-minting
- **Commitment**: Public value derived from nullifier, stored in `tx_extra`
- **Proof**: Zero-knowledge proof that burn occurred without revealing secret

## Secret Structure

The secret is constructed as:
```
secret = termCode || chainCode || xfgTxHash || randomSalt
```

- **termCode** (1 byte): Termination code
- **chainCode** (1 byte): Destination chain identifier  
- **xfgTxHash** (8 bytes): First 8 bytes of XFG transaction hash
- **randomSalt** (22 bytes): Random entropy for uniqueness

**Why include xfgTxHash?**
- Ensures each burn has a unique nullifier
- Prevents replay attacks and double-minting
- Creates 1:1 mapping between burns and mints

## Circuit Design

The Winterfell AIR circuit implements:

### Public Inputs
- `nullifier`: Poseidon(secret)
- `commitment`: Poseidon(nullifier) 
- `recipient_addr_hash`: keccak256(recipient_address)

### Private Inputs
- `secret`: termCode || chainCode || xfgTxHash || randomSalt
- `fuego_block_height`: Height of block containing burn
- `fuego_block_hash`: Hash of block containing burn

### Constraints
1. Nullifier computation: `nullifier = hash(secret)`
2. Commitment computation: `commitment = hash(nullifier)`
3. Block height remains constant
4. Block hash remains constant  
5. Recipient hash remains constant

## Usage

### Component-Based Secret Construction (Recommended)

```bash
./prove-burn \
  --term-code 01 \
  --chain-code 02 \
  --random-salt 0102030405060708090a0b0c0d0e0f1011121314151617 \
  --fuego-block-height 12345 \
  --fuego-block-hash a1b2c3d4e5f6... \
  --xfg-tx-hash 9876543210abcdef... \
  --recipient 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6
```

### Direct Secret Input

```bash
./prove-burn \
  --secret 01029876543210abcdef0102030405060708090a0b0c0d0e0f1011121314151617 \
  --fuego-block-height 12345 \
  --fuego-block-hash a1b2c3d4e5f6... \
  --xfg-tx-hash 9876543210abcdef... \
  --recipient 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6
```

### Setup

```bash
./prove-burn --setup
```

## Security Properties

### Privacy
- Secret is never revealed in the proof
- Only nullifier and commitment are public
- Transaction details remain private

### Uniqueness  
- Each burn has unique nullifier (due to xfgTxHash in secret)
- Prevents double-minting attacks
- Enables 1:1 burn-to-mint mapping

### Verifiability
- Proof can be verified without knowing secret
- Links specific Fuego transaction to mint
- Cryptographic guarantees of burn occurrence

## Implementation Details

### Proof System
- **Framework**: Winterfell STARK
- **Field**: F64 (64-bit field)
- **Trace Length**: 64 steps
- **Columns**: 5 (secret, nullifier, commitment, block_height, recipient_hash)

### Hash Functions
- **Demo**: Simple polynomial hash (`x * 7 + 13`)
- **Production**: Use Poseidon hash for nullifier/commitment

### Proof Options
- **Num Queries**: 42
- **Blowup Factor**: 8
- **Grinding Factor**: 4
- **FRI Folding Factor**: 2
- **FRI Remainder Degree**: 7

## Integration

### Smart Contract Verification
The proof can be verified on destination chains using:
- Winterfell verifier contract
- Public inputs: nullifier, commitment, recipient_hash
- Prevents double-minting by tracking used nullifiers

### Fuego Integration
- Secret stored in transaction `tx_extra` field
- Commitment also stored in `tx_extra` for verification
- Block height/hash for temporal validation

## Development

### Building
```bash
cargo build --release
```

### Testing
```bash
cargo test
```

### Documentation
```bash
cargo doc --open
```

## Future Enhancements

- [ ] Real Poseidon hash implementation
- [ ] Merkle tree for batch verification
- [ ] Multiple destination chain support
- [ ] Optimized circuit constraints
- [ ] Production-ready proof generation

## Security Considerations

- Keep secret private and secure
- Verify all public inputs on destination chain
- Use cryptographically secure random salt
- Validate block height/hash on destination chain
- Implement proper nullifier tracking 