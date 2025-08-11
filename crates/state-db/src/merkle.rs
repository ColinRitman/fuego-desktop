use crate::error::StateDBError;
use std::collections::HashMap;
use blake2::{Blake2b, Digest};

/// Simple Merkle trie implementation
pub struct MerkleTrie {
    nodes: HashMap<Vec<u8>, Vec<u8>>,
    root: [u8; 32],
}

impl MerkleTrie {
    pub fn new() -> Self {
        Self {
            nodes: HashMap::new(),
            root: [0u8; 32],
        }
    }
    
    pub fn insert(&mut self, key: &[u8], value: &[u8]) -> Result<(), StateDBError> {
        self.nodes.insert(key.to_vec(), value.to_vec());
        self.update_root();
        Ok(())
    }
    
    pub fn get(&self, key: &[u8]) -> Option<&Vec<u8>> {
        self.nodes.get(key)
    }
    
    pub fn root(&self) -> Result<[u8; 32], StateDBError> {
        Ok(self.root)
    }
    
    fn update_root(&mut self) {
        // Simple hash of all key-value pairs
        // In a real implementation, this would be a proper Merkle tree
        let mut hasher = blake2::Blake2b::new();
        for (key, value) in &self.nodes {
            hasher.update(key);
            hasher.update(value);
        }
        
        let result: [u8; 64] = hasher.finalize().into();
        self.root.copy_from_slice(&result[..32]);
    }
}

impl Default for MerkleTrie {
    fn default() -> Self {
        Self::new()
    }
}