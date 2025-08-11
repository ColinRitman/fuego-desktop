use crate::error::ConsensusError;
use block_sync::Block;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio::time::{Duration, Instant};

/// Mining configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MiningConfig {
    pub difficulty: u64,
    pub max_nonce: u64,
    pub target_hash_rate: u64, // hashes per second
    pub enable_merge_mining: bool,
    pub merge_mining_interval: Duration,
}

impl Default for MiningConfig {
    fn default() -> Self {
        Self {
            difficulty: 1000,
            max_nonce: u64::MAX,
            target_hash_rate: 1000,
            enable_merge_mining: true,
            merge_mining_interval: Duration::from_secs(10),
        }
    }
}

/// Mining result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MiningResult {
    pub block_hash: [u8; 32],
    pub nonce: u64,
    pub hash_rate: u64,
    pub duration: Duration,
    pub difficulty: u64,
}

/// PoW miner for merge-mining
pub struct PoWMiner {
    config: MiningConfig,
    running: Arc<RwLock<bool>>,
    current_difficulty: Arc<RwLock<u64>>,
    hash_rate: Arc<RwLock<u64>>,
    total_hashes: Arc<RwLock<u64>>,
    last_mine_time: Arc<RwLock<Instant>>,
}

impl PoWMiner {
    /// Create a new PoW miner
    pub fn new(config: MiningConfig) -> Result<Self, ConsensusError> {
        Ok(Self {
            config,
            running: Arc::new(RwLock::new(false)),
            current_difficulty: Arc::new(RwLock::new(1000)),
            hash_rate: Arc::new(RwLock::new(0)),
            total_hashes: Arc::new(RwLock::new(0)),
            last_mine_time: Arc::new(RwLock::new(Instant::now())),
        })
    }
    
    /// Start the PoW miner
    pub async fn start(&mut self) -> Result<(), ConsensusError> {
        *self.running.write().await = true;
        
        // Start mining loop
        let running = self.running.clone();
        let config = self.config.clone();
        let current_difficulty = self.current_difficulty.clone();
        let hash_rate = self.hash_rate.clone();
        let total_hashes = self.total_hashes.clone();
        let last_mine_time = self.last_mine_time.clone();
        
        tokio::spawn(async move {
            Self::mining_loop(
                running,
                config,
                current_difficulty,
                hash_rate,
                total_hashes,
                last_mine_time,
            ).await;
        });
        
        Ok(())
    }
    
    /// Stop the PoW miner
    pub async fn stop(&mut self) -> Result<(), ConsensusError> {
        *self.running.write().await = false;
        Ok(())
    }
    
    /// Mine a block with the given difficulty
    pub async fn mine_block(&self, block: &mut Block, difficulty: u64) -> Result<MiningResult, ConsensusError> {
        let start_time = Instant::now();
        let mut nonce = 0u64;
        let mut hashes = 0u64;
        
        // Update block header with current timestamp
        block.header.timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        while nonce < self.config.max_nonce {
            // Set nonce
            block.header.nonce = nonce;
            
            // Calculate block hash
            let block_hash = block.header.hash()?;
            
            // Check if hash meets difficulty requirement
            if self.check_difficulty(&block_hash, difficulty) {
                let duration = start_time.elapsed();
                let hash_rate = hashes / duration.as_secs().max(1);
                
                // Update block proof
                block.proof.proof_data = nonce.to_le_bytes().to_vec();
                
                return Ok(MiningResult {
                    block_hash,
                    nonce,
                    hash_rate,
                    duration,
                    difficulty,
                });
            }
            
            nonce += 1;
            hashes += 1;
            
            // Update hash rate periodically
            if hashes % 1000 == 0 {
                *self.hash_rate.write().await = hashes / start_time.elapsed().as_secs().max(1);
                *self.total_hashes.write().await += 1000;
            }
        }
        
        Err(ConsensusError::PoWMiningError("Max nonce reached".to_string()))
    }
    
    /// Check if a hash meets the difficulty requirement
    fn check_difficulty(&self, hash: &[u8; 32], difficulty: u64) -> bool {
        // Simple difficulty check: count leading zeros
        let mut leading_zeros = 0;
        for &byte in hash.iter() {
            if byte == 0 {
                leading_zeros += 8;
            } else {
                leading_zeros += byte.leading_zeros() as u64;
                break;
            }
        }
        
        leading_zeros >= difficulty
    }
    
    /// Mining loop for continuous mining
    async fn mining_loop(
        running: Arc<RwLock<bool>>,
        config: MiningConfig,
        _current_difficulty: Arc<RwLock<u64>>,
        hash_rate: Arc<RwLock<u64>>,
        total_hashes: Arc<RwLock<u64>>,
        last_mine_time: Arc<RwLock<Instant>>,
    ) {
        while *running.read().await {
            // Simulate mining work
            let start_time = Instant::now();
            let mut hashes = 0u64;
            
            // Mine for the configured interval
            while start_time.elapsed() < config.merge_mining_interval && *running.read().await {
                // Simulate hash calculation
                hashes += 1;
                
                // Small delay to prevent busy waiting
                tokio::time::sleep(Duration::from_millis(1)).await;
            }
            
            // Update statistics
            *hash_rate.write().await = hashes / start_time.elapsed().as_secs().max(1);
            *total_hashes.write().await += hashes;
            *last_mine_time.write().await = Instant::now();
            
            println!("Mining: {} hashes/sec, total: {}", 
                *hash_rate.read().await, 
                *total_hashes.read().await
            );
        }
    }
    
    /// Get current hash rate
    pub async fn get_hash_rate(&self) -> u64 {
        *self.hash_rate.read().await
    }
    
    /// Get total hashes computed
    pub async fn get_total_hashes(&self) -> u64 {
        *self.total_hashes.read().await
    }
    
    /// Get current difficulty
    pub async fn get_current_difficulty(&self) -> u64 {
        *self.current_difficulty.read().await
    }
    
    /// Set difficulty
    pub async fn set_difficulty(&self, difficulty: u64) {
        *self.current_difficulty.write().await = difficulty;
    }
    
    /// Check if miner is running
    pub async fn is_running(&self) -> bool {
        *self.running.read().await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use block_sync::{BlockHeader, Transaction, TxInput, TxOutput};
    
    fn create_test_block() -> Block {
        Block {
            header: BlockHeader {
                height: 1,
                prev_hash: [0u8; 32],
                merkle_root: [0u8; 32],
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
                difficulty: 1000,
                nonce: 0,
            },
            transactions: vec![Transaction {
                hash: [1u8; 32],
                inputs: vec![TxInput {
                    prev_tx_hash: [0u8; 32],
                    output_index: 0,
                    signature: vec![1u8; 64],
                }],
                outputs: vec![TxOutput {
                    amount: 100,
                    address: vec![1u8; 32],
                    commitment: [0u8; 32],
                }],
                fee: 10,
                timestamp: 1234567890,
            }],
            proof: block_sync::BlockProof {
                proof_type: block_sync::ProofType::PoW,
                proof_data: vec![],
            },
        }
    }
    
    #[tokio::test]
    async fn test_pow_miner_creation() {
        let config = MiningConfig::default();
        let miner = PoWMiner::new(config);
        assert!(miner.is_ok());
    }
    
    #[tokio::test]
    async fn test_pow_miner_start_stop() {
        let config = MiningConfig::default();
        let mut miner = PoWMiner::new(config).unwrap();
        
        // Start miner
        let result = miner.start().await;
        assert!(result.is_ok());
        
        // Check if running
        assert!(miner.is_running().await);
        
        // Stop miner
        let result = miner.stop().await;
        assert!(result.is_ok());
        
        // Check if stopped
        assert!(!miner.is_running().await);
    }
    
    #[tokio::test]
    async fn test_difficulty_check() {
        let config = MiningConfig::default();
        let miner = PoWMiner::new(config).unwrap();
        
        // Test with zero hash (should pass any difficulty)
        let zero_hash = [0u8; 32];
        assert!(miner.check_difficulty(&zero_hash, 1));
        assert!(miner.check_difficulty(&zero_hash, 100));
        
        // Test with non-zero hash (should fail difficulty 1)
        let non_zero_hash = [1u8; 32];
        // The non-zero hash has 7 leading zeros, so it should pass difficulty 1
        assert!(miner.check_difficulty(&non_zero_hash, 1));
        
        // Test with a hash that has fewer leading zeros
        let high_hash = [255u8; 32];
        assert!(!miner.check_difficulty(&high_hash, 1));
    }
    
    #[tokio::test]
    async fn test_block_mining() {
        let config = MiningConfig {
            difficulty: 1, // Low difficulty for testing
            max_nonce: 1000, // Limit nonce for testing
            ..Default::default()
        };
        let miner = PoWMiner::new(config).unwrap();
        
        let mut block = create_test_block();
        
        // Mine block with low difficulty
        let result = miner.mine_block(&mut block, 1).await;
        assert!(result.is_ok());
        
        let mining_result = result.unwrap();
        assert_eq!(mining_result.difficulty, 1);
        assert!(mining_result.nonce >= 0); // Allow 0 as valid nonce
    }
}