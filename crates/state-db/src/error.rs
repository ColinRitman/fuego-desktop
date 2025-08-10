use thiserror::Error;

#[derive(Error, Debug)]
pub enum StateDBError {
    #[error("RocksDB error: {0}")]
    RocksDBError(#[from] rocksdb::Error),
    
    #[error("Merkle trie error: {0}")]
    MerkleTrieError(String),
    
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
    
    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),
}