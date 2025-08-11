use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{debug, error, info};

pub mod error;
pub mod aegis;
pub mod wallet;

use error::EncryptionError;
use aegis::Aegis256X;
use wallet::WalletEncryption;

/// Encryption configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptionConfig {
    pub algorithm: String,
    pub key_size: usize,
    pub iv_size: usize,
    pub enable_hardware_acceleration: bool,
    pub cache_size: usize,
}

impl Default for EncryptionConfig {
    fn default() -> Self {
        Self {
            algorithm: "AEGIS-256X".to_string(),
            key_size: 32,
            iv_size: 16,
            enable_hardware_acceleration: true,
            cache_size: 1000,
        }
    }
}

/// Encryption statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptionStats {
    pub total_encryptions: u64,
    pub total_decryptions: u64,
    pub total_keys_generated: u64,
    pub cache_hits: u64,
    pub cache_misses: u64,
    pub average_encryption_time_ms: f64,
    pub average_decryption_time_ms: f64,
}

/// Main encryption engine
pub struct EncryptionEngine {
    config: EncryptionConfig,
    aegis: Arc<Aegis256X>,
    wallet_encryption: Arc<WalletEncryption>,
    stats: Arc<tokio::sync::RwLock<EncryptionStats>>,
}

impl EncryptionEngine {
    pub fn new(config: EncryptionConfig) -> Result<Self, EncryptionError> {
        let aegis = Arc::new(Aegis256X::new()?);
        let wallet_encryption = Arc::new(WalletEncryption::new(config.clone())?);
        
        let stats = Arc::new(tokio::sync::RwLock::new(EncryptionStats {
            total_encryptions: 0,
            total_decryptions: 0,
            total_keys_generated: 0,
            cache_hits: 0,
            cache_misses: 0,
            average_encryption_time_ms: 0.0,
            average_decryption_time_ms: 0.0,
        }));

        Ok(Self {
            config,
            aegis,
            wallet_encryption,
            stats,
        })
    }

    /// Encrypt data with a key
    pub async fn encrypt(&self, data: &[u8], key: &[u8; 32]) -> Result<Vec<u8>, EncryptionError> {
        debug!("Encrypting {} bytes", data.len());
        
        let start_time = std::time::Instant::now();
        
        let result = self.aegis.encrypt(data, key).await?;
        
        let duration = start_time.elapsed();
        self.update_encryption_stats(duration).await;
        
        Ok(result)
    }

    /// Decrypt data with a key
    pub async fn decrypt(&self, data: &[u8], key: &[u8; 32]) -> Result<Vec<u8>, EncryptionError> {
        debug!("Decrypting {} bytes", data.len());
        
        let start_time = std::time::Instant::now();
        
        let result = self.aegis.decrypt(data, key).await?;
        
        let duration = start_time.elapsed();
        self.update_decryption_stats(duration).await;
        
        Ok(result)
    }

    /// Generate a new encryption key
    pub async fn generate_key(&self) -> Result<[u8; 32], EncryptionError> {
        debug!("Generating new encryption key");
        
        let key = self.wallet_encryption.generate_key().await?;
        
        let mut stats = self.stats.write().await;
        stats.total_keys_generated += 1;
        
        Ok(key)
    }

    /// Encrypt wallet data
    pub async fn encrypt_wallet_data(&self, data: &[u8], password: &str) -> Result<Vec<u8>, EncryptionError> {
        debug!("Encrypting wallet data");
        
        self.wallet_encryption.encrypt_data(data, password).await
    }

    /// Decrypt wallet data
    pub async fn decrypt_wallet_data(&self, data: &[u8], password: &str) -> Result<Vec<u8>, EncryptionError> {
        debug!("Decrypting wallet data");
        
        self.wallet_encryption.decrypt_data(data, password).await
    }

    /// Get encryption statistics
    pub async fn get_stats(&self) -> EncryptionStats {
        self.stats.read().await.clone()
    }

    /// Get encryption configuration
    pub fn get_config(&self) -> &EncryptionConfig {
        &self.config
    }

    /// Update encryption statistics
    async fn update_encryption_stats(&self, duration: std::time::Duration) {
        let mut stats = self.stats.write().await;
        stats.total_encryptions += 1;
        
        let duration_ms = duration.as_millis() as f64;
        let total_encryptions = stats.total_encryptions as f64;
        
        stats.average_encryption_time_ms = 
            (stats.average_encryption_time_ms * (total_encryptions - 1.0) + duration_ms) / total_encryptions;
    }

    /// Update decryption statistics
    async fn update_decryption_stats(&self, duration: std::time::Duration) {
        let mut stats = self.stats.write().await;
        stats.total_decryptions += 1;
        
        let duration_ms = duration.as_millis() as f64;
        let total_decryptions = stats.total_decryptions as f64;
        
        stats.average_decryption_time_ms = 
            (stats.average_decryption_time_ms * (total_decryptions - 1.0) + duration_ms) / total_decryptions;
    }

    /// Test encryption/decryption round trip
    pub async fn test_round_trip(&self, data: &[u8]) -> Result<bool, EncryptionError> {
        debug!("Testing encryption/decryption round trip");
        
        let key = self.generate_key().await?;
        let encrypted = self.encrypt(data, &key).await?;
        let decrypted = self.decrypt(&encrypted, &key).await?;
        
        Ok(data == decrypted.as_slice())
    }

    /// Benchmark encryption performance
    pub async fn benchmark(&self, data_size: usize, iterations: usize) -> Result<EncryptionBenchmark, EncryptionError> {
        debug!("Running encryption benchmark with {} iterations of {} bytes", iterations, data_size);
        
        let test_data = vec![0u8; data_size];
        let key = self.generate_key().await?;
        
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
        
        Ok(EncryptionBenchmark {
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

/// Encryption benchmark results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptionBenchmark {
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
    async fn test_encryption_engine_creation() {
        let config = EncryptionConfig::default();
        let engine = EncryptionEngine::new(config);
        assert!(engine.is_ok());
    }

    #[tokio::test]
    async fn test_encryption_decryption_round_trip() {
        let config = EncryptionConfig::default();
        let engine = EncryptionEngine::new(config).unwrap();
        
        let test_data = b"Hello, World! This is a test message for encryption.";
        let result = engine.test_round_trip(test_data).await;
        assert!(result.is_ok());
        assert!(result.unwrap());
    }

    #[tokio::test]
    async fn test_key_generation() {
        let config = EncryptionConfig::default();
        let engine = EncryptionEngine::new(config).unwrap();
        
        let key1 = engine.generate_key().await.unwrap();
        let key2 = engine.generate_key().await.unwrap();
        
        assert_eq!(key1.len(), 32);
        assert_eq!(key2.len(), 32);
        assert_ne!(key1, key2); // Keys should be different
    }

    #[tokio::test]
    async fn test_encryption_stats() {
        let config = EncryptionConfig::default();
        let engine = EncryptionEngine::new(config).unwrap();
        
        let test_data = b"Test data for encryption";
        let key = engine.generate_key().await.unwrap();
        
        // Perform some operations
        engine.encrypt(test_data, &key).await.unwrap();
        engine.encrypt(test_data, &key).await.unwrap();
        
        let stats = engine.get_stats().await;
        assert_eq!(stats.total_encryptions, 2);
        assert_eq!(stats.total_keys_generated, 1);
        assert!(stats.average_encryption_time_ms > 0.0);
    }

    #[tokio::test]
    async fn test_benchmark() {
        let config = EncryptionConfig::default();
        let engine = EncryptionEngine::new(config).unwrap();
        
        let benchmark = engine.benchmark(1024, 10).await.unwrap();
        
        assert_eq!(benchmark.data_size, 1024);
        assert_eq!(benchmark.iterations, 10);
        assert!(benchmark.avg_encryption_time_us > 0.0);
        assert!(benchmark.avg_decryption_time_us > 0.0);
        assert!(benchmark.throughput_encryption_mbps > 0.0);
        assert!(benchmark.throughput_decryption_mbps > 0.0);
    }
}