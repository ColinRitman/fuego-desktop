use crate::error::ConsensusError;
use block_sync::Block;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};
use tokio::time::{Duration, Instant};

/// HotStuff consensus state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConsensusState {
    PrePrepare,
    Prepare,
    Commit,
    Finalized,
}

/// Consensus message types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConsensusMessage {
    BlockFinalized(Block),
    BlockRejected([u8; 32], String),
    ConsensusError(String),
}

/// HotStuff consensus configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HotStuffConfig {
    pub node_id: u64,
    pub total_nodes: u64,
    pub block_time: Duration,
    pub max_block_size: usize,
    pub min_finality: u64,
    pub view_timeout: Duration,
}

impl Default for HotStuffConfig {
    fn default() -> Self {
        Self {
            node_id: 0,
            total_nodes: 4,
            block_time: Duration::from_secs(10),
            max_block_size: 1000,
            min_finality: 2,
            view_timeout: Duration::from_secs(30),
        }
    }
}

/// HotStuff consensus implementation
pub struct HotStuffConsensus {
    config: HotStuffConfig,
    current_view: u64,
    current_leader: u64,
    view_start_time: Instant,
    pending_blocks: Arc<RwLock<HashMap<[u8; 32], Block>>>,
    prepared_blocks: Arc<RwLock<HashMap<[u8; 32], Block>>>,
    committed_blocks: Arc<RwLock<HashMap<[u8; 32], Block>>>,
    message_tx: mpsc::Sender<ConsensusMessage>,
    running: Arc<RwLock<bool>>,
}

impl HotStuffConsensus {
    /// Create a new HotStuff consensus instance
    pub fn new(config: crate::ConsensusConfig) -> Result<Self, ConsensusError> {
        let (message_tx, _) = mpsc::channel(1000);
        
        let hotstuff_config = HotStuffConfig {
            node_id: config.node_id,
            total_nodes: config.total_nodes,
            block_time: config.block_time,
            max_block_size: config.max_block_size,
            min_finality: config.min_finality,
            view_timeout: Duration::from_secs(30),
        };
        
        Ok(Self {
            config: hotstuff_config,
            current_view: 0,
            current_leader: 0,
            view_start_time: Instant::now(),
            pending_blocks: Arc::new(RwLock::new(HashMap::new())),
            prepared_blocks: Arc::new(RwLock::new(HashMap::new())),
            committed_blocks: Arc::new(RwLock::new(HashMap::new())),
            message_tx,
            running: Arc::new(RwLock::new(false)),
        })
    }
    
    /// Start the HotStuff consensus
    pub async fn start(&mut self) -> Result<(), ConsensusError> {
        *self.running.write().await = true;
        
        // Start view management
        let running = self.running.clone();
        let config = self.config.clone();
        let message_tx = self.message_tx.clone();
        tokio::spawn(async move {
            Self::manage_views(running, config, message_tx).await;
        });
        
        Ok(())
    }
    
    /// Stop the HotStuff consensus
    pub async fn stop(&mut self) -> Result<(), ConsensusError> {
        *self.running.write().await = false;
        Ok(())
    }
    
    /// Propose a block for consensus
    pub async fn propose_block(&mut self, block: Block) -> Result<(), ConsensusError> {
        if !*self.running.read().await {
            return Err(ConsensusError::ConsensusNotRunning);
        }
        
        // Check if we are the current leader
        if self.config.node_id != self.current_leader {
            return Err(ConsensusError::HotStuffError("Not the current leader".to_string()));
        }
        
        // Validate block
        self.validate_block(&block).await?;
        
        // Add to pending blocks
        let block_hash = block.header.hash()?;
        self.pending_blocks.write().await.insert(block_hash, block.clone());
        
        // Start consensus process
        self.start_consensus_process(block).await?;
        
        Ok(())
    }
    
    /// Start the consensus process for a block
    async fn start_consensus_process(&mut self, block: Block) -> Result<(), ConsensusError> {
        // Phase 1: Pre-prepare
        self.pre_prepare_phase(&block).await?;
        
        // Phase 2: Prepare
        self.prepare_phase(&block).await?;
        
        // Phase 3: Commit
        self.commit_phase(&block).await?;
        
        Ok(())
    }
    
    /// Pre-prepare phase
    async fn pre_prepare_phase(&mut self, block: &Block) -> Result<(), ConsensusError> {
        // In a real implementation, this would broadcast to all nodes
        println!("Pre-prepare phase for block: {:?}", block.header.hash()?);
        Ok(())
    }
    
    /// Prepare phase
    async fn prepare_phase(&mut self, block: &Block) -> Result<(), ConsensusError> {
        // Simulate prepare votes from other nodes
        let prepare_votes = self.config.total_nodes - 1; // All nodes except leader
        
        if prepare_votes >= self.config.min_finality {
            // Move block to prepared state
            let block_hash = block.header.hash()?;
            self.prepared_blocks.write().await.insert(block_hash, block.clone());
            println!("Prepare phase completed for block: {:?}", block_hash);
        } else {
            return Err(ConsensusError::HotStuffError("Insufficient prepare votes".to_string()));
        }
        
        Ok(())
    }
    
    /// Commit phase
    async fn commit_phase(&mut self, block: &Block) -> Result<(), ConsensusError> {
        // Simulate commit votes from other nodes
        let commit_votes = self.config.total_nodes - 1; // All nodes except leader
        
        if commit_votes >= self.config.min_finality {
            // Move block to committed state
            let block_hash = block.header.hash()?;
            self.committed_blocks.write().await.insert(block_hash, block.clone());
            
            // Send finalized message
            let _ = self.message_tx.send(ConsensusMessage::BlockFinalized(block.clone())).await;
            
            println!("Commit phase completed for block: {:?}", block_hash);
        } else {
            return Err(ConsensusError::HotStuffError("Insufficient commit votes".to_string()));
        }
        
        Ok(())
    }
    
    /// Validate a block
    async fn validate_block(&self, block: &Block) -> Result<(), ConsensusError> {
        // Basic validation
        if block.transactions.len() > self.config.max_block_size {
            return Err(ConsensusError::InvalidBlockProposal("Block too large".to_string()));
        }
        
        // Check if block is from current view
        if block.header.timestamp < self.view_start_time.elapsed().as_secs() {
            return Err(ConsensusError::InvalidBlockProposal("Block timestamp too old".to_string()));
        }
        
        Ok(())
    }
    
    /// Manage view changes
    async fn manage_views(
        running: Arc<RwLock<bool>>,
        config: HotStuffConfig,
        _message_tx: mpsc::Sender<ConsensusMessage>,
    ) {
        let mut current_view = 0u64;
        
        while *running.read().await {
            // Calculate current leader
            let current_leader = current_view % config.total_nodes;
            
            // Check if view timeout has occurred
            tokio::time::sleep(config.view_timeout).await;
            
            // Move to next view
            current_view += 1;
            
            println!("Moving to view {}, leader: {}", current_view, current_leader);
        }
    }
    
    /// Get current view
    pub fn get_current_view(&self) -> u64 {
        self.current_view
    }
    
    /// Get current leader
    pub fn get_current_leader(&self) -> u64 {
        self.current_leader
    }
    
    /// Get pending blocks count
    pub async fn get_pending_blocks_count(&self) -> usize {
        self.pending_blocks.read().await.len()
    }
    
    /// Get prepared blocks count
    pub async fn get_prepared_blocks_count(&self) -> usize {
        self.prepared_blocks.read().await.len()
    }
    
    /// Get committed blocks count
    pub async fn get_committed_blocks_count(&self) -> usize {
        self.committed_blocks.read().await.len()
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
    async fn test_hotstuff_creation() {
        let config = crate::ConsensusConfig::default();
        let hotstuff = HotStuffConsensus::new(config);
        assert!(hotstuff.is_ok());
    }
    
    #[tokio::test]
    async fn test_hotstuff_start_stop() {
        let config = crate::ConsensusConfig::default();
        let mut hotstuff = HotStuffConsensus::new(config).unwrap();
        
        // Start consensus
        let result = hotstuff.start().await;
        assert!(result.is_ok());
        
        // Stop consensus
        let result = hotstuff.stop().await;
        assert!(result.is_ok());
    }
    
    #[tokio::test]
    async fn test_block_proposal() {
        let config = crate::ConsensusConfig {
            node_id: 0,
            total_nodes: 4,
            ..Default::default()
        };
        let mut hotstuff = HotStuffConsensus::new(config).unwrap();
        
        // Start consensus
        hotstuff.start().await.unwrap();
        
        // Create test block
        let block = create_test_block();
        
        // Propose block (should work since we're leader)
        let result = hotstuff.propose_block(block).await;
        assert!(result.is_ok());
        
        // Stop consensus
        hotstuff.stop().await.unwrap();
    }
}