#pragma once

#include <QObject>
#include <QString>
#include <QThread>
#include <QMutex>
#include <atomic>

namespace WalletGui {

// Forward declaration
class ProofGenerationWorker;

class StarkProofService : public QObject {
  Q_OBJECT
  Q_DISABLE_COPY(StarkProofService)

public:
  static StarkProofService& instance();

  // Check if a transaction is a burn transaction that needs STARK proof
  bool isBurnTransaction(const QString& transactionHash, quint64 amount);
  
  // Generate STARK proof for a burn transaction
  void generateStarkProof(const QString& transactionHash, 
                         const QString& recipientAddress,
                         quint64 burnAmount);
  
  // Get proof status for a transaction
  QString getProofStatus(const QString& transactionHash);
  
  // Retry failed proof generation
  void retryProofGeneration(const QString& transactionHash);
  
  // Get progress for a transaction
  int getProofProgress(const QString& transactionHash);
  
  // Get error message for a transaction
  QString getProofErrorMessage(const QString& transactionHash);
  
  // Check if proof generation is enabled
  bool isEnabled() const;
  
  // Enable/disable automatic proof generation
  void setEnabled(bool enabled);

signals:
  void proofGenerationStarted(const QString& transactionHash);
  void proofGenerationCompleted(const QString& transactionHash, bool success, const QString& errorMessage);
  void proofGenerationProgress(const QString& transactionHash, int progress);

private:
  StarkProofService();
  ~StarkProofService();

  QThread* m_workerThread;
  ProofGenerationWorker* m_worker;
  QMutex m_mutex;
  std::atomic<bool> m_enabled;
  
  void onProofGenerationCompleted(const QString& transactionHash, bool success, const QString& errorMessage);
};

} // namespace WalletGui
