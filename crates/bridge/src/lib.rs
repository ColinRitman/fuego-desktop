use anyhow::Result;
use block_sync::{Block, BlockHeader};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};
use tokio::time::{Duration, Instant};

pub mod error;
pub mod arbitrum;
pub mod fuego;
pub mod relayer;

use error::BridgeError;
use arbitrum::{ArbitrumClient, ProofSubmission};
use fuego::{FuegoHeaderVerifier, HeaderVerification};
use relayer::{Relayer, RelayerConfig};

/// Bridge configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BridgeConfig {
    pub arbitrum_rpc_url: String,
    pub arbitrum_contract_address: String,
    pub fuego_rpc_url: String,
    pub relayer_interval: Duration,
    pub max_headers_per_batch: usize,
    pub proof_timeout: Duration,
    pub enable_auto_relay: bool,
}

impl Default for BridgeConfig {
    fn default() -> Self {
        Self {
            arbitrum_rpc_url: "http://localhost:8545".to_string(),
            arbitrum_contract_address: "0x0000000000000000000000000000000000000000".to_string(),
            fuego_rpc_url: "http://localhost:8080".to_string(),
            relayer_interval: Duration::from_secs(60),
            max_headers_per_batch: 10,
            proof_timeout: Duration::from_secs(300),
            enable_auto_relay: true,
        }
    }
}

/// Bridge state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BridgeState {
    Initializing,
    Running,
    Stopping,
    Stopped,
    Error(String),
}

/// Bridge proof
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BridgeProof {
    pub fuego_header: BlockHeader,
    pub arbitrum_proof: Vec<u8>,
    pub submission_timestamp: u64,
    pub status: ProofStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProofStatus {
    Pending,
    Submitted,
    Confirmed,
    Failed(String),
}

/// Bridge statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BridgeStats {
    pub total_headers_verified: u64,
    pub total_proofs_submitted: u64,
    pub total_proofs_confirmed: u64,
    pub total_proofs_failed: u64,
    pub last_header_height: u64,
    pub last_proof_timestamp: u64,
}

/// Bridge engine implementing Fuego to Arbitrum L3 bridging
pub struct Bridge {
    config: BridgeConfig,
    arbitrum_client: ArbitrumClient,
    fuego_verifier: FuegoHeaderVerifier,
    relayer: Relayer,
    state: Arc<RwLock<BridgeState>>,
    stats: Arc<RwLock<BridgeStats>>,
    pending_proofs: Arc<RwLock<HashMap<[u8; 32], BridgeProof>>>,
    submitted_proofs: Arc<RwLock<HashMap<[u8; 32], BridgeProof>>>,
    message_tx: mpsc::Sender<BridgeMessage>,
    message_rx: mpsc::Receiver<BridgeMessage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BridgeMessage {
    HeaderVerified(BlockHeader),
    ProofSubmitted([u8; 32]),
    ProofConfirmed([u8; 32]),
    ProofFailed([u8; 32], String),
    BridgeError(String),
}

impl Bridge {
    /// Create a new bridge instance
    pub fn new(config: BridgeConfig) -> Result<Self, BridgeError> {
        let (message_tx, message_rx) = mpsc::channel(1000);
        
        let arbitrum_client = ArbitrumClient::new(
            config.arbitrum_rpc_url.clone(),
            config.arbitrum_contract_address.clone(),
        )?;
        
        let fuego_verifier = FuegoHeaderVerifier::new(config.fuego_rpc_url.clone())?;
        
        let relayer_config = RelayerConfig {
            interval: config.relayer_interval,
            max_batch_size: config.max_headers_per_batch,
            timeout: config.proof_timeout,
        };
        let relayer = Relayer::new(relayer_config)?;
        
        Ok(Self {
            config,
            arbitrum_client,
            fuego_verifier,
            relayer,
            state: Arc::new(RwLock::new(BridgeState::Initializing)),
            stats: Arc::new(RwLock::new(BridgeStats {
                total_headers_verified: 0,
                total_proofs_submitted: 0,
                total_proofs_confirmed: 0,
                total_proofs_failed: 0,
                last_header_height: 0,
                last_proof_timestamp: 0,
            })),
            pending_proofs: Arc::new(RwLock::new(HashMap::new())),
            submitted_proofs: Arc::new(RwLock::new(HashMap::new())),
            message_tx,
            message_rx,
        })
    }
    
    /// Start the bridge
    pub async fn start(&mut self) -> Result<(), BridgeError> {
        *self.state.write().await = BridgeState::Running;
        
        // Start relayer
        self.relayer.start().await?;
        
        // Start message processing loop
        let message_rx = std::mem::replace(&mut self.message_rx, mpsc::channel(1000).1);
        let state = self.state.clone();
        tokio::spawn(async move {
            Self::process_messages(message_rx, state).await;
        });
        
        Ok(())
    }
    
    /// Stop the bridge
    pub async fn stop(&mut self) -> Result<(), BridgeError> {
        *self.state.write().await = BridgeState::Stopping;
        
        // Stop relayer
        self.relayer.stop().await?;
        
        *self.state.write().await = BridgeState::Stopped;
        Ok(())
    }
    
    /// Verify a Fuego header
    pub async fn verify_fuego_header(&self, header: &BlockHeader) -> Result<bool, BridgeError> {
        let status = self.state.read().await;
        if !matches!(*status, BridgeState::Running) {
            return Err(BridgeError::BridgeNotRunning);
        }
        drop(status);
        
        // Verify the header using Fuego verifier
        let verification = self.fuego_verifier.verify_header(header).await?;
        
        if verification.is_valid {
            // Update statistics
            {
                let mut stats = self.stats.write().await;
                stats.total_headers_verified += 1;
                stats.last_header_height = header.height;
            }
            
            // Send verification message
            let _ = self.message_tx.send(BridgeMessage::HeaderVerified(header.clone())).await;
            
            Ok(true)
        } else {
            Ok(false)
        }
    }
    
    /// Submit proof to Arbitrum
    pub async fn submit_to_arbitrum(&self, proof: &BridgeProof) -> Result<(), BridgeError> {
        let status = self.state.read().await;
        if !matches!(*status, BridgeState::Running) {
            return Err(BridgeError::BridgeNotRunning);
        }
        drop(status);
        
        // Submit proof to Arbitrum
        let submission = ProofSubmission {
            header_hash: proof.fuego_header.hash()?,
            proof_data: proof.arbitrum_proof.clone(),
            timestamp: proof.submission_timestamp,
        };
        
        let result = self.arbitrum_client.submit_proof(submission).await;
        
        match result {
            Ok(_) => {
                // Update statistics
                {
                    let mut stats = self.stats.write().await;
                    stats.total_proofs_submitted += 1;
                    stats.last_proof_timestamp = proof.submission_timestamp;
                }
                
                // Move proof to submitted state
                let header_hash = proof.fuego_header.hash()?;
                {
                    let mut pending = self.pending_proofs.write().await;
                    if let Some(proof) = pending.remove(&header_hash) {
                        let mut submitted = self.submitted_proofs.write().await;
                        submitted.insert(header_hash, proof);
                    }
                }
                
                // Send submission message
                let _ = self.message_tx.send(BridgeMessage::ProofSubmitted(header_hash)).await;
                
                Ok(())
            }
            Err(e) => {
                // Update statistics
                {
                    let mut stats = self.stats.write().await;
                    stats.total_proofs_failed += 1;
                }
                
                // Send failure message
                let header_hash = proof.fuego_header.hash()?;
                let _ = self.message_tx.send(BridgeMessage::ProofFailed(header_hash, e.to_string())).await;
                
                Err(e)
            }
        }
    }
    
    /// Get bridge state
    pub async fn get_bridge_state(&self) -> BridgeState {
        self.state.read().await.clone()
    }
    
    /// Get bridge statistics
    pub async fn get_bridge_stats(&self) -> BridgeStats {
        self.stats.read().await.clone()
    }
    
    /// Get pending proofs count
    pub async fn get_pending_proofs_count(&self) -> usize {
        self.pending_proofs.read().await.len()
    }
    
    /// Get submitted proofs count
    pub async fn get_submitted_proofs_count(&self) -> usize {
        self.submitted_proofs.read().await.len()
    }
    
    /// Create a bridge proof from a Fuego block
    pub async fn create_bridge_proof(&self, block: &Block) -> Result<BridgeProof, BridgeError> {
        // Verify the block header
        let is_valid = self.verify_fuego_header(&block.header).await?;
        if !is_valid {
            return Err(BridgeError::InvalidHeader);
        }
        
        // Create proof data
        let proof_data = self.create_proof_data(block).await?;
        
        let proof = BridgeProof {
            fuego_header: block.header.clone(),
            arbitrum_proof: proof_data,
            submission_timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            status: ProofStatus::Pending,
        };
        
        // Store pending proof
        let header_hash = block.header.hash()?;
        self.pending_proofs.write().await.insert(header_hash, proof.clone());
        
        Ok(proof)
    }
    
    /// Create proof data for Arbitrum submission
    async fn create_proof_data(&self, block: &Block) -> Result<Vec<u8>, BridgeError> {
        // In a real implementation, this would create a proper proof
        // For now, we'll create a simple proof structure
        let mut proof_data = Vec::new();
        
        // Add block header hash
        let header_hash = block.header.hash()?;
        proof_data.extend_from_slice(&header_hash);
        
        // Add block height
        proof_data.extend_from_slice(&block.header.height.to_le_bytes());
        
        // Add timestamp
        proof_data.extend_from_slice(&block.header.timestamp.to_le_bytes());
        
        // Add transaction count
        proof_data.extend_from_slice(&(block.transactions.len() as u32).to_le_bytes());
        
        Ok(proof_data)
    }
    
    /// Process bridge messages
    async fn process_messages(
        mut message_rx: mpsc::Receiver<BridgeMessage>,
        state: Arc<RwLock<BridgeState>>,
    ) {
        while let Some(message) = message_rx.recv().await {
            match message {
                BridgeMessage::HeaderVerified(header) => {
                    println!("Header verified: height {}", header.height);
                }
                BridgeMessage::ProofSubmitted(header_hash) => {
                    println!("Proof submitted: {:?}", header_hash);
                }
                BridgeMessage::ProofConfirmed(header_hash) => {
                    println!("Proof confirmed: {:?}", header_hash);
                }
                BridgeMessage::ProofFailed(header_hash, error) => {
                    println!("Proof failed: {:?}, error: {}", header_hash, error);
                }
                BridgeMessage::BridgeError(error) => {
                    println!("Bridge error: {}", error);
                    *state.write().await = BridgeState::Error(error);
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use block_sync::{Transaction, TxInput, TxOutput};
    
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
    async fn test_bridge_creation() {
        let config = BridgeConfig::default();
        let bridge = Bridge::new(config);
        assert!(bridge.is_ok());
    }
    
    #[tokio::test]
    async fn test_bridge_start_stop() {
        let config = BridgeConfig::default();
        let mut bridge = Bridge::new(config).unwrap();
        
        // Start bridge
        let result = bridge.start().await;
        assert!(result.is_ok());
        
        // Check state
        let state = bridge.get_bridge_state().await;
        assert!(matches!(state, BridgeState::Running));
        
        // Stop bridge
        let result = bridge.stop().await;
        assert!(result.is_ok());
        
        // Check state
        let state = bridge.get_bridge_state().await;
        assert!(matches!(state, BridgeState::Stopped));
    }
    
    #[tokio::test]
    async fn test_header_verification() {
        let config = BridgeConfig::default();
        let mut bridge = Bridge::new(config).unwrap();
        
        // Start bridge
        bridge.start().await.unwrap();
        
        // Create test block
        let block = create_test_block();
        
        // Verify header
        let result = bridge.verify_fuego_header(&block.header).await;
        assert!(result.is_ok());
        
        // Stop bridge
        bridge.stop().await.unwrap();
    }
    
    #[tokio::test]
    async fn test_bridge_proof_creation() {
        let config = BridgeConfig::default();
        let mut bridge = Bridge::new(config).unwrap();
        
        // Start bridge
        bridge.start().await.unwrap();
        
        // Create test block
        let block = create_test_block();
        
        // Create bridge proof
        let result = bridge.create_bridge_proof(&block).await;
        assert!(result.is_ok());
        
        let proof = result.unwrap();
        assert_eq!(proof.fuego_header.height, block.header.height);
        assert!(matches!(proof.status, ProofStatus::Pending));
        
        // Stop bridge
        bridge.stop().await.unwrap();
    }
}