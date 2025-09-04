#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
    console.log("🚀 Initializing COLD L3 Rollup...");
    
    // 1. Create necessary directories
    console.log("\n📁 Creating directory structure...");
    const dirs = [
        'rollup',
        'rollup/config',
        'rollup/data',
        'rollup/logs',
        'deployments'
    ];
    
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`   ✅ Created ${dir}/`);
        }
    });
    
    // 2. Load environment variables
    console.log("\n🔧 Loading configuration...");
    require('dotenv').config();
    
    const config = {
        chainId: process.env.L3_CHAIN_ID || '31338',
        blockTime: process.env.L3_BLOCK_TIME || '8',
        gasPrice: process.env.L3_GAS_PRICE || '1000000000',
        celestiaNamespace: process.env.CELESTIA_NAMESPACE || '000000000000000000000000000000000000000000000000434f4c44'
    };
    
    console.log("   📝 Chain ID:", config.chainId);
    console.log("   ⏱️  Block Time:", config.blockTime + "s");
    console.log("   ⛽ Gas Price:", config.gasPrice);
    console.log("   🏷️  Celestia Namespace:", config.celestiaNamespace);
    
    // 3. Generate genesis configuration
    console.log("\n🌱 Generating genesis configuration...");
    const genesis = generateGenesis(config);
    fs.writeFileSync('rollup/config/genesis.json', JSON.stringify(genesis, null, 2));
    console.log("   ✅ Genesis configuration saved");
    
    // 4. Generate app configuration
    console.log("\n⚙️  Generating app configuration...");
    const appConfig = generateAppConfig(config);
    fs.writeFileSync('rollup/config/app.toml', appConfig);
    console.log("   ✅ App configuration saved");
    
    // 5. Generate Tendermint configuration
    console.log("\n🔗 Generating Tendermint configuration...");
    const tendermintConfig = generateTendermintConfig(config);
    fs.writeFileSync('rollup/config/config.toml', tendermintConfig);
    console.log("   ✅ Tendermint configuration saved");
    
    // 6. Initialize validator key
    console.log("\n🔑 Initializing validator key...");
    try {
        const validatorKey = generateValidatorKey();
        fs.writeFileSync('rollup/config/priv_validator_key.json', JSON.stringify(validatorKey, null, 2));
        console.log("   ✅ Validator key generated");
    } catch (error) {
        console.log("   ⚠️  Validator key generation failed:", error.message);
    }
    
    // 7. Create startup script
    console.log("\n📜 Creating startup script...");
    const startupScript = generateStartupScript(config);
    fs.writeFileSync('rollup/start.sh', startupScript);
    fs.chmodSync('rollup/start.sh', '755');
    console.log("   ✅ Startup script created");
    
    // 8. Create README
    console.log("\n📖 Creating documentation...");
    const readme = generateReadme(config);
    fs.writeFileSync('rollup/README.md', readme);
    console.log("   ✅ Documentation created");
    
    console.log("\n🎉 COLD L3 Rollup initialization completed!");
    console.log("\n📋 Next steps:");
    console.log("   1. Copy env.example to .env and fill in your configuration");
    console.log("   2. Run: npm run celestia:fund");
    console.log("   3. Run: npm run contracts:deploy");
    console.log("   4. Run: npm run rollup:start");
    console.log("\n📁 Configuration files created in: ./rollup/config/");
}

function generateGenesis(config) {
    return {
        "genesis_time": new Date().toISOString(),
        "chain_id": `cold-l3-${config.chainId}`,
        "initial_height": "1",
        "consensus_params": {
            "block": {
                "max_bytes": "2097152",
                "max_gas": "10000000"
            },
            "evidence": {
                "max_age_num_blocks": "100000",
                "max_age_duration": "172800000000000"
            },
            "validator": {
                "pub_key_types": ["ed25519"]
            },
            "version": {}
        },
        "validators": [],
        "app_hash": "",
        "app_state": {
            "cold": {
                "params": {
                    "gas_token": "HEAT",
                    "gas_price": config.gasPrice,
                    "block_time": config.blockTime,
                    "celestia_namespace": config.celestiaNamespace
                },
                "accounts": [],
                "heat_supply": "1000000000000000000000000000"
            }
        }
    };
}

function generateAppConfig(config) {
    return `# COLD L3 Application Configuration

# Gas configuration
[gas]
token = "HEAT"
price = "${config.gasPrice}"
limit = "10000000"

# Celestia DA configuration
[celestia]
namespace = "${config.celestiaNamespace}"
rpc = "${process.env.CELESTIA_RPC_URL || 'https://rpc-mocha.pops.one'}"
rest = "${process.env.CELESTIA_REST_URL || 'https://api-mocha.pops.one'}"

# Settlement configuration
[settlement]
layer = "arbitrum"
rpc = "${process.env.ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc'}"

# API configuration
[api]
enable = true
swagger = true
address = "tcp://0.0.0.0:1317"

# gRPC configuration
[grpc]
enable = true
address = "0.0.0.0:9090"

# State sync configuration
[state-sync]
snapshot-interval = 1000
snapshot-keep-recent = 2
`;
}

function generateTendermintConfig(config) {
    return `# Tendermint Core Configuration

#######################################################################
###                   Main Configuration Options                   ###
#######################################################################

proxy_app = "tcp://127.0.0.1:26658"
moniker = "cold-l3-node"
db_backend = "goleveldb"
db_dir = "data"
log_level = "main:info,state:info,statesync:info,*:error"
log_format = "plain"
genesis_file = "config/genesis.json"
priv_validator_key_file = "config/priv_validator_key.json"
priv_validator_state_file = "data/priv_validator_state.json"
priv_validator_laddr = ""
node_key_file = "config/node_key.json"
abci = "socket"
filter_peers = false

#######################################################################
###                 Advanced Configuration Options                 ###
#######################################################################

#######################################################
###       RPC Server Configuration Options          ###
#######################################################
[rpc]
laddr = "tcp://127.0.0.1:26657"
cors_allowed_origins = []
cors_allowed_methods = ["HEAD", "GET", "POST"]
cors_allowed_headers = ["Origin", "Accept", "Content-Type", "X-Requested-With", "X-Server-Time"]
grpc_laddr = ""
grpc_max_open_connections = 900
unsafe = false
max_open_connections = 900
max_subscription_clients = 100
max_subscriptions_per_client = 5
timeout_broadcast_tx_commit = "10s"
max_body_bytes = 1000000
max_header_bytes = 1048576
tls_cert_file = ""
tls_key_file = ""
pprof_laddr = "localhost:6060"

#######################################################
###           P2P Configuration Options             ###
#######################################################
[p2p]
laddr = "tcp://0.0.0.0:26656"
external_address = ""
seeds = ""
persistent_peers = ""
addr_book_file = "config/addrbook.json"
addr_book_strict = true
max_num_inbound_peers = 40
max_num_outbound_peers = 10
persistent_peers_max_dial_period = "0s"
flush_throttle_timeout = "100ms"
max_packet_msg_payload_size = 1024
send_rate = 5120000
recv_rate = 5120000
pex = true
seed_mode = false
private_peer_ids = ""
allow_duplicate_ip = false
handshake_timeout = "20s"
dial_timeout = "3s"

#######################################################
###          Mempool Configuration Options          ###
#######################################################
[mempool]
version = "v0"
recheck = true
broadcast = true
wal_dir = ""
size = 5000
max_txs_bytes = 1073741824
cache_size = 10000
keep-invalid-txs-in-cache = false
max_tx_bytes = 1048576
max_batch_bytes = 0
ttl-duration = "0s"
ttl-num-blocks = 0

#######################################################
###         State Sync Configuration Options        ###
#######################################################
[statesync]
enable = false
rpc_servers = ""
trust_height = 0
trust_hash = ""
trust_period = "168h0m0s"
discovery_time = "15s"
temp_dir = ""
chunk_request_timeout = "10s"
chunk_fetchers = "4"

#######################################################
###       Fast Sync Configuration Connections       ###
#######################################################
[fastsync]
version = "v0"

#######################################################
###         Consensus Configuration Options         ###
#######################################################
[consensus]
wal_file = "data/cs.wal/wal"
timeout_propose = "${config.blockTime}s"
timeout_propose_delta = "500ms"
timeout_prevote = "1s"
timeout_prevote_delta = "500ms"
timeout_precommit = "1s"
timeout_precommit_delta = "500ms"
timeout_commit = "${config.blockTime}s"
double_sign_check_height = 0
skip_timeout_commit = false
create_empty_blocks = true
create_empty_blocks_interval = "0s"
peer_gossip_sleep_duration = "100ms"
peer_query_maj23_sleep_duration = "2s"

#######################################################
###   Transaction Indexer Configuration Options     ###
#######################################################
[tx_index]
indexer = "kv"
psql-conn = ""

#######################################################
###       Instrumentation Configuration Options     ###
#######################################################
[instrumentation]
prometheus = false
prometheus_listen_addr = ":26660"
max_open_connections = 3
namespace = "tendermint"
`;
}

function generateValidatorKey() {
    // Simplified validator key generation
    // In production, use proper cryptographic key generation
    const crypto = require('crypto');
    const privateKey = crypto.randomBytes(32);
    const publicKey = crypto.randomBytes(32);
    
    return {
        "address": crypto.randomBytes(20).toString('hex').toUpperCase(),
        "pub_key": {
            "type": "tendermint/PubKeyEd25519",
            "value": publicKey.toString('base64')
        },
        "priv_key": {
            "type": "tendermint/PrivKeyEd25519",
            "value": privateKey.toString('base64')
        }
    };
}

function generateStartupScript(config) {
    return `#!/bin/bash

# COLD L3 Rollup Startup Script

set -e

echo "🚀 Starting COLD L3 Rollup..."

# Check if configuration exists
if [ ! -f "config/genesis.json" ]; then
    echo "❌ Genesis file not found. Run npm run rollup:init first."
    exit 1
fi

# Create data directory if it doesn't exist
mkdir -p data

# Start the rollup node
echo "🔗 Starting Tendermint node..."
tendermint node \\
    --home="$(pwd)" \\
    --proxy_app="tcp://127.0.0.1:26658" \\
    --rpc.laddr="tcp://0.0.0.0:26657" \\
    --p2p.laddr="tcp://0.0.0.0:26656" \\
    --log_level="main:info,state:info,*:error"
`;
}

function generateReadme(config) {
    return `# COLD L3 Rollup

This directory contains the configuration and data for the COLD L3 rollup.

## Directory Structure

- \`config/\` - Configuration files
  - \`genesis.json\` - Genesis state
  - \`app.toml\` - Application configuration
  - \`config.toml\` - Tendermint configuration
  - \`priv_validator_key.json\` - Validator private key
- \`data/\` - Blockchain data
- \`logs/\` - Log files

## Starting the Rollup

1. Make sure all dependencies are installed:
   \`\`\`bash
   npm install
   \`\`\`

2. Set up your environment:
   \`\`\`bash
   cp env.example .env
   # Edit .env with your configuration
   \`\`\`

3. Fund your Celestia account:
   \`\`\`bash
   npm run celestia:fund
   \`\`\`

4. Deploy settlement contracts:
   \`\`\`bash
   npm run contracts:deploy
   \`\`\`

5. Start the rollup:
   \`\`\`bash
   npm run rollup:start
   \`\`\`

## Configuration

The rollup uses HEAT tokens as the native gas token and Celestia for data availability.

## RPC Endpoints

- Tendermint RPC: http://localhost:26657
- Application API: http://localhost:1317
- gRPC: localhost:9090

## Monitoring

Check the logs in the \`logs/\` directory for debugging information.
`;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Rollup initialization failed:", error);
        process.exit(1);
    }); 