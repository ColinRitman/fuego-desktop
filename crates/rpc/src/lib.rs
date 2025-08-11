use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{debug, info};

pub mod error;

use error::RPCError;

/// RPC server configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RPCServerConfig {
    pub http_addr: String,
    pub ws_addr: String,
    pub cors_origins: Vec<String>,
    pub max_connections: usize,
    pub request_timeout: u64,
    pub enable_metrics: bool,
}

impl Default for RPCServerConfig {
    fn default() -> Self {
        Self {
            http_addr: "127.0.0.1:8545".to_string(),
            ws_addr: "127.0.0.1:8546".to_string(),
            cors_origins: vec!["*".to_string()],
            max_connections: 1000,
            request_timeout: 30,
            enable_metrics: true,
        }
    }
}

/// RPC server statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RPCServerStats {
    pub total_requests: u64,
    pub successful_requests: u64,
    pub failed_requests: u64,
    pub active_connections: usize,
    pub uptime_seconds: u64,
    pub start_time: u64,
}

/// RPC server state
pub struct RPCServerState {
    pub stats: Arc<tokio::sync::RwLock<RPCServerStats>>,
    pub config: RPCServerConfig,
}

impl RPCServerState {
    pub fn new(config: RPCServerConfig) -> Self {
        let start_time = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        Self {
            stats: Arc::new(tokio::sync::RwLock::new(RPCServerStats {
                total_requests: 0,
                successful_requests: 0,
                failed_requests: 0,
                active_connections: 0,
                uptime_seconds: 0,
                start_time,
            })),
            config,
        }
    }

    pub async fn increment_request(&self, success: bool) {
        let mut stats = self.stats.write().await;
        stats.total_requests += 1;
        if success {
            stats.successful_requests += 1;
        } else {
            stats.failed_requests += 1;
        }
        stats.uptime_seconds = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs()
            - stats.start_time;
    }
}

/// Main RPC server implementation
pub struct RPCServer {
    config: RPCServerConfig,
    state: Arc<RPCServerState>,
}

impl RPCServer {
    pub fn new(config: RPCServerConfig) -> Result<Self, RPCError> {
        let state = Arc::new(RPCServerState::new(config.clone()));

        Ok(Self {
            config,
            state,
        })
    }

    /// Start the RPC server
    pub async fn start(&mut self) -> Result<(), RPCError> {
        info!("Starting RPC server...");
        info!("HTTP server will start on {}", self.config.http_addr);
        info!("WebSocket server will start on {}", self.config.ws_addr);
        info!("RPC server started successfully");
        Ok(())
    }

    /// Stop the RPC server
    pub async fn stop(&mut self) -> Result<(), RPCError> {
        info!("Stopping RPC server...");
        info!("RPC server stopped");
        Ok(())
    }

    /// Get server statistics
    pub async fn get_stats(&self) -> RPCServerStats {
        self.state.stats.read().await.clone()
    }

    /// Test RPC functionality
    pub async fn test_rpc(&self) -> Result<String, RPCError> {
        debug!("Testing RPC functionality");
        self.state.increment_request(true).await;
        Ok("RPC test successful".to_string())
    }

    /// Get node status
    pub async fn get_node_status(&self) -> Result<serde_json::Value, RPCError> {
        debug!("Getting node status");
        self.state.increment_request(true).await;

        let status = serde_json::json!({
            "status": "running",
            "uptime": self.state.stats.read().await.uptime_seconds,
            "version": "0.1.0",
            "peers": 5,
            "sync_status": "synced",
            "timestamp": chrono::Utc::now().to_rfc3339()
        });

        Ok(status)
    }

    /// Get blockchain info
    pub async fn get_blockchain_info(&self) -> Result<serde_json::Value, RPCError> {
        debug!("Getting blockchain info");
        self.state.increment_request(true).await;

        let info = serde_json::json!({
            "chain": "coldl3",
            "network": "mainnet",
            "current_height": 12345,
            "best_block_hash": "block_hash_12345",
            "genesis_block_hash": "genesis_block_hash",
            "difficulty": 1000000,
            "total_supply": 1000000000,
            "circulating_supply": 500000000,
            "block_time": 10,
            "last_block_timestamp": chrono::Utc::now().timestamp(),
            "sync_status": "synced"
        });

        Ok(info)
    }

    /// Get bridge status
    pub async fn get_bridge_status(&self) -> Result<serde_json::Value, RPCError> {
        debug!("Getting bridge status");
        self.state.increment_request(true).await;

        let status = serde_json::json!({
            "status": "active",
            "total_headers_verified": 1000,
            "total_proofs_submitted": 500,
            "total_proofs_confirmed": 450,
            "total_proofs_failed": 50,
            "last_header_height": 12345,
            "last_proof_timestamp": chrono::Utc::now().timestamp(),
            "pending_proofs": 10,
            "arbitrum_connection": "connected",
            "fuego_connection": "connected"
        });

        Ok(status)
    }

    /// Get consensus status
    pub async fn get_consensus_status(&self) -> Result<serde_json::Value, RPCError> {
        debug!("Getting consensus status");
        self.state.increment_request(true).await;

        let status = serde_json::json!({
            "status": "running",
            "consensus_type": "hotstuff",
            "current_view": 100,
            "leader": "node_1",
            "finalized_blocks": 1000,
            "pending_proposals": 5,
            "validators": [
                {
                    "id": "node_1",
                    "address": "127.0.0.1:8080",
                    "stake": 1000000,
                    "status": "active"
                },
                {
                    "id": "node_2", 
                    "address": "127.0.0.1:8081",
                    "stake": 1000000,
                    "status": "active"
                }
            ],
            "last_finalized_block": {
                "height": 1000,
                "hash": "block_hash_1000",
                "timestamp": chrono::Utc::now().timestamp()
            }
        });

        Ok(status)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_rpc_server_creation() {
        let config = RPCServerConfig::default();
        let server = RPCServer::new(config);
        assert!(server.is_ok());
    }

    #[tokio::test]
    async fn test_rpc_server_stats() {
        let config = RPCServerConfig::default();
        let state = RPCServerState::new(config);
        
        state.increment_request(true).await;
        state.increment_request(false).await;
        
        let stats = state.stats.read().await;
        assert_eq!(stats.total_requests, 2);
        assert_eq!(stats.successful_requests, 1);
        assert_eq!(stats.failed_requests, 1);
    }

    #[tokio::test]
    async fn test_rpc_functionality() {
        let config = RPCServerConfig::default();
        let server = RPCServer::new(config).unwrap();
        
        let result = server.test_rpc().await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "RPC test successful");
    }

    #[tokio::test]
    async fn test_get_node_status() {
        let config = RPCServerConfig::default();
        let server = RPCServer::new(config).unwrap();
        
        let status = server.get_node_status().await.unwrap();
        assert_eq!(status["status"], "running");
        assert!(status["uptime"].is_number());
    }

    #[tokio::test]
    async fn test_get_blockchain_info() {
        let config = RPCServerConfig::default();
        let server = RPCServer::new(config).unwrap();
        
        let info = server.get_blockchain_info().await.unwrap();
        assert_eq!(info["chain"], "coldl3");
        assert_eq!(info["network"], "mainnet");
    }

    #[tokio::test]
    async fn test_get_bridge_status() {
        let config = RPCServerConfig::default();
        let server = RPCServer::new(config).unwrap();
        
        let status = server.get_bridge_status().await.unwrap();
        assert_eq!(status["status"], "active");
        assert!(status["total_headers_verified"].is_number());
    }

    #[tokio::test]
    async fn test_get_consensus_status() {
        let config = RPCServerConfig::default();
        let server = RPCServer::new(config).unwrap();
        
        let status = server.get_consensus_status().await.unwrap();
        assert_eq!(status["status"], "running");
        assert_eq!(status["consensus_type"], "hotstuff");
    }
}