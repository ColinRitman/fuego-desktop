#!/usr/bin/env node

/**
 * COLD L3 Rollup Startup Script
 * 
 * This script launches the complete COLD L3 infrastructure:
 * - Fuego merge-mining integration
 * - HEAT token economics
 * - Celestia data availability
 * - Arbitrum settlement
 * - Privacy features
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const FuegoMergeMiner = require('../src/merge-mining/fuego-merge-miner');

// Load environment configuration
require('dotenv').config();

class ColdL3Launcher {
    constructor() {
        this.config = this.loadConfiguration();
        this.processes = new Map();
        this.mergeMiner = null;
        this.isRunning = false;
        
        // Bind event handlers
        this.handleShutdown = this.handleShutdown.bind(this);
        process.on('SIGINT', this.handleShutdown);
        process.on('SIGTERM', this.handleShutdown);
    }
    
    loadConfiguration() {
        const config = {
            // Network configuration
            chainId: process.env.L3_CHAIN_ID || '31338',
            blockTime: parseInt(process.env.L3_BLOCK_TIME) || 8,
            fuegoBlockTime: parseInt(process.env.FUEGO_BLOCK_TIME) || 480,
            
            // RPC endpoints
            fuegoRpcUrl: process.env.FUEGO_RPC_URL || 'http://localhost:8081',
            coldRpcUrl: process.env.COLD_RPC_URL || 'http://localhost:26657',
            celestiaRpcUrl: process.env.CELESTIA_RPC_URL || 'https://rpc-mocha.pops.one',
            arbitrumRpcUrl: process.env.ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
            
            // Celestia configuration
            celestiaNamespace: process.env.CELESTIA_NAMESPACE || '000000000000000000000000000000000000000000000000434f4c44',
            celestiaAuthToken: process.env.CELESTIA_AUTH_TOKEN,
            
            // Contract addresses
            heatTokenAddress: process.env.HEAT_TOKEN_ADDRESS,
            settlementContractAddress: process.env.SETTLEMENT_CONTRACT_ADDRESS,
            
            // Validator configuration
            validatorKey: process.env.VALIDATOR_PRIVATE_KEY,
            validatorAddress: process.env.VALIDATOR_ADDRESS,
            
            // Privacy features
            privacyEnabled: process.env.PRIVACY_ENABLED === 'true',
            confidentialTxEnabled: process.env.CONFIDENTIAL_TX_ENABLED === 'true',
            
            // Development mode
            devMode: process.env.NODE_ENV === 'development'
        };
        
        console.log('📋 Configuration loaded:');
        console.log(`   🆔 Chain ID: ${config.chainId}`);
        console.log(`   ⏱️  Block Time: ${config.blockTime}s`);
        console.log(`   🔥 Fuego Block Time: ${config.fuegoBlockTime}s`);
        console.log(`   🔗 Merge Mining Ratio: ${config.fuegoBlockTime / config.blockTime}:1`);
        console.log(`   🔒 Privacy Enabled: ${config.privacyEnabled}`);
        console.log(`   🧪 Dev Mode: ${config.devMode}`);
        
        return config;
    }
    
    async start() {
        console.log('🚀 Starting COLD L3 Rollup...\n');
        
        try {
            // 1. Validate prerequisites
            await this.validatePrerequisites();
            
            // 2. Start core services
            await this.startCoreServices();
            
            // 3. Deploy/verify contracts
            await this.setupContracts();
            
            // 4. Initialize merge mining
            await this.startMergeMining();
            
            // 5. Start monitoring
            await this.startMonitoring();
            
            this.isRunning = true;
            console.log('\n🎉 COLD L3 Rollup started successfully!');
            console.log('\n📊 Status Dashboard: http://localhost:3000');
            console.log('🔗 RPC Endpoint: http://localhost:26657');
            console.log('📡 GraphQL API: http://localhost:8080/graphql');
            
            // Keep process alive
            this.keepAlive();
            
        } catch (error) {
            console.error('❌ Failed to start COLD L3:', error);
            await this.cleanup();
            process.exit(1);
        }
    }
    
    async validatePrerequisites() {
        console.log('🔍 Validating prerequisites...');
        
        // Check required files
        const requiredFiles = [
            'rollup-config.toml',
            'rollup/config/genesis.json',
            'contracts/HeatTokenL3.sol'
        ];
        
        for (const file of requiredFiles) {
            if (!fs.existsSync(file)) {
                throw new Error(`Required file missing: ${file}`);
            }
        }
        
        // Check network connectivity
        await this.checkNetworkConnectivity();
        
        console.log('   ✅ Prerequisites validated');
    }
    
    async checkNetworkConnectivity() {
        const axios = require('axios');
        
        // Test Celestia connectivity
        try {
            await axios.post(this.config.celestiaRpcUrl, {
                jsonrpc: '2.0',
                method: 'header.NetworkHead',
                params: [],
                id: 1
            }, { timeout: 5000 });
            console.log('   ✅ Celestia network reachable');
        } catch (error) {
            console.warn('   ⚠️  Celestia network unreachable:', error.message);
        }
        
        // Test Arbitrum connectivity
        try {
            await axios.post(this.config.arbitrumRpcUrl, {
                jsonrpc: '2.0',
                method: 'eth_blockNumber',
                params: [],
                id: 1
            }, { timeout: 5000 });
            console.log('   ✅ Arbitrum network reachable');
        } catch (error) {
            console.warn('   ⚠️  Arbitrum network unreachable:', error.message);
        }
    }
    
    async startCoreServices() {
        console.log('🏗️  Starting core services...');
        
        // 1. Start Tendermint node
        await this.startTendermint();
        
        // 2. Start COLD application
        await this.startColdApp();
        
        // 3. Start API gateway
        await this.startApiGateway();
        
        console.log('   ✅ Core services started');
    }
    
    async startTendermint() {
        return new Promise((resolve, reject) => {
            const tendermintProcess = spawn('tendermint', [
                'node',
                '--home', './rollup',
                '--proxy_app', 'tcp://127.0.0.1:26658',
                '--rpc.laddr', 'tcp://0.0.0.0:26657',
                '--p2p.laddr', 'tcp://0.0.0.0:26656'
            ], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env }
            });
            
            this.processes.set('tendermint', tendermintProcess);
            
            tendermintProcess.stdout.on('data', (data) => {
                if (this.config.devMode) {
                    console.log(`[Tendermint] ${data.toString().trim()}`);
                }
            });
            
            tendermintProcess.stderr.on('data', (data) => {
                const message = data.toString().trim();
                if (message.includes('Started node')) {
                    console.log('   ✅ Tendermint node started');
                    resolve();
                } else if (this.config.devMode) {
                    console.log(`[Tendermint] ${message}`);
                }
            });
            
            tendermintProcess.on('error', (error) => {
                console.error('❌ Tendermint process error:', error);
                reject(error);
            });
            
            // Timeout after 30 seconds
            setTimeout(() => {
                if (!tendermintProcess.killed) {
                    console.log('   ✅ Tendermint node started (timeout)');
                    resolve();
                }
            }, 30000);
        });
    }
    
    async startColdApp() {
        return new Promise((resolve, reject) => {
            const coldAppProcess = spawn('node', [
                'src/cold-app/app.js'
            ], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { 
                    ...process.env,
                    TENDERMINT_RPC: this.config.coldRpcUrl
                }
            });
            
            this.processes.set('cold-app', coldAppProcess);
            
            coldAppProcess.stdout.on('data', (data) => {
                const message = data.toString().trim();
                if (message.includes('COLD app started')) {
                    console.log('   ✅ COLD application started');
                    resolve();
                } else if (this.config.devMode) {
                    console.log(`[COLD App] ${message}`);
                }
            });
            
            coldAppProcess.stderr.on('data', (data) => {
                if (this.config.devMode) {
                    console.log(`[COLD App] ${data.toString().trim()}`);
                }
            });
            
            coldAppProcess.on('error', (error) => {
                console.error('❌ COLD app process error:', error);
                reject(error);
            });
            
            // Timeout after 20 seconds
            setTimeout(() => {
                console.log('   ✅ COLD application started (timeout)');
                resolve();
            }, 20000);
        });
    }
    
    async startApiGateway() {
        return new Promise((resolve) => {
            const apiProcess = spawn('node', [
                'src/api/gateway.js'
            ], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { 
                    ...process.env,
                    PORT: '8080'
                }
            });
            
            this.processes.set('api-gateway', apiProcess);
            
            apiProcess.stdout.on('data', (data) => {
                if (this.config.devMode) {
                    console.log(`[API] ${data.toString().trim()}`);
                }
            });
            
            console.log('   ✅ API gateway started');
            resolve();
        });
    }
    
    async setupContracts() {
        console.log('📜 Setting up contracts...');
        
        if (this.config.devMode) {
            // Deploy contracts in development mode
            await this.deployContracts();
        } else {
            // Verify existing contracts in production
            await this.verifyContracts();
        }
        
        console.log('   ✅ Contracts ready');
    }
    
    async deployContracts() {
        return new Promise((resolve, reject) => {
            exec('npm run contracts:deploy', (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ Contract deployment failed:', error);
                    reject(error);
                    return;
                }
                
                console.log('   ✅ Contracts deployed');
                console.log(stdout);
                resolve();
            });
        });
    }
    
    async verifyContracts() {
        const axios = require('axios');
        
        if (this.config.heatTokenAddress) {
            try {
                // Verify HEAT token contract exists
                const response = await axios.post(this.config.arbitrumRpcUrl, {
                    jsonrpc: '2.0',
                    method: 'eth_getCode',
                    params: [this.config.heatTokenAddress, 'latest'],
                    id: 1
                });
                
                if (response.data.result === '0x') {
                    throw new Error('HEAT token contract not found');
                }
                
                console.log('   ✅ HEAT token contract verified');
            } catch (error) {
                throw new Error(`Contract verification failed: ${error.message}`);
            }
        }
    }
    
    async startMergeMining() {
        console.log('⛏️  Starting merge mining...');
        
        this.mergeMiner = new FuegoMergeMiner(this.config);
        
        // Set up event listeners
        this.mergeMiner.on('started', () => {
            console.log('   ✅ Merge mining started');
        });
        
        this.mergeMiner.on('coldBlockProduced', (block) => {
            if (this.config.devMode) {
                console.log(`   ❄️  COLD block ${block.height} produced`);
            }
        });
        
        this.mergeMiner.on('blocksBatch', ({ fuegoBlock, coldBlockCount }) => {
            console.log(`   🔥 Fuego block ${fuegoBlock.height} finalized ${coldBlockCount} COLD blocks`);
        });
        
        this.mergeMiner.on('error', (error) => {
            console.error('❌ Merge mining error:', error);
        });
        
        await this.mergeMiner.start();
    }
    
    async startMonitoring() {
        console.log('📊 Starting monitoring...');
        
        // Start status dashboard
        this.startStatusDashboard();
        
        // Start health checks
        this.startHealthChecks();
        
        console.log('   ✅ Monitoring started');
    }
    
    startStatusDashboard() {
        const dashboardProcess = spawn('node', [
            'src/dashboard/server.js'
        ], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { 
                ...process.env,
                PORT: '3000',
                COLD_RPC_URL: this.config.coldRpcUrl
            }
        });
        
        this.processes.set('dashboard', dashboardProcess);
        
        if (this.config.devMode) {
            dashboardProcess.stdout.on('data', (data) => {
                console.log(`[Dashboard] ${data.toString().trim()}`);
            });
        }
    }
    
    startHealthChecks() {
        setInterval(async () => {
            try {
                await this.performHealthCheck();
            } catch (error) {
                console.error('⚠️  Health check failed:', error.message);
            }
        }, 60000); // Every minute
    }
    
    async performHealthCheck() {
        const axios = require('axios');
        
        // Check Tendermint status
        try {
            const response = await axios.get(`${this.config.coldRpcUrl}/status`);
            const blockHeight = response.data.result.sync_info.latest_block_height;
            
            if (this.config.devMode) {
                console.log(`💓 Health check: COLD block ${blockHeight}`);
            }
        } catch (error) {
            throw new Error(`Tendermint health check failed: ${error.message}`);
        }
    }
    
    keepAlive() {
        // Keep the process running
        setInterval(() => {
            if (!this.isRunning) {
                process.exit(0);
            }
        }, 1000);
    }
    
    async handleShutdown() {
        console.log('\n🛑 Shutting down COLD L3...');
        
        this.isRunning = false;
        
        // Stop merge mining
        if (this.mergeMiner) {
            await this.mergeMiner.stop();
            console.log('   ✅ Merge mining stopped');
        }
        
        // Stop all processes
        await this.cleanup();
        
        console.log('🔚 COLD L3 shutdown complete');
        process.exit(0);
    }
    
    async cleanup() {
        for (const [name, process] of this.processes) {
            try {
                process.kill('SIGTERM');
                console.log(`   ✅ ${name} stopped`);
            } catch (error) {
                console.warn(`   ⚠️  Failed to stop ${name}:`, error.message);
            }
        }
        
        this.processes.clear();
    }
}

// Start the launcher if run directly
if (require.main === module) {
    const launcher = new ColdL3Launcher();
    launcher.start().catch((error) => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    });
}

module.exports = ColdL3Launcher; 