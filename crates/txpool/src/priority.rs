use crate::error::TxPoolError;
use block_sync::Transaction;
use anyhow::Result;

/// Priority calculator trait for transaction ordering
pub trait PriorityCalculator: Send + Sync {
    /// Calculate priority for a transaction
    fn calculate_priority(&self, tx: &Transaction) -> Result<u64, TxPoolError>;
    
    /// Get minimum priority
    fn get_min_priority(&self) -> u64;
    
    /// Get maximum priority
    fn get_max_priority(&self) -> u64;
}

/// Simple priority calculator based on fee
pub struct SimplePriorityCalculator {
    min_priority: u64,
    max_priority: u64,
}

impl SimplePriorityCalculator {
    pub fn new() -> Self {
        Self {
            min_priority: 0,
            max_priority: u64::MAX,
        }
    }
    
    pub fn with_limits(min_priority: u64, max_priority: u64) -> Self {
        Self {
            min_priority,
            max_priority,
        }
    }
}

impl PriorityCalculator for SimplePriorityCalculator {
    fn calculate_priority(&self, tx: &Transaction) -> Result<u64, TxPoolError> {
        // Simple priority based on fee
        let priority = tx.fee;
        
        // Apply limits
        let priority = std::cmp::max(priority, self.min_priority);
        let priority = std::cmp::min(priority, self.max_priority);
        
        Ok(priority)
    }
    
    fn get_min_priority(&self) -> u64 {
        self.min_priority
    }
    
    fn get_max_priority(&self) -> u64 {
        self.max_priority
    }
}

/// Time-based priority calculator
pub struct TimeBasedPriorityCalculator {
    base_priority: u64,
    time_decay_rate: f64,
    min_priority: u64,
    max_priority: u64,
}

impl TimeBasedPriorityCalculator {
    pub fn new() -> Self {
        Self {
            base_priority: 1000,
            time_decay_rate: 0.1,
            min_priority: 0,
            max_priority: u64::MAX,
        }
    }
    
    pub fn with_decay(base_priority: u64, time_decay_rate: f64) -> Self {
        Self {
            base_priority,
            time_decay_rate,
            min_priority: 0,
            max_priority: u64::MAX,
        }
    }
}

impl PriorityCalculator for TimeBasedPriorityCalculator {
    fn calculate_priority(&self, tx: &Transaction) -> Result<u64, TxPoolError> {
        let current_time = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        let age = current_time.saturating_sub(tx.timestamp);
        let decay = (age as f64 * self.time_decay_rate).min(1.0);
        
        let priority = (self.base_priority as f64 * (1.0 - decay)) as u64;
        
        // Apply limits
        let priority = std::cmp::max(priority, self.min_priority);
        let priority = std::cmp::min(priority, self.max_priority);
        
        Ok(priority)
    }
    
    fn get_min_priority(&self) -> u64 {
        self.min_priority
    }
    
    fn get_max_priority(&self) -> u64 {
        self.max_priority
    }
}

/// Multi-factor priority calculator
pub struct MultiFactorPriorityCalculator {
    fee_weight: f64,
    time_weight: f64,
    size_weight: f64,
    min_priority: u64,
    max_priority: u64,
}

impl MultiFactorPriorityCalculator {
    pub fn new() -> Self {
        Self {
            fee_weight: 0.5,
            time_weight: 0.3,
            size_weight: 0.2,
            min_priority: 0,
            max_priority: u64::MAX,
        }
    }
    
    pub fn with_weights(fee_weight: f64, time_weight: f64, size_weight: f64) -> Self {
        Self {
            fee_weight,
            time_weight,
            size_weight,
            min_priority: 0,
            max_priority: u64::MAX,
        }
    }
}

impl PriorityCalculator for MultiFactorPriorityCalculator {
    fn calculate_priority(&self, tx: &Transaction) -> Result<u64, TxPoolError> {
        let current_time = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        // Calculate fee score (normalized)
        let fee_score = tx.fee as f64 / 1000.0; // Normalize to 0-1 range
        
        // Calculate time score (newer = higher priority)
        let age = current_time.saturating_sub(tx.timestamp);
        let time_score = 1.0 / (1.0 + age as f64 / 3600.0); // Decay over hours
        
        // Calculate size score (smaller = higher priority)
        let size = tx.inputs.len() + tx.outputs.len();
        let size_score = 1.0 / (1.0 + size as f64 / 10.0); // Normalize
        
        // Combine scores
        let combined_score = 
            fee_score * self.fee_weight +
            time_score * self.time_weight +
            size_score * self.size_weight;
        
        let priority = (combined_score * 1000.0) as u64;
        
        // Apply limits
        let priority = std::cmp::max(priority, self.min_priority);
        let priority = std::cmp::min(priority, self.max_priority);
        
        Ok(priority)
    }
    
    fn get_min_priority(&self) -> u64 {
        self.min_priority
    }
    
    fn get_max_priority(&self) -> u64 {
        self.max_priority
    }
}

impl Default for SimplePriorityCalculator {
    fn default() -> Self {
        Self::new()
    }
}

impl Default for TimeBasedPriorityCalculator {
    fn default() -> Self {
        Self::new()
    }
}

impl Default for MultiFactorPriorityCalculator {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use block_sync::{TxInput, TxOutput};
    
    fn create_test_transaction(fee: u64, timestamp: u64) -> Transaction {
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
            timestamp,
        }
    }
    
    #[test]
    fn test_simple_priority_calculator() {
        let calculator = SimplePriorityCalculator::new();
        let tx = create_test_transaction(100, 1234567890);
        
        let priority = calculator.calculate_priority(&tx).unwrap();
        assert_eq!(priority, 100);
    }
    
    #[test]
    fn test_time_based_priority_calculator() {
        let calculator = TimeBasedPriorityCalculator::new();
        let current_time = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        let tx = create_test_transaction(100, current_time);
        
        let priority = calculator.calculate_priority(&tx).unwrap();
        assert!(priority > 0);
    }
    
    #[test]
    fn test_multi_factor_priority_calculator() {
        let calculator = MultiFactorPriorityCalculator::new();
        let current_time = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        let tx = create_test_transaction(100, current_time);
        
        let priority = calculator.calculate_priority(&tx).unwrap();
        assert!(priority > 0);
    }
    
    #[test]
    fn test_priority_limits() {
        let calculator = SimplePriorityCalculator::with_limits(10, 50);
        let tx = create_test_transaction(5, 1234567890); // Below min
        
        let priority = calculator.calculate_priority(&tx).unwrap();
        assert_eq!(priority, 10); // Should be clamped to min
        
        let tx = create_test_transaction(100, 1234567890); // Above max
        let priority = calculator.calculate_priority(&tx).unwrap();
        assert_eq!(priority, 50); // Should be clamped to max
    }
}