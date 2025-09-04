#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const { ethers } = require('ethers');

class COLDTestnetSetup {
    constructor() {
        this.config = {
            chainId: 31338,
            blockTime: 30,
            fuegoBlockTime: 480,
            arbitrumSepoliaRpc: 'https://sepolia-rollup.arbitrum.io/rpc',
            celestiaTestnetRpc: 'https://rpc-mocha.pops.one',
            coldRpcPort: 26657,
            fuegoRpcPort: 8081,
            privacyApiPort: 3001
        };
        this.processes = [];
    }

    async setup() {
        console.log('🚀 Setting up COLD L3 Testnet Environment...\n');
        
        try {
            await this.validateEnvironment();
            await this.createDirectories();
            await this.setupTestnetAccounts();
            await this.startLocalServices();
            this.displayConnectionInfo();
        } catch (error) {
            console.error('❌ Testnet setup failed:', error);
            await this.cleanup();
            process.exit(1);
        }
    }

    async validateEnvironment() {
        console.log('🔍 Validating environment...');
        
        if (!process.env.DEPLOYER_PRIVATE_KEY) {
            const wallet = ethers.Wallet.createRandom();
            process.env.DEPLOYER_PRIVATE_KEY = wallet.privateKey;
            console.log('📝 Test private key:', wallet.privateKey);
            console.log('📍 Test address:', wallet.address);
        }
        
        console.log('✅ Environment validated');
    }

    async createDirectories() {
        console.log('📁 Creating directories...');
        
        const dirs = ['./testnet-data', './testnet-config', './testnet-logs', './deployments', './keys'];
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
        
        console.log('✅ Directories created');
    }

    async setupTestnetAccounts() {
        console.log('💰 Setting up testnet accounts...');
        
        const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY);
        const validatorWallet = ethers.Wallet.createRandom();
        const batchPosterWallet = ethers.Wallet.createRandom();
        
        const accounts = {
            deployer: { address: wallet.address, privateKey: wallet.privateKey },
            validator: { address: validatorWallet.address, privateKey: validatorWallet.privateKey },
            batchPoster: { address: batchPosterWallet.address, privateKey: batchPosterWallet.privateKey }
        };
        
        await fs.writeFile('./testnet-accounts.json', JSON.stringify(accounts, null, 2));
        
        console.log('✅ Testnet accounts configured');
        console.log('📍 Deployer:', wallet.address);
        console.log('📍 Validator:', validatorWallet.address);
        console.log('📍 Batch Poster:', batchPosterWallet.address);
    }

    async startLocalServices() {
        console.log('🔧 Starting local services...');
        
        await this.startFuegoSimulator();
        await this.startCOLDL3();
        
        console.log('✅ Local services started');
    }

    async startFuegoSimulator() {
        console.log('🔥 Starting Fuego simulator...');
        
        const simulatorCode = `
const express = require('express');
const crypto = require('crypto');

class FuegoSimulator {
    constructor() {
        this.app = express();
        this.app.use(express.json());
        this.blockchain = { height: 1, difficulty: '0x1d00ffff', blocks: [] };
        this.startBlockGeneration();
        this.setupRoutes();
    }
    
    startBlockGeneration() {
        setInterval(() => this.generateBlock(), ${this.config.fuegoBlockTime * 1000});
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
                this.blockchain.blocks[this.blockchain.blocks.length - 1].hash : '0'.repeat(64)
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
                    res.json({ result: { height: this.blockchain.height, difficulty: this.blockchain.difficulty, blocks: this.blockchain.blocks.length } });
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
        
        const fuegoProcess = spawn('node', ['-e', simulatorCode], { stdio: 'pipe' });
        
        fuegoProcess.stdout.on('data', (data) => {
            console.log('Fuego:', data.toString().trim());
        });
        
        fuegoProcess.stderr.on('data', (data) => {
            console.error('Fuego Error:', data.toString().trim());
        });
        
        this.processes.push(fuegoProcess);
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('✅ Fuego simulator started');
    }

    async startCOLDL3() {
        console.log('❄️ Starting COLD L3...');
        
        const env = {
            ...process.env,
            NODE_ENV: 'testnet',
            PRIVACY_ENABLED: 'true',
            CONFIDENTIAL_TX_ENABLED: 'true',
            ZK_PROOFS_ENABLED: 'true',
            ANONYMOUS_GOVERNANCE_ENABLED: 'true',
            PRIVATE_STAKING_ENABLED: 'true',
            CELESTIA_NAMESPACE_BLINDING: 'true',
            COLD_RPC_URL: 'http://localhost:' + this.config.coldRpcPort,
            FUEGO_RPC_URL: 'http://localhost:' + this.config.fuegoRpcPort,
            ARBITRUM_SEPOLIA_RPC_URL: this.config.arbitrumSepoliaRpc,
            CELESTIA_RPC_URL: this.config.celestiaTestnetRpc,
            L3_CHAIN_ID: this.config.chainId.toString(),
            L3_BLOCK_TIME: this.config.blockTime.toString(),
            FUEGO_BLOCK_TIME: this.config.fuegoBlockTime.toString()
        };
        
        console.log('🚀 Starting COLD L3 privacy system...');
        
        const coldProcess = spawn('node', ['scripts/start-cold-l3-privacy.js'], {
            stdio: 'inherit',
            env: env
        });
        
        this.processes.push(coldProcess);
        console.log('✅ COLD L3 startup initiated');
    }

    displayConnectionInfo() {
        console.log('\n🎉 COLD L3 Testnet Setup Complete!\n');
        
        console.log('📡 **Connection Information:**');
        console.log('   🔗 COLD L3 RPC: http://localhost:' + this.config.coldRpcPort);
        console.log('   🔥 Fuego RPC: http://localhost:' + this.config.fuegoRpcPort);
        console.log('   🔒 Privacy API: http://localhost:' + this.config.privacyApiPort);
        
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
        
        console.log('\n🛑 **To Stop Testnet:**');
        console.log('   Press Ctrl+C to stop all services');
    }

    async cleanup() {
        console.log('🧹 Cleaning up...');
        for (const process of this.processes) {
            process.kill('SIGTERM');
        }
        console.log('✅ Cleanup complete');
    }
}

if (require.main === module) {
    const setup = new COLDTestnetSetup();
    
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down testnet...');
        await setup.cleanup();
        process.exit(0);
    });
    
    setup.setup().catch(console.error);
}

module.exports = COLDTestnetSetup; 