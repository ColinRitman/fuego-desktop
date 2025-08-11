use thiserror::Error;

/// Encryption-specific errors
#[derive(Error, Debug)]
pub enum EncryptionError {
    #[error("FFI error: {0}")]
    FFIError(String),

    #[error("Invalid key size: expected {expected}, got {actual}")]
    InvalidKeySize { expected: usize, actual: usize },

    #[error("Invalid IV size: expected {expected}, got {actual}")]
    InvalidIVSize { expected: usize, actual: usize },

    #[error("Encryption failed: {0}")]
    EncryptionFailed(String),

    #[error("Decryption failed: {0}")]
    DecryptionFailed(String),

    #[error("Key generation failed: {0}")]
    KeyGenerationFailed(String),

    #[error("Invalid password: {0}")]
    InvalidPassword(String),

    #[error("Wallet encryption failed: {0}")]
    WalletEncryptionFailed(String),

    #[error("Wallet decryption failed: {0}")]
    WalletDecryptionFailed(String),

    #[error("Invalid data format: {0}")]
    InvalidDataFormat(String),

    #[error("Hardware acceleration not available: {0}")]
    HardwareAccelerationNotAvailable(String),

    #[error("Cache error: {0}")]
    CacheError(String),

    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("Internal error: {0}")]
    InternalError(String),

    #[error("Memory allocation failed: {0}")]
    MemoryAllocationFailed(String),

    #[error("Buffer overflow: {0}")]
    BufferOverflow(String),

    #[error("Invalid algorithm: {0}")]
    InvalidAlgorithm(String),
}

impl From<std::io::Error> for EncryptionError {
    fn from(err: std::io::Error) -> Self {
        EncryptionError::InternalError(err.to_string())
    }
}

impl From<serde_json::Error> for EncryptionError {
    fn from(err: serde_json::Error) -> Self {
        EncryptionError::InvalidDataFormat(err.to_string())
    }
}

impl From<anyhow::Error> for EncryptionError {
    fn from(err: anyhow::Error) -> Self {
        EncryptionError::InternalError(err.to_string())
    }
}

impl From<base64::DecodeError> for EncryptionError {
    fn from(err: base64::DecodeError) -> Self {
        EncryptionError::InvalidDataFormat(format!("Base64 decode error: {}", err))
    }
}

impl From<hex::FromHexError> for EncryptionError {
    fn from(err: hex::FromHexError) -> Self {
        EncryptionError::InvalidDataFormat(format!("Hex decode error: {}", err))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encryption_error_display() {
        let error = EncryptionError::InvalidKeySize { expected: 32, actual: 16 };
        assert!(error.to_string().contains("Invalid key size"));
        assert!(error.to_string().contains("32"));
        assert!(error.to_string().contains("16"));
    }

    #[test]
    fn test_encryption_error_from_io_error() {
        let io_error = std::io::Error::new(std::io::ErrorKind::NotFound, "File not found");
        let encryption_error: EncryptionError = io_error.into();
        
        match encryption_error {
            EncryptionError::InternalError(msg) => {
                assert!(msg.contains("File not found"));
            }
            _ => panic!("Expected InternalError"),
        }
    }

    #[test]
    fn test_encryption_error_from_serde_error() {
        let json_str = "{ invalid json }";
        let serde_error = serde_json::from_str::<serde_json::Value>(json_str).unwrap_err();
        let encryption_error: EncryptionError = serde_error.into();
        
        match encryption_error {
            EncryptionError::InvalidDataFormat(msg) => {
                assert!(msg.contains("expected"));
            }
            _ => panic!("Expected InvalidDataFormat"),
        }
    }
}