use anyhow::Result;
use dashmap::DashMap;
use priority_queue::PriorityQueue;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

use block_sync::Transaction;

pub mod error;
pub mod fee;
pub mod priority;

use error::TxPoolError;
use fee::FeeAlgorithm;
use priority::PriorityCalculator;

/// Transaction pool as specified in the outline
pub struct TxPool {
    transactions: DashMap<[u8; 32], Transaction>,
    priority_queue: Arc<RwLock<PriorityQueue<[u8; 32], u64>>>,
    fee_algorithm: Box<dyn FeeAlgorithm + Send + Sync>,
    priority_calculator: Box<dyn PriorityCalculator + Send + Sync>,
    max_size: usize,
}

impl TxPool {
    /// Create a new transaction pool
    pub fn new(
        fee_algorithm: Box<dyn FeeAlgorithm + Send + Sync>,
        priority_calculator: Box<dyn PriorityCalculator + Send + Sync>,
        max_size: usize,
    ) -> Self {
        Self {
            transactions: DashMap::new(),
            priority_queue: Arc::new(RwLock::new(PriorityQueue::new())),
            fee_algorithm,
            priority_calculator,
            max_size,
        }
    }
    
    /// Add transaction as specified in the outline
    pub async fn add_transaction(&mut self, tx: Transaction) -> Result<(), TxPoolError> {
        // Check if pool is full
        if self.transactions.len() >= self.max_size {
            return Err(TxPoolError::PoolFull);
        }
        
        // Validate transaction
        if !self.validate_transaction(&tx).await? {
            return Err(TxPoolError::InvalidTransaction);
        }
        
        // Calculate priority
        let priority = self.priority_calculator.calculate_priority(&tx)?;
        
        // Add to transactions map
        self.transactions.insert(tx.hash, tx.clone());
        
        // Add to priority queue
        {
            let mut queue = self.priority_queue.write().await;
            queue.push(tx.hash, priority);
        }
        
        Ok(())
    }
    
    /// Get transactions as specified in the outline
    pub async fn get_transactions(&self, limit: usize) -> Vec<Transaction> {
        let mut transactions = Vec::new();
        let mut queue = self.priority_queue.write().await;
        
        // Get transactions in priority order
        for _ in 0..limit {
            if let Some((tx_hash, _priority)) = queue.pop() {
                if let Some(tx) = self.transactions.get(&tx_hash) {
                    transactions.push(tx.clone());
                }
            } else {
                break;
            }
        }
        
        // Re-add transactions to queue (they were removed by pop)
        for tx in &transactions {
            let priority = self.priority_calculator.calculate_priority(tx).unwrap_or(0);
            queue.push(tx.hash, priority);
        }
        
        transactions
    }
    
    /// Remove transaction as specified in the outline
    pub async fn remove_transaction(&mut self, tx_hash: &[u8; 32]) -> Result<(), TxPoolError> {
        // Remove from transactions map
        if self.transactions.remove(tx_hash).is_none() {
            return Err(TxPoolError::TransactionNotFound);
        }
        
        // Remove from priority queue
        {
            let mut queue = self.priority_queue.write().await;
            queue.remove(tx_hash);
        }
        
        Ok(())
    }
    
    /// Get transaction by hash
    pub fn get_transaction(&self, tx_hash: &[u8; 32]) -> Option<Transaction> {
        self.transactions.get(tx_hash).map(|tx| tx.clone())
    }
    
    /// Get pool statistics
    pub fn get_stats(&self) -> PoolStats {
        PoolStats {
            total_transactions: self.transactions.len(),
            max_size: self.max_size,
            utilization: self.transactions.len() as f64 / self.max_size as f64,
        }
    }
    
    /// Clear all transactions
    pub async fn clear(&mut self) {
        self.transactions.clear();
        let mut queue = self.priority_queue.write().await;
        queue.clear();
    }
    
    /// Validate transaction
    async fn validate_transaction(&self, tx: &Transaction) -> Result<bool, TxPoolError> {
        // Basic validation
        if tx.fee == 0 {
            return Ok(false);
        }
        
        if tx.inputs.is_empty() || tx.outputs.is_empty() {
            return Ok(false);
        }
        
        // Check for duplicate
        if self.transactions.contains_key(&tx.hash) {
            return Ok(false);
        }
        
        // Validate fee
        let expected_fee = self.fee_algorithm.calculate_fee(tx)?;
        if tx.fee < expected_fee {
            return Ok(false);
        }
        
        Ok(true)
    }
    
    /// Get transactions by fee range
    pub async fn get_transactions_by_fee_range(&self, min_fee: u64, max_fee: u64) -> Vec<Transaction> {
        self.transactions
            .iter()
            .filter_map(|entry| {
                let tx = entry.value();
                if tx.fee >= min_fee && tx.fee <= max_fee {
                    Some(tx.clone())
                } else {
                    None
                }
            })
            .collect()
    }
    
    /// Get transactions by address
    pub async fn get_transactions_by_address(&self, address: &[u8]) -> Vec<Transaction> {
        self.transactions
            .iter()
            .filter_map(|entry| {
                let tx = entry.value();
                
                // Check inputs
                for input in &tx.inputs {
                    // TODO: Extract address from input
                }
                
                // Check outputs
                for output in &tx.outputs {
                    if output.address == address {
                        return Some(tx.clone());
                    }
                }
                
                None
            })
            .collect()
    }
}

/// Pool statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PoolStats {
    pub total_transactions: usize,
    pub max_size: usize,
    pub utilization: f64,
}

/// Transaction with metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionWithMetadata {
    pub transaction: Transaction,
    pub priority: u64,
    pub fee: u64,
    pub timestamp: u64,
}

impl TransactionWithMetadata {
    pub fn new(transaction: Transaction, priority: u64, fee: u64, timestamp: u64) -> Self {
        Self {
            transaction,
            priority,
            fee,
            timestamp,
        }
    }
}

/// Transaction pool configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TxPoolConfig {
    pub max_size: usize,
    pub min_fee: u64,
    pub max_fee: u64,
    pub priority_weight: f64,
    pub fee_weight: f64,
}

impl Default for TxPoolConfig {
    fn default() -> Self {
        Self {
            max_size: 10000,
            min_fee: 1,
            max_fee: u64::MAX,
            priority_weight: 0.5,
            fee_weight: 0.5,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fee::SimpleFeeAlgorithm;
    use crate::priority::SimplePriorityCalculator;
    use block_sync::{TxInput, TxOutput};
    
    #[tokio::test]
    async fn test_add_transaction() {
        let fee_algorithm = Box::new(SimpleFeeAlgorithm::new(1));
        let priority_calculator = Box::new(SimplePriorityCalculator::new());
        let mut pool = TxPool::new(fee_algorithm, priority_calculator, 100);
        
        let tx = create_test_transaction();
        
        let result = pool.add_transaction(tx).await;
        assert!(result.is_ok());
        
        assert_eq!(pool.get_stats().total_transactions, 1);
    }
    
    #[tokio::test]
    async fn test_remove_transaction() {
        let fee_algorithm = Box::new(SimpleFeeAlgorithm::new(1));
        let priority_calculator = Box::new(SimplePriorityCalculator::new());
        let mut pool = TxPool::new(fee_algorithm, priority_calculator, 100);
        
        let tx = create_test_transaction();
        let tx_hash = tx.hash;
        
        pool.add_transaction(tx).await.unwrap();
        assert_eq!(pool.get_stats().total_transactions, 1);
        
        pool.remove_transaction(&tx_hash).await.unwrap();
        assert_eq!(pool.get_stats().total_transactions, 0);
    }
    
    #[tokio::test]
    async fn test_get_transactions() {
        let fee_algorithm = Box::new(SimpleFeeAlgorithm::new(1));
        let priority_calculator = Box::new(SimplePriorityCalculator::new());
        let mut pool = TxPool::new(fee_algorithm, priority_calculator, 100);
        
        // Add multiple transactions
        for i in 0..5 {
            let mut tx = create_test_transaction_with_index(i);
            tx.fee = (i as u64) + 10; // Ensure sufficient fee
            pool.add_transaction(tx).await.unwrap();
        }
        
        let transactions = pool.get_transactions(3).await;
        assert_eq!(transactions.len(), 3);
    }
    
    #[tokio::test]
    async fn test_pool_full() {
        let fee_algorithm = Box::new(SimpleFeeAlgorithm::new(1));
        let priority_calculator = Box::new(SimplePriorityCalculator::new());
        let mut pool = TxPool::new(fee_algorithm, priority_calculator, 1);
        
        let tx1 = create_test_transaction_with_index(1);
        let tx2 = create_test_transaction_with_index(2);
        
        pool.add_transaction(tx1).await.unwrap();
        let result = pool.add_transaction(tx2).await;
        
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), TxPoolError::PoolFull);
    }
    
    fn create_test_transaction() -> Transaction {
        create_test_transaction_with_index(0)
    }
    
    fn create_test_transaction_with_index(index: u8) -> Transaction {
        let mut hash = [0u8; 32];
        hash[0] = index;
        Transaction {
            hash,
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
            fee: 10, // Higher fee to pass validation
            timestamp: 1234567890,
        }
    }
}