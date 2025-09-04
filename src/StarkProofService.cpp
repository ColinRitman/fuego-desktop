#include "StarkProofService.h"

#include <QCoreApplication>
#include <QDir>
#include <QFile>
#include <QJsonDocument>
#include <QJsonObject>
#include <QProcess>
#include <QProcessEnvironment>
#include <QStandardPaths>
#include <QThread>
#include <QTimer>
#include <QMutex>
#include <QMutexLocker>

#include "WalletAdapter.h"
#include "Settings.h"

namespace WalletGui {

StarkProofService& StarkProofService::instance() {
  static StarkProofService inst;
  return inst;
}

StarkProofService::StarkProofService() 
  : QObject()
  , m_workerThread(nullptr)
  , m_worker(nullptr)
  , m_enabled(true) {
  
  // Create worker thread for proof generation
  m_workerThread = new QThread(this);
  m_worker = new ProofGenerationWorker();
  m_worker->moveToThread(m_workerThread);
  
  // Connect worker signals
  connect(m_worker, &ProofGenerationWorker::proofGenerationCompleted,
          this, &StarkProofService::onProofGenerationCompleted);
  connect(m_worker, &ProofGenerationWorker::proofGenerationProgress,
          this, &StarkProofService::proofGenerationProgress);
  
  // Start worker thread
  m_workerThread->start();
}

StarkProofService::~StarkProofService() {
  if (m_workerThread) {
    m_workerThread->quit();
    m_workerThread->wait();
  }
}

bool StarkProofService::isBurnTransaction(const QString& transactionHash, quint64 amount) {
  // Check if this is a burn transaction
  // For now, we'll consider any transaction with amount > 0 as a potential burn
  // In a real implementation, you'd check the transaction type/extra data
  return amount > 0 && !transactionHash.isEmpty();
}

void StarkProofService::generateStarkProof(const QString& transactionHash, 
                                          const QString& recipientAddress,
                                          quint64 burnAmount) {
  if (!m_enabled) {
    return;
  }
  
  QMutexLocker locker(&m_mutex);
  
  // Emit started signal
  Q_EMIT proofGenerationStarted(transactionHash);
  
  // Queue the proof generation in the worker thread
  QMetaObject::invokeMethod(m_worker, "generateProof", Qt::QueuedConnection,
                          Q_ARG(QString, transactionHash),
                          Q_ARG(QString, recipientAddress),
                          Q_ARG(quint64, burnAmount));
}

QString StarkProofService::getProofStatus(const QString& transactionHash) {
  // Return the current status of proof generation for this transaction
  // This would be stored in a map or database
  return "pending"; // Placeholder
}

bool StarkProofService::isEnabled() const {
  return m_enabled;
}

void StarkProofService::setEnabled(bool enabled) {
  m_enabled = enabled;
}

void StarkProofService::onProofGenerationCompleted(const QString& transactionHash, 
                                                   bool success, 
                                                   const QString& errorMessage) {
  QMutexLocker locker(&m_mutex);
  
  // Update status and error maps
  if (success) {
    m_statusMap[transactionHash] = "completed";
    m_progressMap[transactionHash] = 100;
    m_errorMap.remove(transactionHash);
  } else {
    m_statusMap[transactionHash] = "failed";
    m_errorMap[transactionHash] = errorMessage;
  }
  
  Q_EMIT proofGenerationCompleted(transactionHash, success, errorMessage);
}

void StarkProofService::retryProofGeneration(const QString& transactionHash) {
  // Get the original transaction details from storage or cache
  // For now, we'll just reset the status to allow retry
  QMutexLocker locker(&m_mutex);
  m_statusMap[transactionHash] = "pending";
  m_progressMap[transactionHash] = 0;
  m_errorMap.remove(transactionHash);
  
  // Re-emit the started signal
  Q_EMIT proofGenerationStarted(transactionHash);
}

int StarkProofService::getProofProgress(const QString& transactionHash) {
  QMutexLocker locker(&m_mutex);
  return m_progressMap.value(transactionHash, 0);
}

QString StarkProofService::getProofErrorMessage(const QString& transactionHash) {
  QMutexLocker locker(&m_mutex);
  return m_errorMap.value(transactionHash, "");
}

QString StarkProofService::getProofStatus(const QString& transactionHash) {
  QMutexLocker locker(&m_mutex);
  return m_statusMap.value(transactionHash, "none");
}

// ProofGenerationWorker implementation
class StarkProofService::ProofGenerationWorker : public QObject {
  Q_OBJECT

public:
  ProofGenerationWorker() : QObject() {}

public slots:
  void generateProof(const QString& transactionHash, 
                    const QString& recipientAddress,
                    quint64 burnAmount) {
    
    // Get the path to the auto-stark-proof script
    QString scriptPath = QCoreApplication::applicationDirPath() + "/auto_stark_proof.sh";
    
    // Check if script exists in different locations
    if (!QFile::exists(scriptPath)) {
      scriptPath = QCoreApplication::applicationDirPath() + "/scripts/auto_stark_proof.sh";
    }
    
    if (!QFile::exists(scriptPath)) {
      scriptPath = QCoreApplication::applicationDirPath() + "/../scripts/auto_stark_proof.sh";
    }
    
    // For development/testing
    if (!QFile::exists(scriptPath)) {
      scriptPath = QCoreApplication::applicationDirPath() + "/../scripts/auto_stark_proof.sh";
    }
    
    // For submodule setup
    if (!QFile::exists(scriptPath)) {
      scriptPath = QCoreApplication::applicationDirPath() + "/xfgwin/scripts/auto_stark_proof.sh";
    }
    
    if (!QFile::exists(scriptPath)) {
      Q_EMIT proofGenerationCompleted(transactionHash, false, "Auto STARK proof script not found");
      return;
    }
    
    // Make script executable
    QFile scriptFile(scriptPath);
    scriptFile.setPermissions(QFile::ReadOwner | QFile::WriteOwner | QFile::ExeOwner | 
                             QFile::ReadGroup | QFile::ExeGroup | 
                             QFile::ReadOther | QFile::ExeOther);
    
    // Run the auto-stark-proof script with transaction details
    QProcess process;
    
    QStringList arguments;
    arguments << transactionHash << recipientAddress << QString::number(burnAmount);
    
    // Set environment variables for the script
    QProcessEnvironment env = QProcessEnvironment::systemEnvironment();
    env.insert("FUEGO_AUTO_STARK_PROOF", "true");
    env.insert("FUEGO_ELDERNODE_VERIFICATION", "true");
    env.insert("FUEGO_ELDERNODE_TIMEOUT", "300");
    process.setProcessEnvironment(env);
    
    process.start(scriptPath, arguments);
    
    if (process.waitForFinished(300000)) { // 5 minute timeout
      if (process.exitCode() == 0) {
        Q_EMIT proofGenerationCompleted(transactionHash, true, "");
      } else {
        QString error = QString::fromUtf8(process.readAllStandardError());
        Q_EMIT proofGenerationCompleted(transactionHash, false, error);
      }
    } else {
      process.kill();
      Q_EMIT proofGenerationCompleted(transactionHash, false, "Proof generation timed out");
    }
  }

signals:
  void proofGenerationCompleted(const QString& transactionHash, bool success, const QString& errorMessage);
  void proofGenerationProgress(const QString& transactionHash, int progress);
};

} // namespace WalletGui

#include "StarkProofService.moc"
