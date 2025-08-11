use thiserror::Error;

#[derive(Error, Debug, PartialEq)]
pub enum TxPoolError {
    #[error("Transaction pool is full")]
    PoolFull,
    
    #[error("Invalid transaction")]
    InvalidTransaction,
    
    #[error("Transaction not found")]
    TransactionNotFound,
    
    #[error("Insufficient fee")]
    InsufficientFee,
    
    #[error("Duplicate transaction")]
    DuplicateTransaction,
    
    #[error("Validation error: {0}")]
    ValidationError(String),
    
    #[error("Priority calculation error: {0}")]
    PriorityError(String),
    
    #[error("Fee calculation error: {0}")]
    FeeError(String),
    
    #[error("IO error: {0}")]
    IoError(String),
    
    #[error("Serialization error: {0}")]
    SerializationError(String),
}