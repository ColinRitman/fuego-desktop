use anyhow::Result;
use block_sync::{Block, BlockHeader, Transaction};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};
use tokio::time::Duration;

pub mod error;
pub mod hotstuff;
pub mod pow_mining;
pub mod ffi;

use error::ConsensusError;
use hotstuff::{HotStuffConsensus, ConsensusMessage};
use pow_mining::{PoWMiner, MiningConfig};
use ffi::FuegoHash;

/// Consensus configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConsensusConfig {
    pub node_id: u64,
    pub total_nodes: u64,
    pub block_time: Duration,
    pub max_block_size: usize,
    pub min_finality: u64,
    pub pow_difficulty: u64,
    pub enable_merge_mining: bool,
}

impl Default for ConsensusConfig {
    fn default() -> Self {
        Self {
            node_id: 0,
            total_nodes: 4,
            block_time: Duration::from_secs(10),
            max_block_size: 1000,
            min_finality: 2,
            pow_difficulty: 1000,
            enable_merge_mining: true,
        }
    }
}

/// Consensus node status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConsensusStatus {
    Starting,
    Running,
    Stopping,
    Stopped,
    Error(String),
}

/// Block proposal
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockProposal {
    pub block: Block,
    pub proposer: u64,
    pub timestamp: u64,
    pub signature: Vec<u8>,
}

/// Consensus engine implementing HotStuff BFT with PoW merge-mining
pub struct Consensus {
    config: ConsensusConfig,
    hotstuff: HotStuffConsensus,
    pow_miner: Option<PoWMiner>,
    fuego_hash: FuegoHash,
    status: Arc<RwLock<ConsensusStatus>>,
    finalized_blocks: Arc<RwLock<Vec<Block>>>,
    block_proposals: Arc<RwLock<HashMap<[u8; 32], BlockProposal>>>,
    message_tx: mpsc::Sender<ConsensusMessage>,
    message_rx: mpsc::Receiver<ConsensusMessage>,
}

impl Consensus {
    /// Create a new consensus instance
    pub fn new(config: ConsensusConfig) -> Result<Self, ConsensusError> {
        let (message_tx, message_rx) = mpsc::channel(1000);
        
        let hotstuff = HotStuffConsensus::new(config.clone())?;
        let pow_miner = if config.enable_merge_mining {
            Some(PoWMiner::new(MiningConfig {
                difficulty: config.pow_difficulty,
                ..Default::default()
            })?)
        } else {
            None
        };
        
        let fuego_hash = FuegoHash::new()?;
        
        Ok(Self {
            config,
            hotstuff,
            pow_miner,
            fuego_hash,
            status: Arc::new(RwLock::new(ConsensusStatus::Starting)),
            finalized_blocks: Arc::new(RwLock::new(Vec::new())),
            block_proposals: Arc::new(RwLock::new(HashMap::new())),
            message_tx,
            message_rx,
        })
    }
    
    /// Start the consensus engine
    pub async fn start_consensus(&mut self) -> Result<(), ConsensusError> {
        *self.status.write().await = ConsensusStatus::Running;
        
        // Start HotStuff consensus
        self.hotstuff.start().await?;
        
        // Start PoW mining if enabled
        if let Some(ref mut miner) = self.pow_miner {
            miner.start().await?;
        }
        
        // Start message processing loop
        let message_rx = std::mem::replace(&mut self.message_rx, mpsc::channel(1000).1);
        let status = self.status.clone();
        tokio::spawn(async move {
            Self::process_messages(message_rx, status).await;
        });
        
        Ok(())
    }
    
    /// Stop the consensus engine
    pub async fn stop_consensus(&mut self) -> Result<(), ConsensusError> {
        *self.status.write().await = ConsensusStatus::Stopping;
        
        // Stop HotStuff consensus
        self.hotstuff.stop().await?;
        
        // Stop PoW mining
        if let Some(ref mut miner) = self.pow_miner {
            miner.stop().await?;
        }
        
        *self.status.write().await = ConsensusStatus::Stopped;
        Ok(())
    }
    
    /// Propose a new block
    pub async fn propose_block(&mut self, transactions: Vec<Transaction>) -> Result<(), ConsensusError> {
        let status = self.status.read().await;
        if !matches!(*status, ConsensusStatus::Running) {
            return Err(ConsensusError::ConsensusNotRunning);
        }
        drop(status);
        
        // Create block header
        let header = BlockHeader {
            height: 0, // Will be set properly
            prev_hash: self.get_latest_block_hash().await?,
            merkle_root: self.calculate_merkle_root(&transactions)?,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            difficulty: self.config.pow_difficulty,
            nonce: 0,
        };
        
        // Create block
        let block = Block {
            header,
            transactions,
            proof: block_sync::BlockProof {
                proof_type: block_sync::ProofType::PoW,
                proof_data: vec![], // Will be set by PoW mining
            },
        };
        
        // Create proposal
        let proposal = BlockProposal {
            block: block.clone(),
            proposer: self.config.node_id,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            signature: vec![], // TODO: Implement signing
        };
        
        // Store proposal
        let block_hash = block.header.hash()?;
        self.block_proposals.write().await.insert(block_hash, proposal);
        
        // Submit to HotStuff consensus
        self.hotstuff.propose_block(block).await?;
        
        Ok(())
    }
    
    /// Get finalized blocks
    pub async fn get_finalized_blocks(&self) -> Vec<Block> {
        self.finalized_blocks.read().await.clone()
    }
    
    /// Get consensus status
    pub async fn get_status(&self) -> ConsensusStatus {
        self.status.read().await.clone()
    }
    
    /// Get latest block hash
    async fn get_latest_block_hash(&self) -> Result<[u8; 32], ConsensusError> {
        let blocks = self.finalized_blocks.read().await;
        if let Some(latest) = blocks.last() {
            Ok(latest.header.hash()?)
        } else {
            // Genesis block hash
            Ok([0u8; 32])
        }
    }
    
    /// Calculate Merkle root for transactions
    fn calculate_merkle_root(&self, transactions: &[Transaction]) -> Result<[u8; 32], ConsensusError> {
        if transactions.is_empty() {
            return Ok([0u8; 32]);
        }
        
        let mut hashes: Vec<[u8; 32]> = transactions
            .iter()
            .map(|tx| tx.hash)
            .collect();
        
        // Build Merkle tree
        while hashes.len() > 1 {
            let mut new_hashes = Vec::new();
            for chunk in hashes.chunks(2) {
                let combined = if chunk.len() == 2 {
                    let mut combined = Vec::new();
                    combined.extend_from_slice(&chunk[0]);
                    combined.extend_from_slice(&chunk[1]);
                    self.fuego_hash.hash(&combined)?
                } else {
                    chunk[0]
                };
                new_hashes.push(combined);
            }
            hashes = new_hashes;
        }
        
        Ok(hashes[0])
    }
    
    /// Process consensus messages
    async fn process_messages(
        mut message_rx: mpsc::Receiver<ConsensusMessage>,
        status: Arc<RwLock<ConsensusStatus>>,
    ) {
        while let Some(message) = message_rx.recv().await {
            match message {
                ConsensusMessage::BlockFinalized(block) => {
                    // TODO: Add block to finalized blocks
                    println!("Block finalized: {:?}", block.header.hash());
                }
                ConsensusMessage::BlockRejected(block_hash, reason) => {
                    println!("Block rejected: {:?}, reason: {}", block_hash, reason);
                }
                ConsensusMessage::ConsensusError(error) => {
                    println!("Consensus error: {}", error);
                    *status.write().await = ConsensusStatus::Error(error);
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use block_sync::{TxInput, TxOutput};
    
    fn create_test_transaction() -> Transaction {
        Transaction {
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
        }
    }
    
    #[tokio::test]
    async fn test_consensus_creation() {
        let config = ConsensusConfig::default();
        let consensus = Consensus::new(config);
        assert!(consensus.is_ok());
    }
    
    #[tokio::test]
    async fn test_consensus_start_stop() {
        let config = ConsensusConfig::default();
        let mut consensus = Consensus::new(config).unwrap();
        
        // Start consensus
        let result = consensus.start_consensus().await;
        assert!(result.is_ok());
        
        // Check status
        let status = consensus.get_status().await;
        assert!(matches!(status, ConsensusStatus::Running));
        
        // Stop consensus
        let result = consensus.stop_consensus().await;
        assert!(result.is_ok());
        
        // Check status
        let status = consensus.get_status().await;
        assert!(matches!(status, ConsensusStatus::Stopped));
    }
    
    #[tokio::test]
    async fn test_block_proposal() {
        let config = ConsensusConfig::default();
        let mut consensus = Consensus::new(config).unwrap();
        
        // Start consensus
        consensus.start_consensus().await.unwrap();
        
        // Create test transaction
        let tx = create_test_transaction();
        
        // Propose block
        let result = consensus.propose_block(vec![tx]).await;
        assert!(result.is_ok());
        
        // Stop consensus
        consensus.stop_consensus().await.unwrap();
    }
}