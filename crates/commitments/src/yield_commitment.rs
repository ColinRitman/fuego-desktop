use crate::error::CommitmentError;
use blake2::{Blake2b, Digest};

/// Yield commitment calculator
pub struct YieldCommitmentCalculator {
    // Configuration for Yield calculations
    yield_rate: f64,
}

impl YieldCommitmentCalculator {
    pub fn new() -> Self {
        Self {
            yield_rate: 1.0, // Default yield rate
        }
    }
    
    pub fn with_yield_rate(yield_rate: f64) -> Self {
        Self { yield_rate }
    }
    
    /// Calculate Yield commitment
    pub fn calculate(&self, data: &[u8]) -> Result<[u8; 32], CommitmentError> {
        // Create a Blake2b hasher
        let mut hasher = Blake2b::new();
        
        // Add yield rate to the hash
        hasher.update(&self.yield_rate.to_le_bytes());
        
        // Add the data
        hasher.update(data);
        
        // Add a "YIELD" prefix to distinguish from other commitments
        hasher.update(b"YIELD");
        
        // Finalize and get the hash
        let result: [u8; 64] = hasher.finalize().into();
        
        // Convert to [u8; 32]
        let mut commitment = [0u8; 32];
        commitment.copy_from_slice(&result[..32]);
        
        Ok(commitment)
    }
    
    /// Set the yield rate
    pub fn set_yield_rate(&mut self, yield_rate: f64) {
        self.yield_rate = yield_rate;
    }
    
    /// Calculate yield amount based on data and rate
    pub fn calculate_yield_amount(&self, data: &[u8]) -> u64 {
        // Simple yield calculation based on data length and rate
        // In a real implementation, this would be more sophisticated
        let base_amount = data.len() as u64;
        (base_amount as f64 * self.yield_rate) as u64
    }
}

impl Default for YieldCommitmentCalculator {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_yield_commitment_calculation() {
        let calculator = YieldCommitmentCalculator::new();
        let test_data = b"test_yield_data";
        
        let commitment = calculator.calculate(test_data).unwrap();
        assert_eq!(commitment.len(), 32);
        
        // Same data should produce same commitment
        let commitment2 = calculator.calculate(test_data).unwrap();
        assert_eq!(commitment, commitment2);
        
        // Different data should produce different commitment
        let different_data = b"different_yield_data";
        let different_commitment = calculator.calculate(different_data).unwrap();
        assert_ne!(commitment, different_commitment);
    }
    
    #[test]
    fn test_yield_rate() {
        let mut calculator = YieldCommitmentCalculator::new();
        let test_data = b"test_yield_rate_data";
        
        let commitment1 = calculator.calculate(test_data).unwrap();
        
        calculator.set_yield_rate(2.0);
        let commitment2 = calculator.calculate(test_data).unwrap();
        
        // Different yield rates should produce different commitments
        assert_ne!(commitment1, commitment2);
    }
    
    #[test]
    fn test_yield_amount_calculation() {
        let calculator = YieldCommitmentCalculator::new();
        let test_data = b"test_yield_amount";
        
        let amount = calculator.calculate_yield_amount(test_data);
        assert_eq!(amount, test_data.len() as u64);
        
        let mut calculator_2x = YieldCommitmentCalculator::with_yield_rate(2.0);
        let amount_2x = calculator_2x.calculate_yield_amount(test_data);
        assert_eq!(amount_2x, (test_data.len() as u64) * 2);
    }
}