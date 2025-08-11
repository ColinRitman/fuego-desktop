use crate::error::BridgeError;
use block_sync::BlockHeader;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio::time::{Duration, Instant};

/// Header verification result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeaderVerification {
    pub is_valid: bool,
    pub verification_time: Duration,
    pub error_message: Option<String>,
}

/// Fuego header verifier
pub struct FuegoHeaderVerifier {
    rpc_url: String,
    verified_headers: Arc<RwLock<std::collections::HashMap<[u8; 32], HeaderVerification>>>,
    last_verification_time: Arc<RwLock<Instant>>,
}

impl FuegoHeaderVerifier {
    /// Create a new Fuego header verifier
    pub fn new(rpc_url: String) -> Result<Self, BridgeError> {
        Ok(Self {
            rpc_url,
            verified_headers: Arc::new(RwLock::new(std::collections::HashMap::new())),
            last_verification_time: Arc::new(RwLock::new(Instant::now())),
        })
    }
    
    /// Verify a Fuego header
    pub async fn verify_header(&self, header: &BlockHeader) -> Result<HeaderVerification, BridgeError> {
        let start_time = Instant::now();
        
        // In a real implementation, this would make an RPC call to Fuego
        // For now, we'll simulate the verification
        
        // Simulate network delay
        tokio::time::sleep(Duration::from_millis(50)).await;
        
        // Basic validation
        let is_valid = self.validate_header_basic(header)?;
        
        let verification_time = start_time.elapsed();
        
        let verification = HeaderVerification {
            is_valid,
            verification_time,
            error_message: if is_valid { None } else { Some("Header validation failed".to_string()) },
        };
        
        // Store verification result
        let header_hash = header.hash()?;
        self.verified_headers.write().await.insert(header_hash, verification.clone());
        
        // Update last verification time
        *self.last_verification_time.write().await = Instant::now();
        
        println!("Header verified: height {}, valid: {}", header.height, is_valid);
        
        Ok(verification)
    }
    
    /// Basic header validation
    fn validate_header_basic(&self, header: &BlockHeader) -> Result<bool, BridgeError> {
        // Check if height is valid
        if header.height == 0 && header.prev_hash != [0u8; 32] {
            return Ok(false);
        }
        
        // Check if timestamp is reasonable
        let current_time = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        if header.timestamp > current_time + 3600 {
            // Header timestamp is more than 1 hour in the future
            return Ok(false);
        }
        
        // Check if difficulty is reasonable
        if header.difficulty == 0 {
            return Ok(false);
        }
        
        Ok(true)
    }
    
    /// Get verification result for a header
    pub async fn get_verification_result(&self, header_hash: &[u8; 32]) -> Option<HeaderVerification> {
        self.verified_headers.read().await.get(header_hash).cloned()
    }
    
    /// Get all verified headers
    pub async fn get_all_verified_headers(&self) -> Vec<HeaderVerification> {
        self.verified_headers.read().await.values().cloned().collect()
    }
    
    /// Get last verification time
    pub async fn get_last_verification_time(&self) -> Instant {
        *self.last_verification_time.read().await
    }
    
    /// Check if Fuego is accessible
    pub async fn is_accessible(&self) -> bool {
        // In a real implementation, this would ping the RPC endpoint
        // For now, we'll return true
        true
    }
    
    /// Get RPC URL
    pub fn get_rpc_url(&self) -> &str {
        &self.rpc_url
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_fuego_verifier_creation() {
        let verifier = FuegoHeaderVerifier::new("http://localhost:8080".to_string());
        assert!(verifier.is_ok());
    }
    
    #[tokio::test]
    async fn test_header_verification() {
        let verifier = FuegoHeaderVerifier::new("http://localhost:8080".to_string()).unwrap();
        
        let header = BlockHeader {
            height: 1,
            prev_hash: [0u8; 32],
            merkle_root: [0u8; 32],
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            difficulty: 1000,
            nonce: 0,
        };
        
        let result = verifier.verify_header(&header).await;
        assert!(result.is_ok());
        
        let verification = result.unwrap();
        assert!(verification.is_valid);
    }
    
    #[tokio::test]
    async fn test_invalid_header_verification() {
        let verifier = FuegoHeaderVerifier::new("http://localhost:8080".to_string()).unwrap();
        
        // Create invalid header (genesis with non-zero prev_hash)
        let header = BlockHeader {
            height: 0,
            prev_hash: [1u8; 32], // Invalid for genesis
            merkle_root: [0u8; 32],
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            difficulty: 1000,
            nonce: 0,
        };
        
        let result = verifier.verify_header(&header).await;
        assert!(result.is_ok());
        
        let verification = result.unwrap();
        assert!(!verification.is_valid);
    }
    
    #[tokio::test]
    async fn test_verification_result_retrieval() {
        let verifier = FuegoHeaderVerifier::new("http://localhost:8080".to_string()).unwrap();
        
        let header = BlockHeader {
            height: 1,
            prev_hash: [0u8; 32],
            merkle_root: [0u8; 32],
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            difficulty: 1000,
            nonce: 0,
        };
        
        // Verify header
        verifier.verify_header(&header).await.unwrap();
        
        // Get verification result
        let header_hash = header.hash().unwrap();
        let result = verifier.get_verification_result(&header_hash).await;
        assert!(result.is_some());
        
        let verification = result.unwrap();
        assert!(verification.is_valid);
    }
    
    #[tokio::test]
    async fn test_fuego_accessibility() {
        let verifier = FuegoHeaderVerifier::new("http://localhost:8080".to_string()).unwrap();
        
        let is_accessible = verifier.is_accessible().await;
        assert!(is_accessible);
    }
}