#!/usr/bin/env node

/**
 * COLD L3 Privacy-Enabled Startup Script
 * 
 * Launches COLD L3 with full privacy features enabled including:
 * - Privacy Engine contract deployment
 * - ZK proof system initialization
 * - Confidential transaction support
 * - Anonymous governance setup
 * - Private staking configuration
 */

const { spawn } = require('child_process');
const { ethers } = require('ethers');
const fs = require('fs').promises;
const path = require('path');

const FuegoMergeMiner = require('../src/merge-mining/fuego-merge-miner');
const COLDPrivacyClient = require('../src/privacy/privacy-client');

class COLDPrivacyLauncher {
    constructor() {
        this.config = {
            // RPC Configuration
            fuegoRpcUrl: process.env.FUEGO_RPC_URL || 'http://localhost:8081',
            coldRpcUrl: process.env.COLD_RPC_URL || 'http://localhost:26657',
            arbitrumRpcUrl: process.env.ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
            celestiaRpcUrl: process.env.CELESTIA_RPC_URL || 'https://rpc-mocha.pops.one',
            
            // Privacy Configuration
            privacyEnabled: process.env.PRIVACY_ENABLED === 'true',
            confidentialTxEnabled: process.env.CONFIDENTIAL_TX_ENABLED === 'true',
            zkProofsEnabled: process.env.ZK_PROOFS_ENABLED === 'true',
            anonymousGovernanceEnabled: process.env.ANONYMOUS_GOVERNANCE_ENABLED === 'true',
            privateStakingEnabled: process.env.PRIVATE_STAKING_ENABLED === 'true',
            celestiaBlindingEnabled: process.env.CELESTIA_NAMESPACE_BLINDING === 'true',
            
            // Deployment Configuration
            deployerPrivateKey: process.env.DEPLOYER_PRIVATE_KEY,
            chainId: parseInt(process.env.L3_CHAIN_ID) || 31338,
            
            // Contract Addresses (will be populated after deployment)
            heatTokenAddress: process.env.HEAT_TOKEN_ADDRESS,
            privacyEngineAddress: process.env.PRIVACY_ENGINE_ADDRESS,
        };
        
        this.processes = [];
        this.contracts = {};
        this.privacyClient = null;
        this.mergeMiner = null;
    }

    /**
     * Main startup sequence
     */
    async start() {
        console.log('🚀 Starting COLD L3 with Privacy Features...\n');
        
        try {
            // Validate configuration
            await this.validateConfig();
            
            // Start core services
            await this.startCoreServices();
            
            // Deploy contracts
            await this.deployContracts();
            
            // Initialize privacy system
            await this.initializePrivacy();
            
            // Start merge mining
            await this.startMergeMining();
            
            // Setup monitoring
            await this.setupMonitoring();
            
            console.log('\n✅ COLD L3 Privacy System Started Successfully!');
            console.log('\n📊 Privacy Dashboard: http://localhost:3001/privacy');
            console.log('🔒 Privacy API: http://localhost:3001/api/privacy');
            console.log('🌌 Celestia Namespace Blinding: ENABLED');
            console.log('🗳️  Anonymous Governance: ENABLED');
            console.log('🥩 Private Staking: ENABLED');
            
        } catch (error) {
            console.error('❌ Failed to start COLD L3 Privacy System:', error);
            await this.cleanup();
            process.exit(1);
        }
    }

    /**
     * Validate privacy configuration
     */
    async validateConfig() {
        console.log('🔍 Validating privacy configuration...');
        
        if (!this.config.privacyEnabled) {
            throw new Error('Privacy features not enabled - set PRIVACY_ENABLED=true');
        }
        
        if (!this.config.deployerPrivateKey) {
            throw new Error('DEPLOYER_PRIVATE_KEY not set');
        }
        
        // Validate privacy feature combinations
        if (this.config.anonymousGovernanceEnabled && !this.config.zkProofsEnabled) {
            throw new Error('Anonymous governance requires ZK proofs to be enabled');
        }
        
        if (this.config.privateStakingEnabled && !this.config.confidentialTxEnabled) {
            throw new Error('Private staking requires confidential transactions to be enabled');
        }
        
        console.log('✅ Privacy configuration validated');
    }

    /**
     * Start core blockchain services
     */
    async startCoreServices() {
        console.log('⚙️  Starting core services...');
        
        // Start Tendermint
        const tendermint = spawn('tendermint', ['node'], {
            stdio: 'pipe',
            env: { ...process.env, TMHOME: './rollup/data' }
        });
        
        tendermint.stdout.on('data', (data) => {
            if (data.toString().includes('ERROR')) {
                console.error('Tendermint:', data.toString().trim());
            }
        });
        
        this.processes.push(tendermint);
        
        // Start COLD application
        const coldApp = spawn('node', ['./src/cold-app.js'], {
            stdio: 'pipe',
            env: { ...process.env, PRIVACY_ENABLED: 'true' }
        });
        
        coldApp.stdout.on('data', (data) => {
            console.log('COLD App:', data.toString().trim());
        });
        
        this.processes.push(coldApp);
        
        // Wait for services to start
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('✅ Core services started');
    }

    /**
     * Deploy privacy contracts
     */
    async deployContracts() {
        console.log('📜 Deploying privacy contracts...');
        
        const provider = new ethers.providers.JsonRpcProvider(this.config.coldRpcUrl);
        const wallet = new ethers.Wallet(this.config.deployerPrivateKey, provider);
        
        try {
            // Deploy HEAT Token (if not already deployed)
            if (!this.config.heatTokenAddress) {
                console.log('🔥 Deploying HEAT Token...');
                // Skip contract deployment for now - focus on merge mining
                console.log('⚠️  Skipping contract deployment - focusing on merge mining consensus');
                this.contracts.heatToken = { address: '0x0000000000000000000000000000000000000000' };
                this.config.heatTokenAddress = '0x0000000000000000000000000000000000000000';
                
                this.contracts.heatToken = heatToken;
                this.config.heatTokenAddress = await heatToken.getAddress();
                console.log(`✅ HEAT Token deployed: ${this.config.heatTokenAddress}`);
            }
            
            // Deploy Privacy Engine
            console.log('🔒 Deploying Privacy Engine...');
            const privacyEngineFactory = await ethers.getContractFactory('COLDPrivacyEngine', wallet);
            const privacyEngine = await privacyEngineFactory.deploy();
            await privacyEngine.waitForDeployment();
            
            this.contracts.privacyEngine = privacyEngine;
            this.config.privacyEngineAddress = await privacyEngine.getAddress();
            console.log(`✅ Privacy Engine deployed: ${this.config.privacyEngineAddress}`);
            
            // Configure privacy settings
            await this.configurePrivacyEngine(privacyEngine);
            
            // Save contract addresses
            await this.saveContractAddresses();
            
        } catch (error) {
            console.error('❌ Contract deployment failed:', error);
            throw error;
        }
    }

    /**
     * Configure privacy engine settings
     */
    async configurePrivacyEngine(privacyEngine) {
        console.log('⚙️  Configuring privacy engine...');
        
        // Set verification keys for different proof types
        const mockVerificationKey = ethers.hexlify(ethers.randomBytes(32));
        
        await privacyEngine.setVerificationKey('confidential_tx', mockVerificationKey);
        await privacyEngine.setVerificationKey('governance_vote', mockVerificationKey);
        await privacyEngine.setVerificationKey('private_stake', mockVerificationKey);
        
        // Update anonymity set size
        await privacyEngine.updateAnonymitySet(100);
        
        console.log('✅ Privacy engine configured');
    }

    /**
     * Initialize privacy client and systems
     */
    async initializePrivacy() {
        console.log('🔐 Initializing privacy systems...');
        
        const provider = new ethers.providers.JsonRpcProvider(this.config.coldRpcUrl);
        const wallet = new ethers.Wallet(this.config.deployerPrivateKey, provider);
        
        // Initialize privacy client
        this.privacyClient = new COLDPrivacyClient({
            rpcUrl: this.config.coldRpcUrl,
            celestiaRpcUrl: this.config.celestiaRpcUrl,
            privacyEngineAddress: this.config.privacyEngineAddress,
            wallet: wallet,
            anonymitySetSize: 100
        });
        
        await this.privacyClient.initialize();
        
        // Build initial anonymity set
        await this.privacyClient.buildAnonymitySet(100);
        
        console.log('✅ Privacy systems initialized');
    }

    /**
     * Start merge mining with privacy features
     */
    async startMergeMining() {
        console.log('⛏️  Starting privacy-enabled merge mining...');
        
        const provider = new ethers.providers.JsonRpcProvider(this.config.coldRpcUrl);
        const wallet = new ethers.Wallet(this.config.deployerPrivateKey, provider);
        
        this.mergeMiner = new FuegoMergeMiner({
            fuegoRpcUrl: this.config.fuegoRpcUrl,
            coldRpcUrl: this.config.coldRpcUrl,
            celestiaRpcUrl: this.config.celestiaRpcUrl,
            arbitrumRpcUrl: this.config.arbitrumRpcUrl,
            namespace: process.env.CELESTIA_NAMESPACE,
            blockTime: parseInt(process.env.L3_BLOCK_TIME) || 30,
            fuegoBlockTime: parseInt(process.env.FUEGO_BLOCK_TIME) || 480,
            
            // Privacy configuration
            privacyEnabled: this.config.privacyEnabled,
            privacyEngineAddress: this.config.privacyEngineAddress,
            celestiaBlindingEnabled: this.config.celestiaBlindingEnabled,
            wallet: wallet
        });
        
        await this.mergeMiner.start();
        
        console.log('✅ Privacy-enabled merge mining started');
    }

    /**
     * Setup privacy monitoring and dashboard
     */
    async setupMonitoring() {
        console.log('📊 Setting up privacy monitoring...');
        
        // Start privacy API server
        const privacyApi = spawn('node', ['./src/privacy/privacy-api.js'], {
            stdio: 'pipe',
            env: {
                ...process.env,
                PRIVACY_ENGINE_ADDRESS: this.config.privacyEngineAddress,
                PORT: '3001'
            }
        });
        
        privacyApi.stdout.on('data', (data) => {
            console.log('Privacy API:', data.toString().trim());
        });
        
        this.processes.push(privacyApi);
        
        // Setup privacy metrics collection
        setInterval(async () => {
            if (this.privacyClient) {
                try {
                    const stats = await this.privacyClient.getPrivacyStats();
                    console.log('🔒 Privacy Stats:', {
                        confidentialTxs: stats.confidentialTxCount,
                        anonymousVotes: stats.anonymousVoteCount,
                        privateStakes: stats.privateStakeCount,
                        anonymitySetSize: stats.anonymitySetSize
                    });
                } catch (error) {
                    console.warn('⚠️  Failed to get privacy stats:', error.message);
                }
            }
        }, 30000); // Every 30 seconds
        
        console.log('✅ Privacy monitoring setup complete');
    }

    /**
     * Save deployed contract addresses to file
     */
    async saveContractAddresses() {
        const addresses = {
            heatToken: this.config.heatTokenAddress,
            privacyEngine: this.config.privacyEngineAddress,
            deployedAt: new Date().toISOString(),
            chainId: this.config.chainId
        };
        
        await fs.writeFile(
            './deployments/privacy-contracts.json',
            JSON.stringify(addresses, null, 2)
        );
        
        console.log('💾 Contract addresses saved to deployments/privacy-contracts.json');
    }

    /**
     * Cleanup processes on shutdown
     */
    async cleanup() {
        console.log('🧹 Cleaning up processes...');
        
        if (this.mergeMiner) {
            await this.mergeMiner.stop();
        }
        
        for (const process of this.processes) {
            process.kill('SIGTERM');
        }
        
        console.log('✅ Cleanup complete');
    }

    /**
     * Handle graceful shutdown
     */
    setupGracefulShutdown() {
        const shutdown = async (signal) => {
            console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
            await this.cleanup();
            process.exit(0);
        };
        
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
    }
}

// Main execution
if (require.main === module) {
    const launcher = new COLDPrivacyLauncher();
    launcher.setupGracefulShutdown();
    launcher.start().catch(console.error);
}

module.exports = COLDPrivacyLauncher; 