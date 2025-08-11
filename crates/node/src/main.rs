// node/src/main.rs

use block_sync::BlockSync;
use bridge::{Bridge, BridgeConfig};
use commitments::CommitmentEngine;
use consensus::{Consensus, ConsensusConfig};
use state_db::RocksStateDB;
use txpool::{TxPool, fee::SimpleFeeAlgorithm, priority::SimplePriorityCalculator};
use tokio::task;
use std::path::Path;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Starting COLD L3 Node...");

    // Initialize state database
    let state_db = RocksStateDB::new(Path::new("./data/state"))?;
    println!("✓ State database initialized");

    // Initialize commitment engine
    let commitment_engine = CommitmentEngine::new();
    println!("✓ Commitment engine initialized");

    // Initialize block sync
    let block_sync = BlockSync::new()?;
    println!("✓ Block sync initialized");

    // Initialize transaction pool
    let fee_algorithm = Box::new(SimpleFeeAlgorithm::new(1));
    let priority_calculator = Box::new(SimplePriorityCalculator::new());
    let tx_pool = TxPool::new(fee_algorithm, priority_calculator, 10000);
    println!("✓ Transaction pool initialized");

    // Initialize consensus
    let consensus_config = ConsensusConfig::default();
    let mut consensus = Consensus::new(consensus_config)?;
    println!("✓ Consensus initialized");

    // Initialize bridge
    let bridge_config = BridgeConfig::default();
    let mut bridge = Bridge::new(bridge_config)?;
    println!("✓ Bridge initialized");

    // Start consensus
    consensus.start_consensus().await?;
    println!("✓ Consensus started");

    // Start bridge
    bridge.start().await?;
    println!("✓ Bridge started");

    // Spawn tasks for each subsystem
    task::spawn(async move {
        // Block sync task
        println!("Block sync task started");
        // TODO: Implement actual block syncing
    });

    task::spawn(async move {
        // Transaction pool task
        println!("Transaction pool task started");
        // TODO: Implement transaction processing
    });

    task::spawn(async move {
        // State database task
        println!("State database task started");
        // TODO: Implement state management
    });

    task::spawn(async move {
        // Commitment engine task
        println!("Commitment engine task started");
        // TODO: Implement commitment calculations
    });

    task::spawn(async move {
        // Consensus task
        println!("Consensus task started");
        // TODO: Implement consensus coordination
    });

    task::spawn(async move {
        // Bridge task
        println!("Bridge task started");
        // TODO: Implement bridge coordination
    });

    println!("✓ COLD L3 Node started successfully");
    println!("Node is running. Press Ctrl+C to stop.");

    // Keep the main thread alive
    tokio::signal::ctrl_c().await?;
    println!("Shutting down COLD L3 Node...");

    // Stop bridge
    bridge.stop().await?;
    println!("✓ Bridge stopped");

    // Stop consensus
    consensus.stop_consensus().await?;
    println!("✓ Consensus stopped");

    Ok(())
}