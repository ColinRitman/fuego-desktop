use crate::error::CommitmentError;
use blake2::{Blake2b, Digest};

/// HEAT commitment calculator
pub struct HeatCommitmentCalculator {
    // Configuration for HEAT calculations
    heat_factor: u64,
}

impl HeatCommitmentCalculator {
    pub fn new() -> Self {
        Self {
            heat_factor: 1, // Default heat factor
        }
    }
    
    pub fn with_heat_factor(heat_factor: u64) -> Self {
        Self { heat_factor }
    }
    
    /// Calculate HEAT commitment
    pub fn calculate(&self, data: &[u8]) -> Result<[u8; 32], CommitmentError> {
        // Create a Blake2b hasher
        let mut hasher = Blake2b::new();
        
        // Add heat factor to the hash
        hasher.update(&self.heat_factor.to_le_bytes());
        
        // Add the data
        hasher.update(data);
        
        // Add a "HEAT" prefix to distinguish from other commitments
        hasher.update(b"HEAT");
        
        // Finalize and get the hash
        let result: [u8; 64] = hasher.finalize().into();
        
        // Convert to [u8; 32]
        let mut commitment = [0u8; 32];
        commitment.copy_from_slice(&result[..32]);
        
        Ok(commitment)
    }
    
    /// Set the heat factor
    pub fn set_heat_factor(&mut self, heat_factor: u64) {
        self.heat_factor = heat_factor;
    }
}

impl Default for HeatCommitmentCalculator {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_heat_commitment_calculation() {
        let calculator = HeatCommitmentCalculator::new();
        let test_data = b"test_heat_data";
        
        let commitment = calculator.calculate(test_data).unwrap();
        assert_eq!(commitment.len(), 32);
        
        // Same data should produce same commitment
        let commitment2 = calculator.calculate(test_data).unwrap();
        assert_eq!(commitment, commitment2);
        
        // Different data should produce different commitment
        let different_data = b"different_heat_data";
        let different_commitment = calculator.calculate(different_data).unwrap();
        assert_ne!(commitment, different_commitment);
    }
    
    #[test]
    fn test_heat_factor() {
        let mut calculator = HeatCommitmentCalculator::new();
        let test_data = b"test_heat_factor_data";
        
        let commitment1 = calculator.calculate(test_data).unwrap();
        
        calculator.set_heat_factor(2);
        let commitment2 = calculator.calculate(test_data).unwrap();
        
        // Different heat factors should produce different commitments
        assert_ne!(commitment1, commitment2);
    }
}