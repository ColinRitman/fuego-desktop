use anyhow::Result;
use blake2::{Blake2b, Digest};
use serde::{Deserialize, Serialize};

pub mod error;
pub mod heat;
pub mod yield_commitment;

use error::CommitmentError;

/// Commitment engine as specified in the outline
pub struct CommitmentEngine {
    heat_calculator: heat::HeatCommitmentCalculator,
    yield_calculator: yield_commitment::YieldCommitmentCalculator,
}

impl CommitmentEngine {
    pub fn new() -> Self {
        Self {
            heat_calculator: heat::HeatCommitmentCalculator::new(),
            yield_calculator: yield_commitment::YieldCommitmentCalculator::new(),
        }
    }
    
    /// Calculate HEAT commitment as specified in the outline
    pub fn calculate_heat_commitment(&self, data: &[u8]) -> Result<[u8; 32], CommitmentError> {
        self.heat_calculator.calculate(data)
    }
    
    /// Calculate Yield commitment as specified in the outline
    pub fn calculate_yield_commitment(&self, data: &[u8]) -> Result<[u8; 32], CommitmentError> {
        self.yield_calculator.calculate(data)
    }
    
    /// Verify commitment as specified in the outline
    pub fn verify_commitment(&self, commitment: &[u8; 32], data: &[u8]) -> bool {
        // For now, we'll verify by recalculating and comparing
        // In a real implementation, this might use more sophisticated verification
        match self.calculate_heat_commitment(data) {
            Ok(calculated) => calculated == *commitment,
            Err(_) => false,
        }
    }
}

impl Default for CommitmentEngine {
    fn default() -> Self {
        Self::new()
    }
}

/// HEAT commitment data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeatCommitment {
    pub commitment: [u8; 32],
    pub timestamp: u64,
    pub data_hash: [u8; 32],
}

impl HeatCommitment {
    pub fn new(commitment: [u8; 32], timestamp: u64, data_hash: [u8; 32]) -> Self {
        Self {
            commitment,
            timestamp,
            data_hash,
        }
    }
    
    pub fn verify(&self, data: &[u8]) -> bool {
        let mut hasher = Blake2b::new();
        hasher.update(data);
        let calculated_hash: [u8; 64] = hasher.finalize().into();
        
        self.data_hash == <[u8; 32]>::try_from(&calculated_hash[..32]).unwrap()
    }
}

/// Yield commitment data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YieldCommitment {
    pub commitment: [u8; 32],
    pub timestamp: u64,
    pub yield_amount: u64,
    pub data_hash: [u8; 32],
}

impl YieldCommitment {
    pub fn new(commitment: [u8; 32], timestamp: u64, yield_amount: u64, data_hash: [u8; 32]) -> Self {
        Self {
            commitment,
            timestamp,
            yield_amount,
            data_hash,
        }
    }
    
    pub fn verify(&self, data: &[u8]) -> bool {
        let mut hasher = Blake2b::new();
        hasher.update(data);
        let calculated_hash: [u8; 64] = hasher.finalize().into();
        
        self.data_hash == <[u8; 32]>::try_from(&calculated_hash[..32]).unwrap()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_heat_commitment_calculation() {
        let engine = CommitmentEngine::new();
        let test_data = b"test_heat_data";
        
        let commitment = engine.calculate_heat_commitment(test_data).unwrap();
        assert_eq!(commitment.len(), 32);
        
        // Verify the commitment
        assert!(engine.verify_commitment(&commitment, test_data));
    }
    
    #[test]
    fn test_yield_commitment_calculation() {
        let engine = CommitmentEngine::new();
        let test_data = b"test_yield_data";
        
        let commitment = engine.calculate_yield_commitment(test_data).unwrap();
        assert_eq!(commitment.len(), 32);
    }
    
    #[test]
    fn test_commitment_verification() {
        let engine = CommitmentEngine::new();
        let test_data = b"test_verification_data";
        
        let commitment = engine.calculate_heat_commitment(test_data).unwrap();
        
        // Should verify correctly
        assert!(engine.verify_commitment(&commitment, test_data));
        
        // Should fail with wrong data
        let wrong_data = b"wrong_data";
        assert!(!engine.verify_commitment(&commitment, wrong_data));
    }
    
    #[test]
    fn test_heat_commitment_struct() {
        let test_data = b"test_heat_struct_data";
        let mut hasher = Blake2b::new();
        hasher.update(test_data);
        let data_hash: [u8; 64] = hasher.finalize().into();
        
        let commitment = HeatCommitment::new(
            [1u8; 32],
            1234567890,
            data_hash[..32].try_into().unwrap(),
        );
        
        assert!(commitment.verify(test_data));
        assert!(!commitment.verify(b"wrong_data"));
    }
    
    #[test]
    fn test_yield_commitment_struct() {
        let test_data = b"test_yield_struct_data";
        let mut hasher = Blake2b::new();
        hasher.update(test_data);
        let data_hash: [u8; 64] = hasher.finalize().into();
        
        let commitment = YieldCommitment::new(
            [2u8; 32],
            1234567890,
            1000,
            data_hash[..32].try_into().unwrap(),
        );
        
        assert!(commitment.verify(test_data));
        assert!(!commitment.verify(b"wrong_data"));
    }
}