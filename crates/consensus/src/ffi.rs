use crate::error::ConsensusError;
use std::sync::Arc;
use tokio::sync::RwLock;

#[cfg(feature = "ffi")]
use cxx::UniquePtr;

// FFI bridge to C++ Fuego hash function
#[cfg(feature = "ffi")]
#[cxx::bridge(namespace = "fuego")]
mod ffi {
    unsafe extern "C++" {
        include!("consensus/include/fuego_hash.h");
        
        type FuegoHashImpl;
        
        fn new_fuego_hash() -> UniquePtr<FuegoHashImpl>;
        fn hash_data(self: &FuegoHashImpl, data: &[u8]) -> Vec<u8>;
        fn hash_block_header(self: &FuegoHashImpl, header_data: &[u8]) -> Vec<u8>;
        fn verify_hash(self: &FuegoHashImpl, data: &[u8], expected_hash: &[u8]) -> bool;
    }
}

/// Fuego hash function wrapper
pub struct FuegoHash {
    #[cfg(feature = "ffi")]
    inner: UniquePtr<ffi::FuegoHashImpl>,
    cache: Arc<RwLock<std::collections::HashMap<Vec<u8>, Vec<u8>>>>,
}

impl FuegoHash {
    /// Create a new Fuego hash instance
    pub fn new() -> Result<Self, ConsensusError> {
        #[cfg(feature = "ffi")]
        {
            let inner = ffi::new_fuego_hash();
            if inner.is_null() {
                return Err(ConsensusError::FFIError("Failed to create Fuego hash instance".to_string()));
            }
            
            Ok(Self {
                inner,
                cache: Arc::new(RwLock::new(std::collections::HashMap::new())),
            })
        }
        
        #[cfg(not(feature = "ffi"))]
        {
            Ok(Self {
                cache: Arc::new(RwLock::new(std::collections::HashMap::new())),
            })
        }
    }
    
    /// Hash arbitrary data
    pub fn hash(&self, data: &[u8]) -> Result<[u8; 32], ConsensusError> {
        // Check cache first
        let cache_key = data.to_vec();
        {
            let cache = self.cache.blocking_read();
            if let Some(cached_hash) = cache.get(&cache_key) {
                if cached_hash.len() == 32 {
                    let mut result = [0u8; 32];
                    result.copy_from_slice(cached_hash);
                    return Ok(result);
                }
            }
        }
        
        #[cfg(feature = "ffi")]
        {
            // Hash the data using FFI
            let hash_result = self.inner.hash_data(data);
            if hash_result.len() != 32 {
                return Err(ConsensusError::FFIError("Invalid hash length".to_string()));
            }
            
            // Convert to fixed-size array
            let mut result = [0u8; 32];
            result.copy_from_slice(&hash_result);
            
            // Cache the result
            {
                let mut cache = self.cache.blocking_write();
                cache.insert(cache_key, hash_result);
            }
            
            Ok(result)
        }
        
        #[cfg(not(feature = "ffi"))]
        {
            // Mock implementation using Blake2b
            use blake2::{Blake2b, Digest};
            
            let mut hasher = Blake2b::new();
            hasher.update(data);
            let result: [u8; 64] = hasher.finalize().into();
            let hash_result = result[..32].to_vec();
            
            // Cache the result
            {
                let mut cache = self.cache.blocking_write();
                cache.insert(cache_key, hash_result);
            }
            
            Ok(result[..32].try_into().unwrap())
        }
    }
    
    /// Hash block header data
    pub fn hash_block_header(&self, header_data: &[u8]) -> Result<[u8; 32], ConsensusError> {
        #[cfg(feature = "ffi")]
        {
            let hash_result = self.inner.hash_block_header(header_data);
            if hash_result.len() != 32 {
                return Err(ConsensusError::FFIError("Invalid block header hash length".to_string()));
            }
            
            let mut result = [0u8; 32];
            result.copy_from_slice(&hash_result);
            Ok(result)
        }
        
        #[cfg(not(feature = "ffi"))]
        {
            self.hash(header_data)
        }
    }
    
    /// Verify a hash against data
    pub fn verify(&self, data: &[u8], expected_hash: &[u8; 32]) -> Result<bool, ConsensusError> {
        #[cfg(feature = "ffi")]
        {
            let is_valid = self.inner.verify_hash(data, expected_hash);
            Ok(is_valid)
        }
        
        #[cfg(not(feature = "ffi"))]
        {
            let computed_hash = self.hash(data)?;
            Ok(computed_hash == *expected_hash)
        }
    }
    
    /// Get cache statistics
    pub async fn get_cache_stats(&self) -> (usize, usize) {
        let cache = self.cache.read().await;
        (cache.len(), cache.values().map(|v| v.len()).sum())
    }
    
    /// Clear the hash cache
    pub async fn clear_cache(&self) {
        let mut cache = self.cache.write().await;
        cache.clear();
    }
}

impl Default for FuegoHash {
    fn default() -> Self {
        Self::new().expect("Failed to create default Fuego hash instance")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_fuego_hash_creation() {
        let fuego_hash = FuegoHash::new();
        assert!(fuego_hash.is_ok());
    }
    
    #[test]
    fn test_hash_data() {
        let fuego_hash = FuegoHash::new().unwrap();
        let data = b"test data";
        
        let result = fuego_hash.hash(data);
        assert!(result.is_ok());
        
        let hash = result.unwrap();
        assert_eq!(hash.len(), 32);
    }
    
    #[test]
    fn test_hash_block_header() {
        let fuego_hash = FuegoHash::new().unwrap();
        let header_data = b"block header data";
        
        let result = fuego_hash.hash_block_header(header_data);
        assert!(result.is_ok());
        
        let hash = result.unwrap();
        assert_eq!(hash.len(), 32);
    }
    
    #[test]
    fn test_verify_hash() {
        let fuego_hash = FuegoHash::new().unwrap();
        let data = b"test data";
        
        let hash = fuego_hash.hash(data).unwrap();
        let verify_result = fuego_hash.verify(data, &hash);
        assert!(verify_result.is_ok());
        assert!(verify_result.unwrap());
    }
    
    #[test]
    fn test_cache_functionality() {
        let fuego_hash = FuegoHash::new().unwrap();
        
        // Hash some data
        let data = b"test data for caching";
        let _hash = fuego_hash.hash(data).unwrap();
        
        // Check cache stats (synchronous)
        let cache = fuego_hash.cache.blocking_read();
        let cache_size = cache.len();
        assert!(cache_size > 0);
        drop(cache);
        
        // Clear cache (synchronous)
        {
            let mut cache = fuego_hash.cache.blocking_write();
            cache.clear();
        }
        
        // Check cache is empty
        let cache = fuego_hash.cache.blocking_read();
        let cache_size = cache.len();
        assert_eq!(cache_size, 0);
    }
}