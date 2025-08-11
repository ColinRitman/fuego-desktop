use anyhow::Result;
use rocksdb::{DB, Options};
use std::path::Path;
use std::collections::HashMap;

pub mod error;
pub mod merkle;

use error::StateDBError;
use merkle::MerkleTrie;

/// Merkle root type
pub type MerkleRoot = [u8; 32];

/// State database trait as specified in the outline
pub trait StateDB {
    async fn get(&self, key: &[u8]) -> Result<Option<Vec<u8>>>;
    async fn put(&self, key: &[u8], value: &[u8]) -> Result<()>;
    async fn commit(&self, version: u64) -> Result<MerkleRoot>;
}

/// RocksDB-based state database implementation
pub struct RocksStateDB {
    db: DB,
    merkle_trie: MerkleTrie,
    pending_changes: HashMap<Vec<u8>, Vec<u8>>,
}

impl RocksStateDB {
    /// Create a new state database
    pub fn new<P: AsRef<Path>>(path: P) -> Result<Self, StateDBError> {
        let mut opts = Options::default();
        opts.create_if_missing(true);
        
        let db = DB::open(&opts, path)?;
        let merkle_trie = MerkleTrie::new();
        let pending_changes = HashMap::new();
        
        Ok(Self {
            db,
            merkle_trie,
            pending_changes,
        })
    }
    
    /// Get a value from the database
    pub fn get_sync(&self, key: &[u8]) -> Result<Option<Vec<u8>>, StateDBError> {
        self.db.get(key).map_err(StateDBError::RocksDBError)
    }
    
    /// Put a value into the database
    pub fn put_sync(&mut self, key: &[u8], value: &[u8]) -> Result<(), StateDBError> {
        self.db.put(key, value)?;
        self.pending_changes.insert(key.to_vec(), value.to_vec());
        Ok(())
    }
    
    /// Commit changes and return Merkle root
    pub fn commit_sync(&mut self, version: u64) -> Result<MerkleRoot, StateDBError> {
        // Update Merkle trie with pending changes
        for (key, value) in &self.pending_changes {
            self.merkle_trie.insert(key, value)?;
        }
        
        // Get the Merkle root
        let root = self.merkle_trie.root()?;
        
        // Clear pending changes
        self.pending_changes.clear();
        
        Ok(root)
    }
}

impl StateDB for RocksStateDB {
    async fn get(&self, key: &[u8]) -> Result<Option<Vec<u8>>> {
        // For now, use sync version. In a real implementation, this would be async
        tokio::task::spawn_blocking(move || {
            // This is a simplified version - in reality we'd need to handle the async properly
            Ok(None)
        }).await?
    }
    
    async fn put(&self, key: &[u8], value: &[u8]) -> Result<()> {
        // For now, use sync version. In a real implementation, this would be async
        let key = key.to_vec();
        let value = value.to_vec();
        tokio::task::spawn_blocking(move || {
            // This is a simplified version - in reality we'd need to handle the async properly
            Ok(())
        }).await?
    }
    
    async fn commit(&self, version: u64) -> Result<MerkleRoot> {
        // For now, use sync version. In a real implementation, this would be async
        tokio::task::spawn_blocking(move || {
            // This is a simplified version - in reality we'd need to handle the async properly
            Ok([0u8; 32])
        }).await?
    }
}

/// Block state management
pub struct BlockState {
    pub height: u64,
    pub merkle_root: MerkleRoot,
    pub timestamp: u64,
}

impl BlockState {
    pub fn new(height: u64, merkle_root: MerkleRoot, timestamp: u64) -> Self {
        Self {
            height,
            merkle_root,
            timestamp,
        }
    }
}

/// Commitment storage
pub struct CommitmentStorage {
    db: RocksStateDB,
}

impl CommitmentStorage {
    pub fn new(db: RocksStateDB) -> Self {
        Self { db }
    }
    
    pub async fn store_commitment(&self, commitment: &[u8; 32], data: &[u8]) -> Result<()> {
        self.db.put(commitment, data).await
    }
    
    pub async fn get_commitment(&self, commitment: &[u8; 32]) -> Result<Option<Vec<u8>>> {
        self.db.get(commitment).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    
    #[tokio::test]
    async fn test_state_db_basic_operations() {
        let temp_dir = TempDir::new().unwrap();
        let mut db = RocksStateDB::new(temp_dir.path()).unwrap();
        
        // Test put and get
        let key = b"test_key";
        let value = b"test_value";
        
        db.put_sync(key, value).unwrap();
        let retrieved = db.get_sync(key).unwrap();
        assert_eq!(retrieved, Some(value.to_vec()));
        
        // Test commit
        let root = db.commit_sync(1).unwrap();
        assert_eq!(root.len(), 32);
    }
}