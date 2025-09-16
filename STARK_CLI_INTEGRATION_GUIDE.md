# XFG STARK CLI Integration Guide for Fuego Desktop Wallet

## Overview

This guide explains how to integrate the XFG STARK CLI with the Fuego desktop wallet, enabling automatic STARK proof generation for XFG burn transactions.

## 🔗 Integration Methods

### Method 1: Automated Build Script (Recommended)

The easiest way to integrate the STARK CLI is using the provided build script:

```bash
# Run the automated build script
./build_with_stark.sh
```

This script will:
1. Build the XFG STARK CLI from source
2. Build the Fuego wallet
3. Copy the STARK CLI and scripts to the wallet directory
4. Create an installation package
5. Test the integration

### Method 2: Manual Integration

If you prefer manual control, follow these steps:

#### Step 1: Build STARK CLI
```bash
# Navigate to STARK CLI directory
cd ../xfgwin

# Build the CLI
cargo build --bin xfg-stark-cli --release

# Verify the build
./target/release/xfg-stark-cli --help
```

#### Step 2: Build Fuego Wallet
```bash
# Navigate back to wallet directory
cd ../fuego-wallet

# Create build directory
mkdir build && cd build

# Configure and build
cmake -DCMAKE_BUILD_TYPE=Release ..
make -j$(nproc)
```

#### Step 3: Copy STARK CLI to Wallet
```bash
# Copy STARK CLI to wallet build directory
cp ../xfgwin/target/release/xfg-stark-cli ./

# Copy scripts
cp ../scripts/auto_stark_proof.sh ./
cp ../scripts/stark_proof_generator.py ./
cp ../scripts/progress_logger.py ./

# Make scripts executable
chmod +x *.sh *.py
```

### Method 3: CMake Integration (Advanced)

The CMakeLists.txt has been updated to automatically build and include the STARK CLI:

```bash
# Build with CMake (includes STARK CLI)
mkdir build && cd build
cmake -DCMAKE_BUILD_TYPE=Release ..
make -j$(nproc)
make install
```

## 📁 File Structure After Integration

```
fuego-wallet/
├── fuegowallet                    # Main wallet binary
├── xfg-stark-cli                  # STARK CLI binary
├── auto_stark_proof.sh            # Auto-proof generation script
├── stark_proof_generator.py       # Python proof generator
├── progress_logger.py             # Progress logging utility
└── scripts/                       # Additional scripts
    ├── auto_stark_proof.sh
    ├── stark_proof_generator.py
    └── progress_logger.py
```

## 🔧 Configuration

### Wallet Settings

The wallet automatically configures STARK proof generation through the settings:

```cpp
// Enable STARK proof generation
Settings::instance().setStarkProofEnabled(true);

// Set default recipient address
Settings::instance().setDefaultRecipientAddress("0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6");

// Enable auto-generation
Settings::instance().setAutoGenerateProofs(true);

// Configure Eldernode verification
Settings::instance().setEldernodeVerificationEnabled(true);
Settings::instance().setEldernodeTimeout(300);
```

### Environment Variables

You can also configure via environment variables:

```bash
export FUEGO_AUTO_STARK_PROOF="true"
export FUEGO_ELDERNODE_VERIFICATION="true"
export FUEGO_ELDERNODE_TIMEOUT="300"
export FUEGO_DEFAULT_RECIPIENT="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
```

## 🧪 Testing the Integration

### Test STARK CLI
```bash
# Test CLI functionality
./xfg-stark-cli --help

# Test proof generation (with test data)
./auto_stark_proof.sh 7D0725F8E03021B99560ADD456C596FEA7D8DF23529E23765E56923B73236E4D 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6 8000000
```

### Test Wallet Integration
1. Start the Fuego wallet
2. Send a burn transaction
3. Check transaction list for STARK status indicators
4. Verify proof generation in background

## 🚀 Usage Flow

### Automatic Flow
1. **User sends XFG burn transaction**
2. **Wallet detects burn transaction**
3. **STARK proof generation starts automatically**
4. **Eldernode verification performed**
5. **Complete package created for HEAT minting**
6. **UI shows "HEAT Ready" status**

### Manual Flow
1. **User sends XFG burn transaction**
2. **User manually triggers proof generation**
3. **STARK CLI generates proof**
4. **User verifies with Eldernode network**
5. **User mints HEAT tokens**

## 🔍 Troubleshooting

### Common Issues

#### STARK CLI Not Found
```bash
# Check if CLI exists
ls -la xfg-stark-cli

# Rebuild if missing
cd ../xfgwin
cargo build --bin xfg-stark-cli --release
cp target/release/xfg-stark-cli ../fuego-wallet/
```

#### Script Permissions
```bash
# Fix script permissions
chmod +x auto_stark_proof.sh
chmod +x stark_proof_generator.py
chmod +x progress_logger.py
```

#### Build Errors
```bash
# Clean and rebuild
cd ../xfgwin
cargo clean
cargo build --bin xfg-stark-cli --release

cd ../fuego-wallet
rm -rf build
mkdir build && cd build
cmake -DCMAKE_BUILD_TYPE=Release ..
make -j$(nproc)
```

### Debug Mode

Enable debug logging:

```bash
# Set debug environment variables
export FUEGO_DEBUG_STARK="true"
export FUEGO_STARK_LOG_LEVEL="debug"

# Run wallet with debug output
./fuegowallet 2>&1 | tee wallet_debug.log
```

## 📦 Distribution

### Creating Distribution Packages

#### Linux Package
```bash
# Create Debian package
cpack -G DEB

# Create RPM package
cpack -G RPM
```

#### macOS Package
```bash
# Create DMG package
cpack -G DragNDrop
```

#### Windows Package
```bash
# Create ZIP package
cpack -G ZIP
```

### Package Contents

Each distribution package includes:
- `fuegowallet` - Main wallet binary
- `xfg-stark-cli` - STARK CLI binary
- `auto_stark_proof.sh` - Auto-proof generation script
- `stark_proof_generator.py` - Python proof generator
- `progress_logger.py` - Progress logging utility
- Documentation and license files

## 🔒 Security Considerations

### File Permissions
- STARK CLI and scripts have executable permissions
- Proof files are stored in secure temporary directory
- Private keys are never stored in plain text

### Network Security
- Eldernode verification uses secure connections
- Proof validation includes cryptographic verification
- Network timeouts prevent hanging connections

### Input Validation
- All user inputs are validated before processing
- Ethereum addresses are verified for correct format
- Transaction hashes are validated for proper length

## 📊 Performance

### Optimization Tips

1. **Parallel Processing**: Multiple proofs can be generated simultaneously
2. **Caching**: Proof results are cached to avoid regeneration
3. **Background Processing**: Proof generation doesn't block wallet UI
4. **Resource Management**: Automatic cleanup of temporary files

### Resource Requirements

- **CPU**: 2+ cores recommended for proof generation
- **Memory**: 4GB+ RAM for large proof operations
- **Storage**: 100MB+ for proof files and cache
- **Network**: Stable internet connection for Eldernode verification

## 🔄 Updates and Maintenance

### Updating STARK CLI
```bash
# Update STARK CLI source
cd ../xfgwin
git pull origin main

# Rebuild CLI
cargo build --bin xfg-stark-cli --release

# Copy to wallet
cp target/release/xfg-stark-cli ../fuego-wallet/
```

### Updating Wallet
```bash
# Update wallet source
git pull origin main

# Rebuild wallet
cd build
cmake -DCMAKE_BUILD_TYPE=Release ..
make -j$(nproc)
```

## 📞 Support

### Getting Help

1. **Check logs**: Look for error messages in wallet logs
2. **Test CLI**: Verify STARK CLI works independently
3. **Check permissions**: Ensure scripts are executable
4. **Verify paths**: Confirm all files are in correct locations

### Debug Information

When reporting issues, include:
- Operating system and version
- Fuego wallet version
- STARK CLI version
- Error messages and logs
- Steps to reproduce the issue

## Conclusion

The XFG STARK CLI integration provides seamless automatic proof generation for Fuego wallet users. The integration is designed to be:

- **Easy to install**: Automated build script handles everything
- **Reliable**: Comprehensive error handling and recovery
- **Secure**: Proper validation and security measures
- **User-friendly**: Clear status indicators and configuration options

Users can now automatically generate STARK proofs for their XFG burn transactions and convert them to HEAT tokens without manual intervention.
