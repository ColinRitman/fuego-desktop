use thiserror::Error;

#[derive(Error, Debug)]
pub enum CommitmentError {
    #[error("Hash calculation error: {0}")]
    HashError(String),
    
    #[error("Invalid commitment data: {0}")]
    InvalidData(String),
    
    #[error("Verification failed: {0}")]
    VerificationFailed(String),
    
    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),
}