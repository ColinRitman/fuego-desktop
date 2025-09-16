# STARK Proof Integration Guide for Fuego Wallet

This guide explains how to integrate automatic STARK proof generation and Eldernode verification into the Fuego wallet backend.

## Overview

The STARK proof system allows users to automatically generate cryptographic proofs for XFG burn transactions and verify them with the Eldernode network, enabling them to mint HEAT tokens on Ethereum. This integration provides a seamless experience where users don't need to manually run CLI commands.

## Architecture

```
Fuego Wallet → Burn Transaction → STARK Proof → Eldernode Verification → HEAT Mint Ready
```

## Complete Process Flow

1. **Burn Transaction**: User sends XFG burn transaction
2. **STARK Proof Generation**: Wallet automatically generates cryptographic proof
3. **Eldernode Verification**: Proof is verified by Eldernode network
4. **HEAT Mint Ready**: Complete package ready for HEAT token minting

## Files Added

1. `scripts/auto_stark_proof.sh` - Main integration script with Eldernode verification
2. `scripts/stark_proof_generator.py` - Python alternative with complete process
3. `STARK_INTEGRATION_GUIDE.md` - This guide

## Integration Steps

### 1. Build the XFG STARK CLI

First, ensure the XFG STARK CLI is built and available:

```bash
cd xfgwin
cargo build --bin xfg-stark-cli
```

The CLI should be available at: `xfgwin/target/debug/xfg-stark-cli`

### 2. Modify Transaction Completion Handler

In `src/WalletAdapter.cpp`, modify the `onWalletSendTransactionCompleted` function:

```cpp
void WalletAdapter::onWalletSendTransactionCompleted(CryptoNote::TransactionId _transactionId, int _error, const QString& _errorText) {
  CryptoNote::WalletLegacyTransaction transaction;
  if (!this->getTransaction(_transactionId, transaction)) {
    return;
  }

  Q_EMIT walletTransactionCreatedSignal(_transactionId);

  save(true, true);
  
  // Auto-generate STARK proof and Eldernode verification for burn transactions
  if (_error == 0) { // Transaction successful
    QString txHash = QString::fromStdString(transaction.hash);
    quint64 amount = transaction.totalAmount;
    
    // Check if this is a burn transaction
    if (isBurnTransaction(txHash, amount)) {
      processBurnToHeat(txHash, amount);
    }
  }
}

// Add these helper functions
bool WalletAdapter::isBurnTransaction(const QString& txHash, quint64 amount) {
  // Check if transaction hash is valid (64 hex chars)
  QRegExp hexRegex("^[a-fA-F0-9]{64}$");
  if (!hexRegex.exactMatch(txHash)) {
    return false;
  }
  
  // Check if amount is positive
  if (amount <= 0) {
    return false;
  }
  
  // For now, consider any valid transaction as potential burn
  // In a real implementation, you'd check transaction type/extra data
  return true;
}

void WalletAdapter::processBurnToHeat(const QString& txHash, quint64 amount) {
  // Get recipient address from wallet settings or user input
  QString recipientAddress = getDefaultRecipientAddress(); // Implement this
  
  // Call the auto STARK proof script with Eldernode verification
  QString scriptPath = QCoreApplication::applicationDirPath() + "/scripts/auto_stark_proof.sh";
  QStringList arguments;
  arguments << txHash << recipientAddress << QString::number(amount);
  
  QProcess::startDetached(scriptPath, arguments);
}
```

### 3. Add UI Elements

In the transaction history or overview screen, add indicators for the complete process:

```cpp
// In OverviewFrame.cpp or similar
void OverviewFrame::updateTransactionStarkStatus(CryptoNote::TransactionId _id) {
  QString txHash = getTransactionHash(_id);
  QString processStatus = getBurnToHeatStatus(txHash);
  
  if (processStatus == "completed") {
    // Show green checkmark and "HEAT Ready" button
    showHeatMintButton(_id);
  } else if (processStatus == "stark_pending") {
    // Show spinner and "Generating STARK Proof..." text
    showStarkProgress(_id);
  } else if (processStatus == "eldernode_pending") {
    // Show spinner and "Eldernode Verification..." text
    showEldernodeProgress(_id);
  } else if (processStatus == "failed") {
    // Show red X and "Retry" button
    showProcessError(_id);
  }
}
```

### 4. Add Settings

Add STARK proof and Eldernode verification settings to the wallet configuration:

```cpp
// In Settings.h
class Settings {
public:
  // STARK Proof settings
  bool isStarkProofEnabled() const;
  void setStarkProofEnabled(bool enabled);
  
  QString getDefaultRecipientAddress() const;
  void setDefaultRecipientAddress(const QString& address);
  
  bool isAutoGenerateProofs() const;
  void setAutoGenerateProofs(bool enabled);
  
  // Eldernode verification settings
  bool isEldernodeVerificationEnabled() const;
  void setEldernodeVerificationEnabled(bool enabled);
  
  int getEldernodeTimeout() const;
  void setEldernodeTimeout(int seconds);
};
```

## Usage Flow

### Automatic Flow (Recommended)

1. User sends XFG burn transaction
2. Transaction completes successfully
3. Wallet automatically detects burn transaction
4. Wallet calls `auto_stark_proof.sh` script
5. Script generates STARK proof (Step 1)
6. Script performs Eldernode verification (Step 2)
7. Script creates complete package (Step 3)
8. UI shows "HEAT Ready" status
9. User can mint HEAT tokens

### Manual Flow (Fallback)

1. User sends XFG burn transaction
2. Transaction completes successfully
3. User manually clicks "Generate STARK Proof" button
4. Wallet calls script with transaction details
5. Script performs complete process (STARK + Eldernode)
6. UI shows "HEAT Ready" status

## Configuration

### Environment Variables

```bash
# Set default recipient address
export FUEGO_DEFAULT_RECIPIENT="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"

# Set CLI path (if different from default)
export XFG_STARK_CLI_PATH="/path/to/xfg-stark-cli"

# Enable/disable auto generation
export FUEGO_AUTO_STARK_PROOF="true"

# Enable/disable Eldernode verification
export FUEGO_ELDERNODE_VERIFICATION="true"

# Eldernode timeout (seconds)
export FUEGO_ELDERNODE_TIMEOUT="300"
```

### Wallet Settings

Users can configure the complete process behavior in the wallet settings:

- **Auto-generate proofs**: Automatically generate proofs after burn transactions
- **Eldernode verification**: Enable/disable Eldernode network verification
- **Default recipient address**: Ethereum address to receive HEAT tokens
- **Proof storage location**: Where to save generated proofs
- **Cleanup old proofs**: Automatically delete proofs older than X days
- **Eldernode timeout**: Timeout for Eldernode verification requests

## Error Handling

### Common Issues

1. **CLI not found**: Script will show error and instructions to build CLI
2. **Invalid transaction**: Script validates transaction hash and amount
3. **STARK proof generation timeout**: Script has 5-minute timeout with error message
4. **Eldernode verification timeout**: Script handles Eldernode network timeouts
5. **Network issues**: Script handles network errors gracefully

### Error Recovery

- **Retry mechanism**: Users can retry failed proof generation or verification
- **Manual mode**: Users can manually run CLI commands if auto-generation fails
- **Step-by-step recovery**: Users can retry individual steps (STARK or Eldernode)
- **Logging**: All proof generation and verification attempts are logged for debugging

## Testing

### Test Cases

1. **Valid burn transaction**: Should complete all steps successfully
2. **Invalid transaction hash**: Should show validation error
3. **Zero amount**: Should not trigger process
4. **CLI not available**: Should show helpful error message
5. **STARK generation timeout**: Should handle timeout gracefully
6. **Eldernode verification failure**: Should handle network issues
7. **Complete process success**: Should create final package

### Test Commands

```bash
# Test complete process with shell script
./scripts/auto_stark_proof.sh a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6 1000000000

# Test with Python script
python3 scripts/stark_proof_generator.py a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6 1000000000
```

## Security Considerations

1. **Transaction validation**: Always validate transaction hash and amount
2. **Recipient validation**: Validate Ethereum address format
3. **Eldernode verification**: Ensure burn transaction is verified by network
4. **File permissions**: Ensure proof files have appropriate permissions
5. **Cleanup**: Regularly clean up old proof files
6. **Logging**: Log proof generation and verification attempts for audit trail

## Performance Considerations

1. **Async processing**: Proof generation and verification run in background
2. **Timeout handling**: 5-minute timeout prevents hanging
3. **Resource cleanup**: Automatic cleanup of temporary files
4. **UI responsiveness**: Process doesn't block wallet UI
5. **Network resilience**: Handle Eldernode network issues gracefully

## Future Enhancements

1. **Batch processing**: Generate proofs for multiple transactions
2. **Progress tracking**: Real-time progress updates during each step
3. **Proof verification**: Verify generated proofs before showing "HEAT Ready"
4. **Network integration**: Direct integration with HEAT mint contracts
5. **Proof sharing**: Share proofs between wallet instances
6. **Eldernode selection**: Choose specific Eldernodes for verification

## Troubleshooting

### Script Not Found

```bash
# Check script permissions
ls -la scripts/auto_stark_proof.sh

# Make executable if needed
chmod +x scripts/auto_stark_proof.sh
```

### CLI Not Found

```bash
# Build the CLI
cd xfgwin
cargo build --bin xfg-stark-cli

# Check if it exists
ls -la target/debug/xfg-stark-cli
```

### Eldernode Verification Issues

```bash
# Check Eldernode network status
./xfg-stark-cli eldernode-status

# Test Eldernode connectivity
./xfg-stark-cli eldernode-test
```

### Permission Issues

```bash
# Check temp directory permissions
ls -la /tmp/fuego-stark-proofs/

# Create directory if needed
mkdir -p /tmp/fuego-stark-proofs
chmod 755 /tmp/fuego-stark-proofs
```

## Support

For issues with STARK proof and Eldernode verification integration:

1. Check the logs in `/tmp/fuego-stark-proofs/`
2. Verify CLI is built and executable
3. Test script manually with sample data
4. Check wallet settings for STARK proof configuration
5. Verify Eldernode network connectivity
6. Check individual step logs (STARK generation vs Eldernode verification)

## Conclusion

This integration provides a seamless experience for users to generate STARK proofs and verify them with the Eldernode network automatically after burn transactions. The complete process ensures that users can confidently mint HEAT tokens with verified proof packages.
