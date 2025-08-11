use crate::error::TxPoolError;
use block_sync::Transaction;
use anyhow::Result;

/// Fee algorithm trait for pluggable fee calculation
pub trait FeeAlgorithm: Send + Sync {
    /// Calculate fee for a transaction
    fn calculate_fee(&self, tx: &Transaction) -> Result<u64, TxPoolError>;
    
    /// Get minimum fee
    fn get_min_fee(&self) -> u64;
    
    /// Get maximum fee
    fn get_max_fee(&self) -> u64;
}

/// Simple fee algorithm
pub struct SimpleFeeAlgorithm {
    base_fee: u64,
    min_fee: u64,
    max_fee: u64,
}

impl SimpleFeeAlgorithm {
    pub fn new(base_fee: u64) -> Self {
        Self {
            base_fee,
            min_fee: 1,
            max_fee: u64::MAX,
        }
    }
    
    pub fn with_limits(base_fee: u64, min_fee: u64, max_fee: u64) -> Self {
        Self {
            base_fee,
            min_fee,
            max_fee,
        }
    }
}

impl FeeAlgorithm for SimpleFeeAlgorithm {
    fn calculate_fee(&self, tx: &Transaction) -> Result<u64, TxPoolError> {
        // Simple fee calculation based on transaction size
        let size = tx.inputs.len() + tx.outputs.len();
        let fee = self.base_fee * size as u64;
        
        // Apply limits
        let fee = std::cmp::max(fee, self.min_fee);
        let fee = std::cmp::min(fee, self.max_fee);
        
        Ok(fee)
    }
    
    fn get_min_fee(&self) -> u64 {
        self.min_fee
    }
    
    fn get_max_fee(&self) -> u64 {
        self.max_fee
    }
}

/// Dynamic fee algorithm based on network congestion
pub struct DynamicFeeAlgorithm {
    base_fee: u64,
    congestion_multiplier: f64,
    min_fee: u64,
    max_fee: u64,
}

impl DynamicFeeAlgorithm {
    pub fn new(base_fee: u64) -> Self {
        Self {
            base_fee,
            congestion_multiplier: 1.0,
            min_fee: 1,
            max_fee: u64::MAX,
        }
    }
    
    pub fn with_congestion(base_fee: u64, congestion_multiplier: f64) -> Self {
        Self {
            base_fee,
            congestion_multiplier,
            min_fee: 1,
            max_fee: u64::MAX,
        }
    }
    
    pub fn set_congestion_multiplier(&mut self, multiplier: f64) {
        self.congestion_multiplier = multiplier;
    }
}

impl FeeAlgorithm for DynamicFeeAlgorithm {
    fn calculate_fee(&self, tx: &Transaction) -> Result<u64, TxPoolError> {
        // Calculate base fee
        let size = tx.inputs.len() + tx.outputs.len();
        let base_fee = self.base_fee * size as u64;
        
        // Apply congestion multiplier
        let fee = (base_fee as f64 * self.congestion_multiplier) as u64;
        
        // Apply limits
        let fee = std::cmp::max(fee, self.min_fee);
        let fee = std::cmp::min(fee, self.max_fee);
        
        Ok(fee)
    }
    
    fn get_min_fee(&self) -> u64 {
        self.min_fee
    }
    
    fn get_max_fee(&self) -> u64 {
        self.max_fee
    }
}

/// Priority-based fee algorithm
pub struct PriorityFeeAlgorithm {
    base_fee: u64,
    priority_multipliers: Vec<f64>,
    min_fee: u64,
    max_fee: u64,
}

impl PriorityFeeAlgorithm {
    pub fn new(base_fee: u64) -> Self {
        Self {
            base_fee,
            priority_multipliers: vec![1.0, 1.5, 2.0, 3.0, 5.0],
            min_fee: 1,
            max_fee: u64::MAX,
        }
    }
    
    pub fn with_multipliers(base_fee: u64, multipliers: Vec<f64>) -> Self {
        Self {
            base_fee,
            priority_multipliers: multipliers,
            min_fee: 1,
            max_fee: u64::MAX,
        }
    }
}

impl FeeAlgorithm for PriorityFeeAlgorithm {
    fn calculate_fee(&self, tx: &Transaction) -> Result<u64, TxPoolError> {
        // Calculate base fee
        let size = tx.inputs.len() + tx.outputs.len();
        let base_fee = self.base_fee * size as u64;
        
        // Determine priority level (simplified)
        let priority_level = std::cmp::min(tx.fee as usize, self.priority_multipliers.len() - 1);
        let multiplier = self.priority_multipliers[priority_level];
        
        // Apply priority multiplier
        let fee = (base_fee as f64 * multiplier) as u64;
        
        // Apply limits
        let fee = std::cmp::max(fee, self.min_fee);
        let fee = std::cmp::min(fee, self.max_fee);
        
        Ok(fee)
    }
    
    fn get_min_fee(&self) -> u64 {
        self.min_fee
    }
    
    fn get_max_fee(&self) -> u64 {
        self.max_fee
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use block_sync::{TxInput, TxOutput};
    
    fn create_test_transaction(fee: u64) -> Transaction {
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
            fee,
            timestamp: 1234567890,
        }
    }
    
    #[test]
    fn test_simple_fee_algorithm() {
        let algorithm = SimpleFeeAlgorithm::new(10);
        let tx = create_test_transaction(1);
        
        let fee = algorithm.calculate_fee(&tx).unwrap();
        assert_eq!(fee, 20); // 10 * (1 input + 1 output)
    }
    
    #[test]
    fn test_dynamic_fee_algorithm() {
        let mut algorithm = DynamicFeeAlgorithm::with_congestion(10, 2.0);
        let tx = create_test_transaction(1);
        
        let fee = algorithm.calculate_fee(&tx).unwrap();
        assert_eq!(fee, 40); // 10 * (1 + 1) * 2.0
        
        algorithm.set_congestion_multiplier(1.5);
        let fee = algorithm.calculate_fee(&tx).unwrap();
        assert_eq!(fee, 30); // 10 * (1 + 1) * 1.5
    }
    
    #[test]
    fn test_priority_fee_algorithm() {
        let algorithm = PriorityFeeAlgorithm::new(10);
        let tx = create_test_transaction(1);
        
        let fee = algorithm.calculate_fee(&tx).unwrap();
        assert_eq!(fee, 30); // 10 * (1 + 1) * 1.5 (priority level 1)
    }
    
    #[test]
    fn test_fee_limits() {
        let algorithm = SimpleFeeAlgorithm::with_limits(10, 5, 15);
        let tx = create_test_transaction(1);
        
        let fee = algorithm.calculate_fee(&tx).unwrap();
        assert_eq!(fee, 15); // Capped at max_fee
    }
}