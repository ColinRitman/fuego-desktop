use thiserror::Error;

#[derive(Error, Debug)]
pub enum BridgeError {
    #[error("Bridge is not running")]
    BridgeNotRunning,
    
    #[error("Invalid header")]
    InvalidHeader,
    
    #[error("Arbitrum client error: {0}")]
    ArbitrumError(String),
    
    #[error("Fuego verification error: {0}")]
    FuegoError(String),
    
    #[error("Relayer error: {0}")]
    RelayerError(String),
    
    #[error("Proof submission error: {0}")]
    ProofSubmissionError(String),
    
    #[error("Network error: {0}")]
    NetworkError(String),
    
    #[error("Configuration error: {0}")]
    ConfigError(String),
    
    #[error("Serialization error: {0}")]
    SerializationError(String),
    
    #[error("IO error: {0}")]
    IoError(String),
    
    #[error("Timeout error: {0}")]
    TimeoutError(String),
    
    #[error("Unknown error: {0}")]
    Unknown(String),
}

impl From<std::io::Error> for BridgeError {
    fn from(err: std::io::Error) -> Self {
        BridgeError::IoError(err.to_string())
    }
}

impl From<serde_json::Error> for BridgeError {
    fn from(err: serde_json::Error) -> Self {
        BridgeError::SerializationError(err.to_string())
    }
}

impl From<anyhow::Error> for BridgeError {
    fn from(err: anyhow::Error) -> Self {
        BridgeError::Unknown(err.to_string())
    }
}

impl From<block_sync::error::BlockSyncError> for BridgeError {
    fn from(err: block_sync::error::BlockSyncError) -> Self {
        BridgeError::FuegoError(err.to_string())
    }
}