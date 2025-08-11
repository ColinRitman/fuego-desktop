use thiserror::Error;

#[derive(Error, Debug)]
pub enum BlockSyncError {
    #[error("FFI error: {0}")]
    FFIError(String),
    
    #[error("Block validation failed")]
    BlockValidationFailed,
    
    #[error("Invalid timestamp")]
    InvalidTimestamp,
    
    #[error("Invalid genesis block")]
    InvalidGenesisBlock,
    
    #[error("Transaction validation failed")]
    TransactionValidationFailed,
    
    #[error("Proof validation failed")]
    ProofValidationFailed,
    
    #[error("Block not found")]
    BlockNotFound,
    
    #[error("Sync error: {0}")]
    SyncError(String),
    
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
    
    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),
}