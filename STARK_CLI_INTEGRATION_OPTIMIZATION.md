# XFG STARK CLI Integration Optimization

## Overview

This document provides optimization guidelines for integrating the XFG STARK CLI with the Fuego Desktop wallet.

## STARK CLI Binary

The STARK CLI binary is automatically downloaded during the build process and included in the release packages. The binary is platform-specific:

- **Windows**: `bin/xfg-stark-cli.exe`
- **macOS**: `bin/xfg-stark-cli`
- **Linux**: `bin/xfg-stark-cli`

## Integration Scripts

### Auto STARK Proof Script

The `auto_stark_proof.sh` script provides automated STARK proof generation:

```bash
#!/bin/bash
# Auto STARK Proof Generation Script

CLI_PATH="./bin/xfg-stark-cli"

if [ ! -f "$CLI_PATH" ]; then
    echo "❌ STARK CLI binary not found at $CLI_PATH"
    exit 1
fi

echo "✅ STARK CLI found at $CLI_PATH"
echo "Version: $($CLI_PATH --version)"

# Generate STARK proof
$CLI_PATH --generate-proof --input-file input.json --output-file proof.json

echo "🚀 STARK proof generation complete!"
```

### Download Script

The `download-stark-cli.sh` script allows users to update the STARK CLI binary:

```bash
#!/bin/bash
# Download XFG STARK CLI from colinritman/xfgwin releases

PLATFORM=$(uname -s | tr '[:upper:]' '[:lower:]')
if [[ "$PLATFORM" == "darwin" ]]; then
  PLATFORM="macos"
elif [[ "$PLATFORM" == "linux" ]]; then
  PLATFORM="linux"
else
  echo "❌ Unsupported platform: $PLATFORM"
  exit 1
fi

ASSET_NAME="xfg-stark-cli-$PLATFORM.tar.gz"
BINARY_NAME="xfg-stark-cli"

echo "📥 Downloading STARK CLI for $PLATFORM..."

# Get download URL
DOWNLOAD_URL=$(curl -s https://api.github.com/repos/ColinRitman/xfgwin/releases/latest | jq -r ".assets[] | select(.name==\"$ASSET_NAME\") | .browser_download_url")

if [ -z "$DOWNLOAD_URL" ]; then
  echo "❌ Could not find download URL for $ASSET_NAME"
  exit 1
fi

# Download and extract
curl -L -o "$ASSET_NAME" "$DOWNLOAD_URL"
tar -xzf "$ASSET_NAME"
chmod +x "$BINARY_NAME"

echo "✅ STARK CLI downloaded successfully"
echo "Binary: $BINARY_NAME"
echo "Version: $($BINARY_NAME --version)"
```

## Build Integration

The STARK CLI is automatically integrated into the build process:

1. **Download**: Binary is downloaded during CI/CD
2. **Verification**: Binary is tested to ensure it works
3. **Packaging**: Binary is included in release packages
4. **Installation**: Binary is installed alongside the wallet

## Usage

### Command Line

```bash
# Check version
./bin/xfg-stark-cli --version

# Generate proof
./bin/xfg-stark-cli --generate-proof --input input.json --output proof.json

# Verify proof
./bin/xfg-stark-cli --verify-proof --proof proof.json
```

### Integration with Wallet

The STARK CLI can be integrated with the wallet through:

1. **Automatic Proof Generation**: Generate proofs for transactions
2. **Proof Verification**: Verify proofs from other users
3. **Privacy Enhancement**: Enable privacy-preserving transactions

## Troubleshooting

### Common Issues

1. **Binary Not Found**: Ensure the binary is in the correct path
2. **Permission Denied**: Make sure the binary has execute permissions
3. **Version Mismatch**: Update to the latest version if needed

### Debug Commands

```bash
# Check binary location
ls -la bin/xfg-stark-cli*

# Check permissions
ls -la bin/xfg-stark-cli

# Test binary
./bin/xfg-stark-cli --help
```

## Updates

The STARK CLI is automatically updated during the build process. Users can also manually update using the download script.

## Support

For issues with STARK CLI integration:

1. Check the binary is correctly downloaded
2. Verify permissions are set correctly
3. Test with the provided scripts
4. Check the GitHub repository for updates

## Version Information

- **Current Version**: v0.8.8
- **Repository**: https://github.com/colinritman/xfgwin
- **Release URL**: https://github.com/colinritman/xfgwin/releases/latest