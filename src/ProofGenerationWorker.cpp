#include "ProofGenerationWorker.h"

#include <QCoreApplication>
#include <QDir>
#include <QFile>
#include <QJsonDocument>
#include <QJsonObject>
#include <QProcess>
#include <QProcessEnvironment>
#include <QThread>
#include <QTimer>
#include <QMutex>
#include <QMutexLocker>

#include "WalletAdapter.h"
#include "Settings.h"

namespace WalletGui {

ProofGenerationWorker::ProofGenerationWorker() : QObject() {}

void ProofGenerationWorker::generateProof(const QString& transactionHash,
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

} // namespace WalletGui

#include "ProofGenerationWorker.moc"
