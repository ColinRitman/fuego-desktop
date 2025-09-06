#!/bin/bash

# Download XFG STARK CLI from colinritman/xfgwin releases
# This script downloads the pre-built STARK CLI binary instead of building from source

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detect platform
PLATFORM=$(uname -s | tr '[:upper:]' '[:lower:]')
if [[ "$PLATFORM" == "darwin" ]]; then
    PLATFORM="macos"
elif [[ "$PLATFORM" == "linux" ]]; then
    PLATFORM="linux"
elif [[ "$PLATFORM" == "mingw"* ]] || [[ "$PLATFORM" == "cygwin"* ]]; then
    PLATFORM="windows"
else
    print_error "Unsupported platform: $PLATFORM"
    exit 1
fi

ASSET_NAME="xfg-stark-cli-$PLATFORM.tar.gz"
BINARY_NAME="xfg-stark-cli"
if [[ "$PLATFORM" == "windows" ]]; then
    BINARY_NAME="xfg-stark-cli.exe"
fi

print_info "🔥 Downloading XFG STARK CLI for $PLATFORM"
print_info "=========================================="

# Get latest release info
print_info "Fetching latest release information..."
RELEASE_INFO=$(curl -s https://api.github.com/repos/ColinRitman/xfgwin/releases/latest)

# Extract version and download URL
VERSION=$(echo "$RELEASE_INFO" | jq -r '.tag_name')
DOWNLOAD_URL=$(echo "$RELEASE_INFO" | jq -r ".assets[] | select(.name==\"$ASSET_NAME\") | .browser_download_url")

if [ -z "$DOWNLOAD_URL" ] || [ "$DOWNLOAD_URL" = "null" ]; then
    print_error "Could not find download URL for $ASSET_NAME"
    print_info "Available assets:"
    echo "$RELEASE_INFO" | jq -r '.assets[] | .name' | grep "xfg-stark-cli"
    exit 1
fi

print_info "Latest version: $VERSION"
print_info "Download URL: $DOWNLOAD_URL"

# Download the binary
print_info "Downloading $ASSET_NAME..."
curl -L -o "$ASSET_NAME" "$DOWNLOAD_URL"

if [ ! -f "$ASSET_NAME" ]; then
    print_error "Download failed"
    exit 1
fi

# Extract the binary
print_info "Extracting binary..."
tar -xzf "$ASSET_NAME"

if [ ! -f "$BINARY_NAME" ]; then
    print_error "Binary extraction failed"
    exit 1
fi

# Make binary executable (Unix systems)
if [[ "$PLATFORM" != "windows" ]]; then
    chmod +x "$BINARY_NAME"
fi

# Test the binary
print_info "Testing binary..."
if [[ "$PLATFORM" == "windows" ]]; then
    ./"$BINARY_NAME" --version
else
    ./"$BINARY_NAME" --version
fi

if [ $? -eq 0 ]; then
    print_success "✅ STARK CLI downloaded and verified successfully!"
    print_info "Binary: $BINARY_NAME"
    print_info "Version: $(./$BINARY_NAME --version)"
    
    # Clean up
    rm -f "$ASSET_NAME"
    
    print_info ""
    print_info "🚀 Usage:"
    print_info "  ./$BINARY_NAME --help"
    print_info "  ./scripts/auto_stark_proof.sh <tx_hash> <recipient> <amount>"
    print_info ""
    print_info "📚 Integration:"
    print_info "  The STARK CLI is now ready for use with Fuego Wallet"
    print_info "  Run './scripts/auto_stark_proof.sh' to test the integration"
    
else
    print_error "Binary test failed"
    exit 1
fi
