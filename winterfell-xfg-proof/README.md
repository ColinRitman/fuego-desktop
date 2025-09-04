# XFG Burn Proof System with Winterfell STARKs

A zero-knowledge proof system for verifying XFG burn transactions on Fuego L1 using Winterfell STARKs, enabling trustless HEAT token minting on Arbitrum.

## Overview

This system provides:
- **STARK-based proof generation** for XFG burn verification
- **Cross-chain bridging** from Fuego L1 to Arbitrum
- **Privacy-preserving** burn verification
- **Merge-mining consensus** integration
- **Solidity verifier** generation for on-chain verification

## Architecture

```
Fuego L1 (XFG Burn) → Winterfell STARK Proof → Arbitrum (HEAT Mint)
```

### Components

1. **XFGBurnCircuit**: Winterfell STARK circuit for burn verification
2. **XFGBurnProver**: Generates STARK proofs
3. **XFGBurnVerifier**: Verifies STARK proofs
4. **Solidity Integration**: On-chain verification contracts

## Features

- ✅ **No trusted setup** - Transparent STARK proofs
- ✅ **Quantum resistant** - Hash-based cryptography
- ✅ **Fast verification** - Efficient on-chain verification
- ✅ **Batch processing** - Multiple proofs in one transaction
- ✅ **Caching support** - Optimized proof generation
- ✅ **Parallel processing** - Multi-threaded proof generation

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd winterfell-xfg-proof

# Install dependencies
cargo build --release

# Run tests
cargo test

# Run example
cargo run --example generate_proof
```

## Quick Start

### 1. Generate a Proof

```rust
use winterfell_xfg_proof::*;

// Create public inputs
let public_inputs = XFGBurnPublicInputs {
    burn_amount: 1000,
    recipient: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6".to_string(),
    block_number: 12345,
    merkle_root: [/* merkle root */],
    merge_mining_hash: [/* mining hash */],
};

// Create private inputs (witness data)
let private_inputs = XFGBurnPrivateInputs {
    burn_tx_hash: [/* transaction hash */],
    merkle_proof: vec![/* merkle proof path */],
    merkle_indices: vec![/* proof indices */],
    merge_mining_proof: MergeMiningProof { /* ... */ },
    burn_tx: BurnTransaction { /* ... */ },
};

// Generate proof
let proof = generate_xfg_burn_proof(public_inputs, private_inputs)?;
```

### 2. Verify a Proof

```rust
// Verify the proof
let is_valid = verify_xfg_burn_proof(&proof)?;
println!("Proof is valid: {}", is_valid);
```

### 3. Use in Solidity

```solidity
// Deploy the verifier contract
contract XFGBurnVerifier {
    function verifyXFGBurnProof(
        bytes calldata proof,
        uint64 burnAmount,
        string calldata recipient,
        uint64 blockNumber,
        bytes32 merkleRoot,
        bytes32 mergeMiningHash
    ) external pure returns (VerificationResult memory);
}
```

## API Reference

### Core Types

#### `XFGBurnProof`
```rust
pub struct XFGBurnProof {
    pub stark_proof: StarkProof,
    pub public_inputs: XFGBurnPublicInputs,
    pub metadata: ProofMetadata,
}
```

#### `XFGBurnPublicInputs`
```rust
pub struct XFGBurnPublicInputs {
    pub burn_amount: u64,
    pub recipient: String,
    pub block_number: u64,
    pub merkle_root: [u8; 32],
    pub merge_mining_hash: [u8; 32],
}
```

#### `XFGBurnPrivateInputs`
```rust
pub struct XFGBurnPrivateInputs {
    pub burn_tx_hash: [u8; 32],
    pub merkle_proof: Vec<[u8; 32]>,
    pub merkle_indices: Vec<bool>,
    pub merge_mining_proof: MergeMiningProof,
    pub burn_tx: BurnTransaction,
}
```

### Main Functions

#### `generate_xfg_burn_proof()`
Generates a STARK proof for XFG burn verification.

```rust
pub fn generate_xfg_burn_proof(
    public_inputs: XFGBurnPublicInputs,
    private_inputs: XFGBurnPrivateInputs,
) -> XFGProofResult<XFGBurnProof>
```

#### `verify_xfg_burn_proof()`
Verifies a STARK proof for XFG burn verification.

```rust
pub fn verify_xfg_burn_proof(proof: &XFGBurnProof) -> XFGProofResult<bool>
```

### Advanced Usage

#### Batch Processing
```rust
let batch_prover = XFGBurnBatchProver::new(options, 10);
let proofs = batch_prover.prove_batch(circuits)?;
```

#### Optimized Prover with Caching
```rust
let mut optimized_prover = XFGBurnOptimizedProver::new(options);
let proof = optimized_prover.prove_cached(circuit)?;
```

#### Parallel Processing
```rust
let parallel_prover = XFGBurnParallelProver::new(options, 4);
let proofs = parallel_prover.prove_parallel(circuits)?;
```

## Circuit Details

### Trace Layout
The STARK circuit uses 8 columns:
- **Column 0**: Burn amount verification
- **Column 1**: Merkle root verification
- **Column 2**: Merge mining hash verification
- **Column 3**: Merkle proof verification
- **Column 4**: Merge mining proof verification
- **Column 5**: Transaction hash verification
- **Column 6**: Block number verification
- **Column 7**: Consistency check

### Constraints
The circuit enforces:
1. Burn amount matches public input
2. Merkle proof is valid
3. Merge mining proof meets difficulty target
4. Transaction hash is correct
5. Block number is consistent
6. All inputs are properly constrained

## Performance

### Benchmarks
- **Proof Generation**: ~2-5 seconds (depending on options)
- **Proof Verification**: ~100-500ms
- **Proof Size**: ~50-200KB (depending on security level)
- **Gas Cost**: ~200K-500K gas for on-chain verification

### Optimization Tips
1. Use caching for repeated proofs
2. Batch multiple proofs together
3. Use parallel processing for large batches
4. Choose appropriate security parameters

## Security

### Security Parameters
- **Field Size**: 64-bit (sufficient for current use cases)
- **Extension Factor**: 32-64 (configurable)
- **Number of Queries**: 4-16 (configurable)
- **FRI Folding Factor**: 2 (optimal for performance)

### Security Assumptions
1. SHA-256 is collision resistant
2. Merkle tree construction is secure
3. Merge mining difficulty is appropriate
4. No quantum computers exist (for current parameters)

## Integration

### With Arbitrum
1. Deploy `XFGBurnVerifier` contract
2. Use proof verification in HEAT minting
3. Implement settlement delay for security

### With Fuego L1
1. Monitor burn transactions
2. Generate merkle proofs
3. Create merge mining proofs
4. Submit proofs to Arbitrum

### With Relayers
1. Implement proof submission service
2. Handle gas optimization
3. Provide fallback mechanisms

## Development

### Building
```bash
# Debug build
cargo build

# Release build
cargo build --release

# With optimizations
RUSTFLAGS="-C target-cpu=native" cargo build --release
```

### Testing
```bash
# Run all tests
cargo test

# Run specific test
cargo test test_proof_generation

# Run benchmarks
cargo bench
```

### Documentation
```bash
# Generate documentation
cargo doc --open

# Check documentation
cargo doc --no-deps
```

## Examples

### Basic Proof Generation
See `examples/generate_proof.rs` for a complete example.

### Custom Circuit
```rust
let circuit = XFGBurnCircuit::new(public_inputs, private_inputs);
let prover = XFGBurnProver::new(options);
let proof = prover.prove(circuit)?;
```

### Custom Verification
```rust
let verifier = XFGBurnVerifier::new(options);
let is_valid = verifier.verify(&proof)?;
```

## Troubleshooting

### Common Issues

1. **Proof Generation Fails**
   - Check input validation
   - Verify merkle proof correctness
   - Ensure merge mining proof is valid

2. **Verification Fails**
   - Verify proof integrity
   - Check public input consistency
   - Ensure correct proof options

3. **Performance Issues**
   - Use release builds
   - Enable optimizations
   - Consider caching

### Debug Mode
```bash
# Enable debug logging
RUST_LOG=debug cargo run --example generate_proof

# Enable trace logging
RUST_LOG=trace cargo test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- **Documentation**: [docs.rs/winterfell-xfg-proof](https://docs.rs/winterfell-xfg-proof)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)

## Roadmap

- [ ] **v1.1**: Recursive proof support
- [ ] **v1.2**: Optimized field arithmetic
- [ ] **v1.3**: GPU acceleration
- [ ] **v2.0**: Multi-chain support
- [ ] **v2.1**: Advanced privacy features 