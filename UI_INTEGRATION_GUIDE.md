# UI Integration Guide for STARK Proof Progress Tracking

This guide explains how to integrate elegant progress tracking and copy-paste functionality into the Fuego wallet user interface.

## Overview

The integration provides users with real-time progress updates during the STARK proof generation and Eldernode verification process, plus easy access to copy-paste the complete proof data for smart contract submission.

## UI Components to Add

### 1. Progress Tracking Widget

Add a progress tracking widget to the transaction history or overview screen:

```cpp
// In OverviewFrame.h
class ProgressTrackingWidget : public QWidget {
    Q_OBJECT

public:
    explicit ProgressTrackingWidget(QWidget* parent = nullptr);
    void updateProgress(const QString& transactionHash, int step, int totalSteps, 
                       const QString& stepName, const QString& message, const QString& status);
    void showCompletion(const QString& transactionHash);

private:
    QProgressBar* m_progressBar;
    QLabel* m_stepLabel;
    QLabel* m_messageLabel;
    QLabel* m_statusLabel;
    QPushButton* m_copyProofButton;
    QPushButton* m_openFileButton;
    
    void setupUI();
    void updateProgressBar(int current, int total);
    void updateStatusIcon(const QString& status);
};
```

### 2. Progress Update Integration

Integrate progress updates into the main wallet interface:

```cpp
// In OverviewFrame.cpp
void OverviewFrame::onBurnTransactionStarted(const QString& transactionHash) {
    // Show progress tracking widget
    m_progressWidget->show();
    m_progressWidget->updateProgress(transactionHash, 1, 3, 
                                   "STARK Proof Generation", 
                                   "Initializing cryptographic proof generation...", 
                                   "progress");
}

void OverviewFrame::onStarkProofProgress(const QString& transactionHash, int progress) {
    QString messages[] = {
        "Analyzing transaction data and creating proof inputs",
        "Generating cryptographic commitments and constraints", 
        "Computing FRI proof components",
        "Finalizing STARK proof structure",
        "Validating proof integrity and completeness"
    };
    
    if (progress < 5) {
        m_progressWidget->updateProgress(transactionHash, 1, 3,
                                       "STARK Proof Generation",
                                       messages[progress],
                                       "progress");
    }
}

void OverviewFrame::onStarkProofComplete(const QString& transactionHash) {
    m_progressWidget->updateProgress(transactionHash, 1, 3,
                                   "STARK Proof Generation",
                                   "Successfully generated cryptographic proof",
                                   "success");
}

void OverviewFrame::onEldernodeVerificationStart(const QString& transactionHash) {
    m_progressWidget->updateProgress(transactionHash, 2, 3,
                                   "Eldernode Verification",
                                   "Contacting Eldernode network...",
                                   "progress");
}

void OverviewFrame::onEldernodeVerificationComplete(const QString& transactionHash) {
    m_progressWidget->updateProgress(transactionHash, 2, 3,
                                   "Eldernode Verification", 
                                   "Burn transaction verified by Eldernode network",
                                   "success");
}

void OverviewFrame::onProcessComplete(const QString& transactionHash) {
    m_progressWidget->updateProgress(transactionHash, 3, 3,
                                   "Complete",
                                   "Ready for HEAT token minting!",
                                   "success");
    m_progressWidget->showCompletion(transactionHash);
}
```

### 3. Copy-Paste Functionality

Add buttons and functionality for easy proof data access:

```cpp
// In ProgressTrackingWidget.cpp
void ProgressTrackingWidget::setupUI() {
    QVBoxLayout* layout = new QVBoxLayout(this);
    
    // Progress bar
    m_progressBar = new QProgressBar();
    m_progressBar->setRange(0, 100);
    m_progressBar->setTextVisible(true);
    layout->addWidget(m_progressBar);
    
    // Step label
    m_stepLabel = new QLabel();
    m_stepLabel->setStyleSheet("font-weight: bold; font-size: 14px;");
    layout->addWidget(m_stepLabel);
    
    // Message label
    m_messageLabel = new QLabel();
    m_messageLabel->setWordWrap(true);
    layout->addWidget(m_messageLabel);
    
    // Status icon
    m_statusLabel = new QLabel();
    layout->addWidget(m_statusLabel);
    
    // Action buttons (hidden until completion)
    QHBoxLayout* buttonLayout = new QHBoxLayout();
    
    m_copyProofButton = new QPushButton("📋 Copy Proof Data");
    m_copyProofButton->setVisible(false);
    connect(m_copyProofButton, &QPushButton::clicked, this, &ProgressTrackingWidget::copyProofData);
    buttonLayout->addWidget(m_copyProofButton);
    
    m_openFileButton = new QPushButton("📁 Open Copy-Paste File");
    m_openFileButton->setVisible(false);
    connect(m_openFileButton, &QPushButton::clicked, this, &ProgressTrackingWidget::openCopyPasteFile);
    buttonLayout->addWidget(m_openFileButton);
    
    layout->addLayout(buttonLayout);
}

void ProgressTrackingWidget::copyProofData() {
    QString copyPasteFile = QString("/tmp/fuego-stark-proofs/copy_paste_%1.txt").arg(m_currentTxHash);
    
    if (QFile::exists(copyPasteFile)) {
        QFile file(copyPasteFile);
        if (file.open(QIODevice::ReadOnly | QIODevice::Text)) {
            QString content = file.readAll();
            
            // Extract STARK proof data section
            QRegExp starkSection("STARK PROOF DATA.*?\\n-+\\n(.*?)\\n\\n", Qt::CaseInsensitive);
            if (starkSection.indexIn(content) != -1) {
                QString proofData = starkSection.cap(1).trimmed();
                QApplication::clipboard()->setText(proofData);
                
                QMessageBox::information(this, "Proof Data Copied", 
                    "STARK proof data has been copied to clipboard!\n\n"
                    "You can now paste it into the HEAT minting contract.");
            } else {
                QMessageBox::warning(this, "Error", "Could not extract proof data from file.");
            }
        }
    } else {
        QMessageBox::warning(this, "File Not Found", 
            "Copy-paste file not found. Please wait for the process to complete.");
    }
}

void ProgressTrackingWidget::openCopyPasteFile() {
    QString copyPasteFile = QString("/tmp/fuego-stark-proofs/copy_paste_%1.txt").arg(m_currentTxHash);
    
    if (QFile::exists(copyPasteFile)) {
        QDesktopServices::openUrl(QUrl::fromLocalFile(copyPasteFile));
    } else {
        QMessageBox::warning(this, "File Not Found", 
            "Copy-paste file not found. Please wait for the process to complete.");
    }
}
```

### 4. Transaction History Integration

Update the transaction history to show STARK proof status:

```cpp
// In TransactionHistoryModel.cpp
void TransactionHistoryModel::updateStarkProofStatus(const QString& transactionHash, 
                                                    const QString& status) {
    for (int i = 0; i < rowCount(); ++i) {
        QModelIndex index = this->index(i, 0);
        QString txHash = data(index, TransactionHashRole).toString();
        
        if (txHash == transactionHash) {
            setData(index, status, StarkProofStatusRole);
            emit dataChanged(index, index);
            break;
        }
    }
}

// In TransactionHistoryDelegate.cpp
void TransactionHistoryDelegate::paint(QPainter* painter, 
                                       const QStyleOptionViewItem& option,
                                       const QModelIndex& index) const {
    // ... existing paint code ...
    
    // Add STARK proof status indicator
    QString starkStatus = index.data(StarkProofStatusRole).toString();
    if (!starkStatus.isEmpty()) {
        QRect statusRect = option.rect;
        statusRect.setLeft(statusRect.right() - 60);
        
        QString statusText;
        QColor statusColor;
        
        if (starkStatus == "completed") {
            statusText = "✅ HEAT Ready";
            statusColor = QColor(76, 175, 80); // Green
        } else if (starkStatus == "stark_pending") {
            statusText = "🔄 STARK";
            statusColor = QColor(255, 152, 0); // Orange
        } else if (starkStatus == "eldernode_pending") {
            statusText = "🔄 Eldernode";
            statusColor = QColor(156, 39, 176); // Purple
        } else if (starkStatus == "failed") {
            statusText = "❌ Failed";
            statusColor = QColor(244, 67, 54); // Red
        }
        
        painter->setPen(statusColor);
        painter->setFont(QFont("Arial", 8));
        painter->drawText(statusRect, Qt::AlignCenter, statusText);
    }
}
```

### 5. Settings Integration

Add STARK proof settings to the wallet settings dialog:

```cpp
// In SettingsDialog.cpp
void SettingsDialog::setupStarkProofSettings() {
    QGroupBox* starkGroup = new QGroupBox("STARK Proof Settings");
    QVBoxLayout* starkLayout = new QVBoxLayout(starkGroup);
    
    // Auto-generate proofs
    QCheckBox* autoGenerateCheck = new QCheckBox("Automatically generate STARK proofs after burn transactions");
    autoGenerateCheck->setChecked(Settings::instance().isAutoGenerateProofs());
    connect(autoGenerateCheck, &QCheckBox::toggled, [](bool checked) {
        Settings::instance().setAutoGenerateProofs(checked);
    });
    starkLayout->addWidget(autoGenerateCheck);
    
    // Default recipient address
    QLabel* recipientLabel = new QLabel("Default HEAT recipient address:");
    starkLayout->addWidget(recipientLabel);
    
    QLineEdit* recipientEdit = new QLineEdit();
    recipientEdit->setText(Settings::instance().getDefaultRecipientAddress());
    recipientEdit->setPlaceholderText("0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6");
    connect(recipientEdit, &QLineEdit::textChanged, [](const QString& text) {
        Settings::instance().setDefaultRecipientAddress(text);
    });
    starkLayout->addWidget(recipientEdit);
    
    // Show progress notifications
    QCheckBox* showProgressCheck = new QCheckBox("Show detailed progress notifications");
    showProgressCheck->setChecked(Settings::instance().isShowStarkProgress());
    connect(showProgressCheck, &QCheckBox::toggled, [](bool checked) {
        Settings::instance().setShowStarkProgress(checked);
    });
    starkLayout->addWidget(showProgressCheck);
    
    // Auto-open copy-paste file
    QCheckBox* autoOpenCheck = new QCheckBox("Automatically open copy-paste file when complete");
    autoOpenCheck->setChecked(Settings::instance().isAutoOpenCopyPasteFile());
    connect(autoOpenCheck, &QCheckBox::toggled, [](bool checked) {
        Settings::instance().setAutoOpenCopyPasteFile(checked);
    });
    starkLayout->addWidget(autoOpenCheck);
    
    m_mainLayout->addWidget(starkGroup);
}
```

## User Experience Flow

### 1. Burn Transaction Initiated

```
User clicks "Burn XFG" → Wallet shows progress widget → "Initializing STARK proof generation..."
```

### 2. STARK Proof Generation

```
Progress bar shows: [████████░░░░░░░░░░░░░░░░░░░░░░] 25%
Step: STARK Proof Generation
Message: "Analyzing transaction data and creating proof inputs..."
```

### 3. Eldernode Verification

```
Progress bar shows: [████████████████████░░░░░░░░░░] 66%
Step: Eldernode Verification  
Message: "Contacting Eldernode network to verify your burn transaction..."
```

### 4. Completion

```
Progress bar shows: [██████████████████████████████] 100%
Step: Complete
Message: "Ready for HEAT token minting!"
Buttons: [📋 Copy Proof Data] [📁 Open Copy-Paste File]
```

### 5. Copy-Paste File

The copy-paste file contains:

```
================================================================================
XFG BURN TO HEAT MINT - COMPLETE PROOF DATA
================================================================================
Generated: 2024-01-15 14:30:25 UTC
Transaction: a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6
Recipient: 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6
Burn Amount: 1000000000 XFG
HEAT Amount: 800000000 HEAT
Protocol Fee: 200000000 XFG (to treasury)
================================================================================

STARK PROOF DATA (for smart contract):
----------------------------------------
[HEX_ENCODED_PROOF_DATA_HERE]

ELDERNODE VERIFICATION DATA:
----------------------------------------
{
  "status": "verified",
  "verified_at": "2024-01-15T14:30:25Z",
  "network_consensus": true,
  "transaction_hash": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6",
  "burn_amount_xfg": 1000000000
}

SMART CONTRACT SUBMISSION INSTRUCTIONS:
----------------------------------------
• Copy the STARK PROOF DATA above
• Submit to HEAT minting contract with recipient address: 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6
• Include sufficient gas for transaction (recommended: 500,000 gas)
• Wait for confirmation and receive 800000000 HEAT tokens

================================================================================
Copy the STARK PROOF DATA above and submit to HEAT minting contract
================================================================================
```

## Benefits

1. **Real-time Progress**: Users see exactly what's happening
2. **Elegant Messaging**: Clear, user-friendly status messages
3. **Easy Copy-Paste**: One-click copying of proof data
4. **Visual Feedback**: Progress bars and status icons
5. **Complete Integration**: Seamless wallet experience

## Implementation Notes

- Progress updates are sent via Qt signals/slots
- Copy-paste functionality uses system clipboard
- Files are stored in `/tmp/fuego-stark-proofs/`
- Settings are persisted in wallet configuration
- UI updates are non-blocking and responsive

This integration provides users with a professional, user-friendly experience for the complete XFG burn to HEAT mint process!
