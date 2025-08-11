use anyhow::Result;
use rand::{Rng, RngCore};
use std::sync::Arc;
use tracing::{debug, error, info};

use crate::error::EncryptionError;

/// AEGIS-256X encryption implementation
pub struct Aegis256X {
    #[cfg(feature = "ffi")]
    inner: Arc<Aegis256XImpl>,
    #[cfg(not(feature = "ffi"))]
    inner: Arc<MockAegis256X>,
}

#[cfg(feature = "ffi")]
use cxx::UniquePtr;

#[cfg(feature = "ffi")]
#[cxx::bridge(namespace = "aegis")]
mod ffi {
    unsafe extern "C++" {
        include!("encryption/include/aegis256x.h");

        type Aegis256XImpl;

        fn new_aegis256x() -> UniquePtr<Aegis256XImpl>;
        fn encrypt(self: &Aegis256XImpl, data: &[u8], key: &[u8], iv: &[u8]) -> Result<Vec<u8>>;
        fn decrypt(self: &Aegis256XImpl, data: &[u8], key: &[u8], iv: &[u8]) -> Result<Vec<u8>>;
        fn generate_iv(self: &Aegis256XImpl) -> Vec<u8>;
        fn get_key_size(self: &Aegis256XImpl) -> usize;
        fn get_iv_size(self: &Aegis256XImpl) -> usize;
    }
}

#[cfg(feature = "ffi")]
type Aegis256XImpl = ffi::Aegis256XImpl;

/// Mock implementation for testing
#[cfg(not(feature = "ffi"))]
struct MockAegis256X {
    key_size: usize,
    iv_size: usize,
}

#[cfg(not(feature = "ffi"))]
impl MockAegis256X {
    fn new() -> Result<Self, EncryptionError> {
        Ok(Self {
            key_size: 32,
            iv_size: 16,
        })
    }

    fn encrypt(&self, data: &[u8], key: &[u8], iv: &[u8]) -> Result<Vec<u8>, EncryptionError> {
        if key.len() != self.key_size {
            return Err(EncryptionError::InvalidKeySize {
                expected: self.key_size,
                actual: key.len(),
            });
        }

        if iv.len() != self.iv_size {
            return Err(EncryptionError::InvalidIVSize {
                expected: self.iv_size,
                actual: iv.len(),
            });
        }

        // Mock encryption: XOR with key and IV
        let mut encrypted = Vec::with_capacity(data.len() + iv.len());
        encrypted.extend_from_slice(iv);

        for (i, &byte) in data.iter().enumerate() {
            let key_byte = key[i % key.len()];
            let iv_byte = iv[i % iv.len()];
            encrypted.push(byte ^ key_byte ^ iv_byte);
        }

        Ok(encrypted)
    }

    fn decrypt(&self, data: &[u8], key: &[u8], iv: &[u8]) -> Result<Vec<u8>, EncryptionError> {
        if key.len() != self.key_size {
            return Err(EncryptionError::InvalidKeySize {
                expected: self.key_size,
                actual: key.len(),
            });
        }

        if iv.len() != self.iv_size {
            return Err(EncryptionError::InvalidIVSize {
                expected: self.iv_size,
                actual: iv.len(),
            });
        }

        if data.len() < iv.len() {
            return Err(EncryptionError::InvalidDataFormat("Data too short".to_string()));
        }

        // Mock decryption: XOR with key and IV
        let encrypted_data = &data[iv.len()..];
        let mut decrypted = Vec::with_capacity(encrypted_data.len());

        for (i, &byte) in encrypted_data.iter().enumerate() {
            let key_byte = key[i % key.len()];
            let iv_byte = iv[i % iv.len()];
            decrypted.push(byte ^ key_byte ^ iv_byte);
        }

        Ok(decrypted)
    }

    fn generate_iv(&self) -> Vec<u8> {
        let mut rng = rand::thread_rng();
        let mut iv = vec![0u8; self.iv_size];
        rng.fill_bytes(&mut iv);
        iv
    }

    fn get_key_size(&self) -> usize {
        self.key_size
    }

    fn get_iv_size(&self) -> usize {
        self.iv_size
    }
}

impl Aegis256X {
    pub fn new() -> Result<Self, EncryptionError> {
        #[cfg(feature = "ffi")]
        {
            let inner = Arc::new(ffi::new_aegis256x());
            Ok(Self { inner })
        }

        #[cfg(not(feature = "ffi"))]
        {
            let inner = Arc::new(MockAegis256X::new()?);
            Ok(Self { inner })
        }
    }

    /// Encrypt data with AEGIS-256X
    pub async fn encrypt(&self, data: &[u8], key: &[u8; 32]) -> Result<Vec<u8>, EncryptionError> {
        debug!("AEGIS-256X encrypting {} bytes", data.len());

        #[cfg(feature = "ffi")]
        {
            let iv = self.inner.generate_iv();
            let result = self.inner.encrypt(data, key, &iv)
                .map_err(|e| EncryptionError::EncryptionFailed(e.to_string()))?;
            Ok(result)
        }

        #[cfg(not(feature = "ffi"))]
        {
            let iv = self.inner.generate_iv();
            let result = self.inner.encrypt(data, key, &iv)?;
            Ok(result)
        }
    }

    /// Decrypt data with AEGIS-256X
    pub async fn decrypt(&self, data: &[u8], key: &[u8; 32]) -> Result<Vec<u8>, EncryptionError> {
        debug!("AEGIS-256X decrypting {} bytes", data.len());

        #[cfg(feature = "ffi")]
        {
            let iv = self.inner.generate_iv(); // In real implementation, IV would be extracted from data
            let result = self.inner.decrypt(data, key, &iv)
                .map_err(|e| EncryptionError::DecryptionFailed(e.to_string()))?;
            Ok(result)
        }

        #[cfg(not(feature = "ffi"))]
        {
            let iv = self.inner.generate_iv(); // In real implementation, IV would be extracted from data
            let result = self.inner.decrypt(data, key, &iv)?;
            Ok(result)
        }
    }

    /// Generate a random IV
    pub fn generate_iv(&self) -> Vec<u8> {
        self.inner.generate_iv()
    }

    /// Get the required key size
    pub fn get_key_size(&self) -> usize {
        self.inner.get_key_size()
    }

    /// Get the required IV size
    pub fn get_iv_size(&self) -> usize {
        self.inner.get_iv_size()
    }

    /// Test encryption/decryption round trip
    pub async fn test_round_trip(&self, data: &[u8], key: &[u8; 32]) -> Result<bool, EncryptionError> {
        debug!("Testing AEGIS-256X round trip");
        
        let encrypted = self.encrypt(data, key).await?;
        let decrypted = self.decrypt(&encrypted, key).await?;
        
        Ok(data == decrypted.as_slice())
    }

    /// Benchmark encryption performance
    pub async fn benchmark(&self, data_size: usize, iterations: usize) -> Result<AegisBenchmark, EncryptionError> {
        debug!("Running AEGIS-256X benchmark with {} iterations of {} bytes", iterations, data_size);
        
        let test_data = vec![0u8; data_size];
        let key = [1u8; 32];
        
        let mut encryption_times = Vec::new();
        let mut decryption_times = Vec::new();
        
        for _ in 0..iterations {
            // Encryption benchmark
            let start = std::time::Instant::now();
            let encrypted = self.encrypt(&test_data, &key).await?;
            encryption_times.push(start.elapsed());
            
            // Decryption benchmark
            let start = std::time::Instant::now();
            let _decrypted = self.decrypt(&encrypted, &key).await?;
            decryption_times.push(start.elapsed());
        }
        
        let avg_encryption = encryption_times.iter().map(|d| d.as_micros() as f64).sum::<f64>() / iterations as f64;
        let avg_decryption = decryption_times.iter().map(|d| d.as_micros() as f64).sum::<f64>() / iterations as f64;
        
        let min_encryption = encryption_times.iter().map(|d| d.as_micros()).min().unwrap_or(0);
        let max_encryption = encryption_times.iter().map(|d| d.as_micros()).max().unwrap_or(0);
        let min_decryption = decryption_times.iter().map(|d| d.as_micros()).min().unwrap_or(0);
        let max_decryption = decryption_times.iter().map(|d| d.as_micros()).max().unwrap_or(0);
        
        Ok(AegisBenchmark {
            data_size,
            iterations,
            avg_encryption_time_us: avg_encryption,
            avg_decryption_time_us: avg_decryption,
            min_encryption_time_us: min_encryption,
            max_encryption_time_us: max_encryption,
            min_decryption_time_us: min_decryption,
            max_decryption_time_us: max_decryption,
            throughput_encryption_mbps: (data_size as f64 * iterations as f64) / (avg_encryption / 1_000_000.0),
            throughput_decryption_mbps: (data_size as f64 * iterations as f64) / (avg_decryption / 1_000_000.0),
        })
    }
}

/// AEGIS-256X benchmark results
#[derive(Debug, Clone)]
pub struct AegisBenchmark {
    pub data_size: usize,
    pub iterations: usize,
    pub avg_encryption_time_us: f64,
    pub avg_decryption_time_us: f64,
    pub min_encryption_time_us: u128,
    pub max_encryption_time_us: u128,
    pub min_decryption_time_us: u128,
    pub max_decryption_time_us: u128,
    pub throughput_encryption_mbps: f64,
    pub throughput_decryption_mbps: f64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_aegis256x_creation() {
        let aegis = Aegis256X::new();
        assert!(aegis.is_ok());
    }

    #[tokio::test]
    async fn test_aegis256x_encryption_decryption() {
        let aegis = Aegis256X::new().unwrap();
        let test_data = b"Hello, World! This is a test message for AEGIS-256X encryption.";
        let key = [1u8; 32];
        
        let result = aegis.test_round_trip(test_data, &key).await;
        assert!(result.is_ok());
        assert!(result.unwrap());
    }

    #[tokio::test]
    async fn test_aegis256x_key_size() {
        let aegis = Aegis256X::new().unwrap();
        assert_eq!(aegis.get_key_size(), 32);
    }

    #[tokio::test]
    async fn test_aegis256x_iv_size() {
        let aegis = Aegis256X::new().unwrap();
        assert_eq!(aegis.get_iv_size(), 16);
    }

    #[tokio::test]
    async fn test_aegis256x_iv_generation() {
        let aegis = Aegis256X::new().unwrap();
        let iv1 = aegis.generate_iv();
        let iv2 = aegis.generate_iv();
        
        assert_eq!(iv1.len(), 16);
        assert_eq!(iv2.len(), 16);
        assert_ne!(iv1, iv2); // IVs should be different
    }

    #[tokio::test]
    async fn test_aegis256x_benchmark() {
        let aegis = Aegis256X::new().unwrap();
        let benchmark = aegis.benchmark(1024, 10).await.unwrap();
        
        assert_eq!(benchmark.data_size, 1024);
        assert_eq!(benchmark.iterations, 10);
        assert!(benchmark.avg_encryption_time_us > 0.0);
        assert!(benchmark.avg_decryption_time_us > 0.0);
        assert!(benchmark.throughput_encryption_mbps > 0.0);
        assert!(benchmark.throughput_decryption_mbps > 0.0);
    }

    #[tokio::test]
    async fn test_aegis256x_invalid_key_size() {
        let aegis = Aegis256X::new().unwrap();
        let test_data = b"test";
        let invalid_key = [1u8; 16]; // Wrong size
        
        let result = aegis.encrypt(test_data, &invalid_key).await;
        assert!(result.is_err());
    }
}