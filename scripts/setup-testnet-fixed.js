#!/usr/bin/env node

/**
 * COLD L3 Testnet Setup Script
 * 
 * Sets up a complete COLD L3 testnet environment with:
 * - Local Fuego node simulation
 * - Privacy contracts deployment
 * - Celestia testnet integration
 * - Arbitrum Sepolia settlement
 */

const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { ethers } = require('ethers');

class COLDTestnetSetup {
    constructor() {
        this.config = {
            // Network Configuration
            chainId: 31338,
            blockTime: 30, // 30 seconds for testnet
            fuegoBlockTime: 480, // 8 minutes
            
            // RPC URLs
            arbitrumSepoliaRpc: 'https://sepolia-rollup.arbitrum.io/rpc',
            celestiaTestnetRpc: 'https://rpc-mocha.pops.one',
            
            // Local ports
            coldRpcPort: 26657,
            fuegoRpcPort: 8081,
            privacyApiPort: 3001,
            
            // Directories
            dataDir: './testnet-data',
            configDir: './testnet-config',
            logsDir: './testnet-logs'
        };
        
        this.processes = [];
        this.deployedContracts = {};
    }

    /**
     * Main setup sequence
     */
    async setup() {
        console.log('🚀 Setting up COLD L3 Testnet Environment...\n');
        
        try {
            // Step 1: Environment validation
            await this.validateEnvironment();
            
            // Step 2: Create directories
            await this.createDirectories();
            
            // Step 3: Setup testnet accounts
            await this.setupTestnetAccounts();
            
            // Step 4: Start local services
            await this.startLocalServices();
            
            // Step 5: Provide connection info
            this.displayConnectionInfo();
            
        } catch (error) {
            console.error('❌ Testnet setup failed:', error);
            await this.cleanup();
            process.exit(1);
        }
    }

    /**
     * Validate environment and dependencies
     */
    async validateEnvironment() {
        console.log('🔍 Validating environment...');
        
        // Check Node.js version
        const nodeVersion = process.version;
        if (!nodeVersion.startsWith('v18.') && !nodeVersion.startsWith('v20.')) {
            throw new Error(`Node.js 18+ required, found ${nodeVersion}`);
        }
        
        // Generate test private key if not provided
        if (!process.env.DEPLOYER_PRIVATE_KEY) {
            console.log('⚠️  Generating test private key...');
            const wallet = ethers.Wallet.createRandom();
            process.env.DEPLOYER_PRIVATE_KEY = wallet.privateKey;
            console.log(`📝 Test private key: ${wallet.privateKey}`);
            console.log(`📍 Test address: ${wallet.address}`);
            console.log('⚠️  Fund this address with Arbitrum Sepolia ETH for contract deployment');
        }
        
        console.log('✅ Environment validated');
    }

    /**
     * Create necessary directories
     */
    async createDirectories() {
        console.log('📁 Creating directories...');
        
        const dirs = [
            this.config.dataDir,
            this.config.configDir,
            this.config.logsDir,
            './deployments',
            './keys'
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
        
        console.log('✅ Directories created');
    }

    /**
     * Setup testnet accounts and funding
     */
    async setupTestnetAccounts() {
        console.log('💰 Setting up testnet accounts...');
        
        const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY);
        
        // Generate validator and batch poster keys
        const validatorWallet = ethers.Wallet.createRandom();
        const batchPosterWallet = ethers.Wallet.createRandom();
        
        const accounts = {
            deployer: {
                address: wallet.address,
                privateKey: wallet.privateKey
            },
            validator: {
                address: validatorWallet.address,
                privateKey: validatorWallet.privateKey
            },
            batchPoster: {
                address: batchPosterWallet.address,
                privateKey: batchPosterWallet.privateKey
            }
        };
        
        await fs.writeFile(
            './testnet-accounts.json',
            JSON.stringify(accounts, null, 2)
        );
        
        console.log('✅ Testnet accounts configured');
        console.log(`📍 Deployer: ${wallet.address}`);
        console.log(`📍 Validator: ${validatorWallet.address}`);
        console.log(`📍 Batch Poster: ${batchPosterWallet.address}`);
    }

    /**
     * Start local blockchain services
     */
    async startLocalServices() {
        console.log('🔧 Starting local services...');
        
        // Start Fuego simulator
        await this.startFuegoSimulator();
        
        // Start COLD L3 with privacy
        await this.startCOLDL3();
        
        console.log('✅ Local services started');
    }

    /**
     * Start Fuego blockchain simulator
     */
    async startFuegoSimulator() {
        console.log('🔥 Starting Fuego simulator...');
        
        // Create the simulator script content
        const simulatorScript = `
const express = require('express');
const crypto = require('crypto');

class FuegoSimulator {
    constructor() {
        this.app = express();
        this.app.use(express.json());
        
        this.blockchain = {
            height: 1,
            difficulty: '0x1d00ffff',
            blocks: []
        };
        
        this.startBlockGeneration();
        this.setupRoutes();
    }
    
    startBlockGeneration() {
        setInterval(() => {
            this.generateBlock();
        }, ${this.config.fuegoBlockTime * 1000});
        
        // Generate initial block
        this.generateBlock();
    }
    
    generateBlock() {
        const block = {
            height: this.blockchain.height,
            hash: crypto.randomBytes(32).toString('hex'),
            time: Math.floor(Date.now() / 1000),
            difficulty: this.blockchain.difficulty,
            nonce: Math.floor(Math.random() * 1000000),
            merkleroot: crypto.randomBytes(32).toString('hex'),
            previousblockhash: this.blockchain.blocks.length > 0 ? 
                this.blockchain.blocks[this.blockchain.blocks.length - 1].hash : 
                '0'.repeat(64)
        };
        
        this.blockchain.blocks.push(block);
        this.blockchain.height++;
        
        console.log('🔥 Generated Fuego block ' + block.height + ': ' + block.hash.substring(0, 8) + '...');
    }
    
    setupRoutes() {
        this.app.post('/', (req, res) => {
            const { method, params } = req.body;
            
            switch (method) {
                case 'getinfo':
                    res.json({
                        result: {
                            height: this.blockchain.height,
                            difficulty: this.blockchain.difficulty,
                            blocks: this.blockchain.blocks.length
                        }
                    });
                    break;
                    
                case 'getblock':
                    const height = params[0];
                    const block = this.blockchain.blocks.find(b => b.height === height);
                    res.json({ result: block || null });
                    break;
                    
                case 'getbestblockhash':
                    const latest = this.blockchain.blocks[this.blockchain.blocks.length - 1];
                    res.json({ result: latest ? latest.hash : null });
                    break;
                    
                default:
                    res.status(404).json({ error: 'Method not found' });
            }
        });
    }
    
    start() {
        this.app.listen(${this.config.fuegoRpcPort}, () => {
            console.log('🔥 Fuego simulator running on port ${this.config.fuegoRpcPort}');
        });
    }
}

new FuegoSimulator().start();
        `;
        
        const fuegoProcess = spawn('node', ['-e', simulatorScript], {
            stdio: 'pipe'
        });
        
        fuegoProcess.stdout.on('data', (data) => {
            console.log('Fuego:', data.toString().trim());
        });
        
        fuegoProcess.stderr.on('data', (data) => {
            console.error('Fuego Error:', data.toString().trim());
        });
        
        this.processes.push(fuegoProcess);
        
        // Wait for Fuego to start
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('✅ Fuego simulator started');
    }

    /**
     * Start COLD L3 with privacy features
     */
    async startCOLDL3() {
        console.log('❄️  Starting COLD L3...');
        
        // Set environment variables for the startup script
        const env = {
            ...process.env,
            NODE_ENV: 'testnet',
            PRIVACY_ENABLED: 'true',
            CONFIDENTIAL_TX_ENABLED: 'true',
            ZK_PROOFS_ENABLED: 'true',
            ANONYMOUS_GOVERNANCE_ENABLED: 'true',
            PRIVATE_STAKING_ENABLED: 'true',
            CELESTIA_NAMESPACE_BLINDING: 'true',
            COLD_RPC_URL: `http://localhost:${this.config.coldRpcPort}`,
            FUEGO_RPC_URL: `http://localhost:${this.config.fuegoRpcPort}`,
            ARBITRUM_SEPOLIA_RPC_URL: this.config.arbitrumSepoliaRpc,
            CELESTIA_RPC_URL: this.config.celestiaTestnetRpc,
            L3_CHAIN_ID: this.config.chainId.toString(),
            L3_BLOCK_TIME: this.config.blockTime.toString(),
            FUEGO_BLOCK_TIME: this.config.fuegoBlockTime.toString()
        };
        
        console.log('🚀 Starting COLD L3 privacy system...');
        console.log('   This will deploy contracts and start the privacy-enabled rollup');
        console.log('   Check the logs above for deployment progress');
        
        // Start the privacy-enabled COLD L3
        const coldProcess = spawn('node', ['scripts/start-cold-l3-privacy.js'], {
            stdio: 'inherit',
            env: env
        });
        
        this.processes.push(coldProcess);
        
        console.log('✅ COLD L3 startup initiated');
    }

    /**
     * Display connection information
     */
    displayConnectionInfo() {
        console.log('\n🎉 COLD L3 Testnet Setup Complete!\n');
        
        console.log('📡 **Connection Information:**');
        console.log(`   🔗 COLD L3 RPC: http://localhost:${this.config.coldRpcPort}`);
        console.log(`   🔥 Fuego RPC: http://localhost:${this.config.fuegoRpcPort}`);
        console.log(`   🔒 Privacy API: http://localhost:${this.config.privacyApiPort}`);
        
        console.log('\n💰 **Testnet Accounts:**');
        console.log('   📄 See testnet-accounts.json for all account details');
        
        console.log('\n🔧 **Next Steps:**');
        console.log('   1. Fund your deployer account with Arbitrum Sepolia ETH');
        console.log('   2. Wait for COLD L3 to finish starting up');
        console.log('   3. Connect MetaMask to the COLD L3 RPC');
        console.log('   4. Import accounts from testnet-accounts.json');
        console.log('   5. Start testing privacy features!');
        
        console.log('\n💰 **Get Testnet ETH:**');
        console.log('   1. Get Sepolia ETH: https://sepoliafaucet.com');
        console.log('   2. Bridge to Arbitrum Sepolia: https://bridge.arbitrum.io');
        
        console.log('\n📚 **Documentation:**');
        console.log('   🔒 Privacy Guide: ./COLD-PRIVACY-IMPLEMENTATION.md');
        console.log('   🚀 Quick Start: ./COLD-L3-QUICKSTART.md');
        console.log('   📋 Block Migration: ./COLD-BLOCK-TIME-MIGRATION.md');
        
        console.log('\n🛑 **To Stop Testnet:**');
        console.log('   Press Ctrl+C to stop all services');
    }

    /**
     * Utility methods
     */
    async execAsync(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) reject(error);
                else resolve(stdout.trim());
            });
        });
    }

    async cleanup() {
        console.log('🧹 Cleaning up...');
        
        // Kill all processes
        for (const process of this.processes) {
            process.kill('SIGTERM');
        }
        
        console.log('✅ Cleanup complete');
    }
}

// Main execution
if (require.main === module) {
    const setup = new COLDTestnetSetup();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down testnet...');
        await setup.cleanup();
        process.exit(0);
    });
    
    setup.setup().catch(console.error);
}

module.exports = COLDTestnetSetup; 