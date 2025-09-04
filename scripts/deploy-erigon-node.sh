#!/usr/bin/env bash
# deploy-erigon-node.sh -- quick bootstrap script for COLD L3 Erigon validator
#
# Requirements:
#   - Docker or Podman installed
#   - 300 GB free disk (archive node)
#   - Ports 8545 (RPC) and 30303 (p2p) exposed
#
# Usage:
#   ./scripts/deploy-erigon-node.sh mainnet   # connect to mainnet peers
#   ./scripts/deploy-erigon-node.sh testnet   # spin up isolated devnet
#
# Notes:
#   • Erigon v2 (Rust) image from obsoletelabs/erigon-rs:latest
#   • Data dir mounted at $HOME/.cold-erigon
#
set -euo pipefail

NETWORK=${1:-testnet}
DATADIR="$HOME/.cold-erigon/$NETWORK"
IMAGE="obsoletelabs/erigon-rs:latest"

mkdir -p "$DATADIR"

echo "[COLD] Starting Erigon $NETWORK node with data dir $DATADIR"

docker run -d \
  --name "cold-erigon-$NETWORK" \
  -v "$DATADIR:/erigon" \
  -p 8545:8545 \
  -p 30303:30303 \
  $IMAGE \
  --chain="$NETWORK" \
  --datadir=/erigon \
  --http \
  --http.api=eth,net,web3,debug,txpool \
  --http.addr=0.0.0.0 \
  --snapshot=false \
  --prune.r.before=1024 \
  --ws \
  --ws.addr=0.0.0.0 \
  --private.api.addr=0.0.0.0:9090 \
  --metrics \
  --metrics.addr=0.0.0.0

echo "[COLD] Erigon node launched. RPC: http://localhost:8545" 