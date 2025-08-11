# Fuego Wallet Release Process

This document describes the process for creating fresh fuego-wallet releases for all operating systems.

## Overview

Fuego Wallet is a Qt-based cryptocurrency wallet for the Fuego (XFG) network. This repository contains the wallet application that connects to the Fuego blockchain.

## Prerequisites

### For Linux Builds:
- Qt5 development packages
- Boost libraries
- CMake
- Build tools (gcc, make)

### For macOS Builds:
- Qt5 (via Homebrew)
- Boost libraries
- CMake
- Xcode Command Line Tools

### For Windows Builds:
- Qt5 SDK
- Boost libraries
- CMake
- Visual Studio Build Tools

## Build Process

### Automated Builds (Recommended)

The project uses GitHub Actions for automated builds and releases:

1. **CI Workflow** (`.github/workflows/ci.yml`):
   - Runs on every push to main/master branches
   - Builds for all platforms (Linux, macOS, Windows)
   - Creates artifacts for testing

2. **Release Workflow** (`.github/workflows/release.yml`):
   - Triggers on tag pushes (e.g., `v4.3.0.0`)
   - Builds release versions for all platforms
   - Creates GitHub releases with downloadable artifacts

### Manual Builds

#### Using the Release Script

```bash
# Make sure you're in the project root
./scripts/create_release.sh
```

This script will:
- Detect your current platform
- Build the wallet for your platform
- Create a release package in `releases/v{VERSION}/`

#### Manual Build Commands

**Linux:**
```bash
make clean
make -j$(nproc) build-release
```

**macOS:**
```bash
make clean
qmake Fuego-GUI.pro
make -j$(sysctl -n hw.ncpu)
```

**Windows:**
```bash
make clean
qmake Fuego-GUI.pro "CONFIG+=release"
nmake -f Makefile.Release
```

## Release Process

### 1. Update Version

Edit `CryptoNoteWallet.cmake` and update the version:
```cmake
set(CN_VERSION 4.3.0.0)
```

### 2. Commit Changes

```bash
git add .
git commit -m "Bump version to 4.3.0.0"
git push origin main
```

### 3. Create Release Tag

```bash
git tag v4.3.0.0
git push origin v4.3.0.0
```

### 4. Monitor Builds

- Check GitHub Actions for build status
- Verify all platforms build successfully
- Review the generated release

## Project Structure

```
fuego-wallet/
├── src/                    # Main wallet source code
├── cryptonote/            # Fuego blockchain core (submodule)
├── libqrencode/           # QR code generation library (submodule)
├── .github/workflows/     # CI/CD workflows
├── scripts/               # Build and release scripts
├── CMakeLists.txt         # CMake build configuration
├── Fuego-GUI.pro          # Qt project file
└── Makefile               # Build targets
```

## Dependencies

### Submodules
- `cryptonote`: Fuego blockchain core from https://github.com/usexfg/fuego.git
- `libqrencode`: QR code generation library

### External Dependencies
- Qt5 (Gui, Widgets, Network, Charts)
- Boost (date_time, filesystem, program_options, regex, serialization, system, thread, chrono)

## Troubleshooting

### Common Issues

1. **Qt5 not found**: Install Qt5 development packages for your platform
2. **Boost not found**: Install Boost libraries (version 1.55 or higher)
3. **Submodule issues**: Run `git submodule update --init --recursive`
4. **Build failures**: Check that all dependencies are properly installed

### Platform-Specific Notes

**Linux:**
- Ensure Qt5 is in your PATH
- Install all required development packages

**macOS:**
- Use Homebrew for Qt5 installation
- Set Qt5 PATH: `export PATH="/usr/local/opt/qt@5/bin:$PATH"`

**Windows:**
- Install Qt5 SDK and set PATH
- Use Visual Studio Build Tools
- Ensure Boost libraries are properly configured

## Version History

- 4.3.0.0: Current version with updated build system
- 4.2.0.1: Previous stable release

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test builds on your platform
5. Submit a pull request

## Support

For issues and questions:
- GitHub Issues: https://github.com/usexfg/fuego-wallet/issues
- Community: https://github.com/usexfg/