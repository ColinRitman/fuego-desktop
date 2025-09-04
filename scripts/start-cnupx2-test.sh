#!/bin/bash

# COLD L3 <-> Fuego CNUPX2 Merge Mining Test Launcher
# 
# This script sets up the environment and launches a comprehensive test
# of merge mining between COLD L3 and Fuego using the CNUPX2 algorithm

set -e

echo "🔥 COLD L3 <-> Fuego CNUPX2 Merge Mining Test"
echo "=============================================="

# Configuration
export FUEGO_RPC_URL="http://localhost:8081"
export COLD_RPC_URL="http://localhost:26657"
export TEST_DURATION=3600  # 1 hour
export MAX_BLOCKS=10       # Test up to 10 Fuego blocks

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Test Configuration:${NC}"
echo "   🔗 Fuego RPC: $FUEGO_RPC_URL"
echo "   ❄️  COLD RPC: $COLD_RPC_URL"
echo "   ⏱️  Duration: ${TEST_DURATION}s"
echo "   📊 Max Blocks: $MAX_BLOCKS"

# Check for Fuego daemon
echo -e "\n${BLUE}🔍 Checking for Fuego daemon...${NC}"
if command -v fuegocoind &> /dev/null; then
    echo -e "   ${GREEN}✅ fuegocoind found${NC}"
    FUEGO_DAEMON="fuegocoind"
elif command -v fuego-daemon &> /dev/null; then
    echo -e "   ${GREEN}✅ fuego-daemon found${NC}"
    FUEGO_DAEMON="fuego-daemon"
elif [ -f "./fuegocoind" ]; then
    echo -e "   ${GREEN}✅ Local fuegocoind found${NC}"
    FUEGO_DAEMON="./fuegocoind"
elif [ -f "../fuego-fresh/build/release/bin/fuegocoind" ]; then
    echo -e "   ${GREEN}✅ Fresh Fuego build found${NC}"
    FUEGO_DAEMON="../fuego-fresh/build/release/bin/fuegocoind"
else
    echo -e "   ${YELLOW}⚠️  No Fuego daemon found - will use simulator${NC}"
    FUEGO_DAEMON=""
fi

# Check for COLD L3 testnet
echo -e "\n${BLUE}❄️  Checking COLD L3 status...${NC}"
if curl -s -f "$COLD_RPC_URL/status" > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ COLD L3 is running${NC}"
else
    echo -e "   ${YELLOW}⚠️  COLD L3 not running - starting testnet...${NC}"
    
    # Start COLD L3 testnet if needed
    if [ -f "scripts/setup-testnet.js" ]; then
        echo -e "   ${BLUE}🚀 Starting COLD L3 testnet...${NC}"
        node scripts/setup-testnet.js &
        TESTNET_PID=$!
        
        # Wait for COLD L3 to start
        echo -e "   ${BLUE}⏳ Waiting for COLD L3 to start...${NC}"
        for i in {1..30}; do
            if curl -s -f "$COLD_RPC_URL/status" > /dev/null 2>&1; then
                echo -e "   ${GREEN}✅ COLD L3 started successfully${NC}"
                break
            fi
            echo -n "."
            sleep 2
        done
    else
        echo -e "   ${RED}❌ COLD L3 setup script not found${NC}"
        exit 1
    fi
fi

# Start Fuego daemon if available
if [ ! -z "$FUEGO_DAEMON" ]; then
    echo -e "\n${BLUE}🔥 Starting Fuego daemon...${NC}"
    
    # Check if already running
    if curl -s -f "$FUEGO_RPC_URL" > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ Fuego daemon already running${NC}"
    else
        echo -e "   ${BLUE}🚀 Starting $FUEGO_DAEMON...${NC}"
        
        # Start Fuego daemon in background
        $FUEGO_DAEMON \
            --rpc-bind-port 8081 \
            --p2p-bind-port 10808 \
            --testnet \
            --enable-cors \
            --rpc-bind-ip 127.0.0.1 \
            --log-level 2 \
            --detach
        
        FUEGO_PID=$!
        
        # Wait for Fuego to start
        echo -e "   ${BLUE}⏳ Waiting for Fuego daemon to start...${NC}"
        for i in {1..30}; do
            if curl -s -f "$FUEGO_RPC_URL" > /dev/null 2>&1; then
                echo -e "   ${GREEN}✅ Fuego daemon started successfully${NC}"
                break
            fi
            echo -n "."
            sleep 2
        done
    fi
fi

# Install dependencies if needed
echo -e "\n${BLUE}📦 Checking dependencies...${NC}"
if [ ! -d "node_modules" ] || [ ! -f "node_modules/axios/package.json" ]; then
    echo -e "   ${BLUE}📥 Installing Node.js dependencies...${NC}"
    npm install axios express
fi

# Create test results directory
mkdir -p test-results

# Run the CNUPX2 merge mining test
echo -e "\n${GREEN}🚀 Starting CNUPX2 Merge Mining Test...${NC}"
echo "=================================================="

# Set up signal handling for cleanup
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"
    
    if [ ! -z "$TESTNET_PID" ]; then
        echo -e "   ${BLUE}🛑 Stopping COLD L3 testnet...${NC}"
        kill $TESTNET_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$FUEGO_PID" ]; then
        echo -e "   ${BLUE}🛑 Stopping Fuego daemon...${NC}"
        kill $FUEGO_PID 2>/dev/null || true
    fi
    
    echo -e "   ${GREEN}✅ Cleanup complete${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Run the test with output logging
export NODE_ENV=test
node scripts/test-merge-mining-cnupx2.js 2>&1 | tee "test-results/cnupx2-test-$(date +%Y%m%d_%H%M%S).log"

# Test completed, cleanup
cleanup 