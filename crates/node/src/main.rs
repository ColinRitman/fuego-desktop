// node/src/main.rs

use node::{ColdL3Node, NodeConfig};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load configuration
    let config = NodeConfig::default();
    
    // Create and start the node
    let mut node = ColdL3Node::new(config).await?;
    
    // Start the node
    node.start().await?;
    
    // Run the main event loop
    node.run().await?;
    
    Ok(())
}