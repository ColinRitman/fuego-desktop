#!/bin/bash

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
tendermint node \
    --home="$(pwd)" \
    --proxy_app="tcp://127.0.0.1:26658" \
    --rpc.laddr="tcp://0.0.0.0:26657" \
    --p2p.laddr="tcp://0.0.0.0:26656" \
    --log_level="main:info,state:info,*:error"
