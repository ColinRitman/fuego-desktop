# 🚀 Update Fuego Wallet Build System and Release Workflows

## 📋 Overview

This PR updates the fuego-wallet build system and CI/CD workflows to enable fresh releases for all operating systems using the current fuego code from the cryptonote folder.

## ✨ Key Improvements

### 🔧 Build System Updates
- **CMake 3.10+**: Updated `CMakeLists.txt` to use modern CMake and fix deprecation warnings
- **Version Bump**: Updated to version 4.3.0.0 in `CryptoNoteWallet.cmake`
- **Submodule Fix**: Corrected `.gitmodules` to point to `usexfg/fuego.git`

### 🏗️ CI/CD Workflow Enhancements
- **Dedicated Release Workflow**: Created `.github/workflows/release.yml` for automated releases
- **Improved CI Workflow**: Enhanced `.github/workflows/ci.yml` with better error handling
- **Multi-Platform Support**: Proper builds for Linux, macOS, and Windows
- **Windows Build Fix**: Updated to use `nmake` and PowerShell for better reliability

### 🛠️ New Tools and Documentation
- **Release Script**: Added `scripts/create_release.sh` for manual builds
- **Comprehensive Documentation**: Created `RELEASE.md` with detailed release process
- **Better Error Handling**: Added fallbacks and improved error messages

## 📁 Files Changed

### Modified Files
- `.github/workflows/ci.yml` - Enhanced CI workflow with better platform support
- `.gitmodules` - Fixed cryptonote submodule URL
- `CMakeLists.txt` - Updated to CMake 3.10+ and fixed deprecation warnings
- `CryptoNoteWallet.cmake` - Bumped version to 4.3.0.0

### New Files
- `.github/workflows/release.yml` - Dedicated release workflow
- `scripts/create_release.sh` - Manual release script
- `RELEASE.md` - Comprehensive release documentation

## 🎯 Supported Platforms

- **Linux** (Ubuntu 22.04): Creates `.tar.gz` packages
- **macOS**: Creates `.tar.gz` packages with `.app` bundles  
- **Windows**: Creates `.zip` packages with `.exe` files

## 🚀 Release Process

### Automated Releases
1. Push a tag (e.g., `v4.3.0.0`)
2. GitHub Actions automatically builds for all platforms
3. Release is created with downloadable artifacts

### Manual Releases
```bash
./scripts/create_release.sh
```

## 🔍 Testing

- ✅ All workflows updated and tested
- ✅ Submodule references corrected
- ✅ Build configurations verified
- ✅ Release process documented

## 📝 Release Notes

This update enables:
- Fresh fuego-wallet releases for all operating systems
- Automated CI/CD pipeline with proper error handling
- Improved build system with modern CMake
- Comprehensive documentation for contributors
- Manual release tools for development

## 🔗 Related

- Closes: Build system modernization
- Addresses: Multi-platform release automation
- Improves: Developer experience and release process

---

**Ready for Review** ✅