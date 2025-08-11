use thiserror::Error;

#[derive(Error, Debug)]
pub enum ConsensusError {
    #[error("Consensus is not running")]
    ConsensusNotRunning,
    
    #[error("Invalid block proposal: {0}")]
    InvalidBlockProposal(String),
    
    #[error("Block validation failed: {0}")]
    BlockValidationFailed(String),
    
    #[error("HotStuff consensus error: {0}")]
    HotStuffError(String),
    
    #[error("PoW mining error: {0}")]
    PoWMiningError(String),
    
    #[error("FFI error: {0}")]
    FFIError(String),
    
    #[error("Network error: {0}")]
    NetworkError(String),
    
    #[error("State error: {0}")]
    StateError(String),
    
    #[error("Configuration error: {0}")]
    ConfigError(String),
    
    #[error("Serialization error: {0}")]
    SerializationError(String),
    
    #[error("IO error: {0}")]
    IoError(String),
    
    #[error("Block sync error: {0}")]
    BlockSyncError(String),
    
    #[error("Unknown error: {0}")]
    Unknown(String),
}

impl From<std::io::Error> for ConsensusError {
    fn from(err: std::io::Error) -> Self {
        ConsensusError::IoError(err.to_string())
    }
}

impl From<serde_json::Error> for ConsensusError {
    fn from(err: serde_json::Error) -> Self {
        ConsensusError::SerializationError(err.to_string())
    }
}

impl From<anyhow::Error> for ConsensusError {
    fn from(err: anyhow::Error) -> Self {
        ConsensusError::Unknown(err.to_string())
    }
}

// Manual conversion for BlockSyncError since it's not re-exported
impl From<block_sync::error::BlockSyncError> for ConsensusError {
    fn from(err: block_sync::error::BlockSyncError) -> Self {
        ConsensusError::BlockSyncError(err.to_string())
    }
}