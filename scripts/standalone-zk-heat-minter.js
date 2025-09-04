const { ethers } = require("hardhat");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * 🚀 Standalone ZK Proof Generator for HEAT Minting on Arbitrum
 * 
 * This script provides a complete solution for minting HEAT on Arbitrum
 * using ZK proofs of XFG burns, before COLD L3 launches.
 * 
 * Features:
 * - Uses existing Halo2 IPA circuit from tools/prove-burn/
 * - Enforces one-time address privacy
 * - Validates real XFG burn transactions
 * - Generates and submits ZK proofs
 * - Handles both individual and batch processing
 */

class StandaloneZKHeatMinter {
    constructor(config) {
        this.config = {
            // Contract addresses
            heatTokenAddress: config.heatTokenAddress,
            verifierAddress: config.verifierAddress,
            
            // Network configuration
            network: config.network || "arbitrumOne",
            
            // ZK circuit configuration
            circuitPath: config.circuitPath || "./tools/prove-burn",
            proofOutputPath: config.proofOutputPath || "./proofs",
            
            // Privacy configuration
            enforceOneTimeAddress: config.enforceOneTimeAddress !== false,
            standardizedDeposit: config.standardizedDeposit || "800000000", // 0.8 XFG in raw units
            
            // Gas optimization
            batchSize: config.batchSize || 10,
            maxGasPrice: config.maxGasPrice || ethers.utils.parseUnits("0.1", "gwei"),
            
            ...config
        };
        
        this.provider = null;
        this.signer = null;
        this.heatToken = null;
        this.verifier = null;
    }

    /**
     * Initialize the minter with contracts and signer
     */
    async initialize() {
        console.log("🔧 Initializing Standalone ZK Heat Minter...");
        
        // Setup provider and signer
        this.provider = ethers.provider;
        this.signer = (await ethers.getSigners())[0];
        
        console.log("📋 Configuration:");
        console.log("- Network:", this.config.network);
        console.log("- Heat Token:", this.config.heatTokenAddress);
        console.log("- Verifier:", this.config.verifierAddress);
        console.log("- One-time Privacy:", this.config.enforceOneTimeAddress);
        console.log("- Standardized Deposit:", this.config.standardizedDeposit);
        console.log("- Batch Size:", this.config.batchSize);
        console.log();
        
        // Load contracts
        const HeatToken = await ethers.getContractFactory("HEATTokenArbitrum");
        const Verifier = await ethers.getContractFactory("RealXFGProofValidator");
        
        this.heatToken = HeatToken.attach(this.config.heatTokenAddress);
        this.verifier = Verifier.attach(this.config.verifierAddress);
        
        // Verify contracts are accessible
        await this.heatToken.totalSupply();
        console.log("✅ Contracts loaded successfully");
        
        // Create proof output directory
        if (!fs.existsSync(this.config.proofOutputPath)) {
            fs.mkdirSync(this.config.proofOutputPath, { recursive: true });
        }
        
        console.log("🚀 Standalone ZK Heat Minter ready!");
        console.log();
    }

    /**
     * Generate ZK proof for a single XFG burn transaction
     */
    async generateProof(burnData) {
        console.log("🔐 Generating ZK proof for burn transaction...");
        console.log("Burn TX:", burnData.txHash);
        console.log("Amount:", burnData.amount, "XFG");
        console.log("From:", burnData.from);
        console.log();
        
        // Validate standardized deposit requirement
        if (burnData.amount !== this.config.standardizedDeposit) {
            throw new Error(`Invalid amount: ${burnData.amount}. Must be exactly ${this.config.standardizedDeposit} (0.8 XFG)`);
        }
        
        // Prepare circuit input
        const circuitInput = {
            // Public inputs
            txHash: burnData.txHash,
            from: burnData.from,
            to: burnData.to,
            amount: burnData.amount,
            blockHeight: burnData.blockHeight,
            blockHash: burnData.blockHash,
            
            // Private inputs (for circuit)
            secret: burnData.secret,
            signature: burnData.signature,
            merkleProof: burnData.merkleProof,
            
            // Privacy inputs
            nullifier: ethers.utils.keccak256(burnData.secret),
            commitment: ethers.utils.keccak256(ethers.utils.keccak256(burnData.secret))
        };
        
        // Save circuit input
        const inputPath = path.join(this.config.proofOutputPath, `${burnData.txHash}_input.json`);
        fs.writeFileSync(inputPath, JSON.stringify(circuitInput, null, 2));
        
        // Generate ZK proof using Halo2 circuit
        console.log("⚡ Running Halo2 circuit...");
        try {
            const proofCommand = `cd ${this.config.circuitPath} && cargo run --bin prove-burn -- ${inputPath}`;
            const proofOutput = execSync(proofCommand, { encoding: 'utf8' });
            
            // Parse proof output
            const proofData = JSON.parse(proofOutput);
            
            // Save proof
            const proofPath = path.join(this.config.proofOutputPath, `${burnData.txHash}_proof.json`);
            fs.writeFileSync(proofPath, JSON.stringify(proofData, null, 2));
            
            console.log("✅ ZK proof generated successfully");
            console.log("Proof size:", proofData.proof.length, "bytes");
            console.log("Public inputs:", proofData.publicInputs.length);
            
            return proofData;
            
        } catch (error) {
            console.error("❌ ZK proof generation failed:", error.message);
            throw error;
        }
    }

    /**
     * Submit ZK proof to Arbitrum and mint HEAT
     */
    async submitProofAndMint(burnData, proofData, recipientAddress) {
        console.log("🚀 Submitting proof and minting HEAT...");
        console.log("Recipient:", recipientAddress);
        console.log("Amount: 8,000,000 HEAT (0.8 XFG)");
        console.log();
        
        // Check one-time address privacy
        if (this.config.enforceOneTimeAddress) {
            const hasMinted = await this.heatToken.hasEverMinted(recipientAddress);
            if (hasMinted) {
                throw new Error(`ONE-TIME RULE: Address ${recipientAddress} already minted HEAT. Use fresh address.`);
            }
        }
        
        // Check nullifier hasn't been used
        const nullifier = ethers.utils.keccak256(burnData.secret);
        const nullifierUsed = await this.verifier.nullifiersUsed(nullifier);
        if (nullifierUsed) {
            throw new Error(`Nullifier already used: ${nullifier}`);
        }
        
        // Prepare transaction data
        const txData = {
            secret: burnData.secret,
            proof: proofData.proof,
            publicInputs: proofData.publicInputs,
            recipient: recipientAddress
        };
        
        // Estimate gas
        const gasEstimate = await this.verifier.estimateGas.claimHEAT(
            txData.secret,
            txData.proof,
            txData.publicInputs,
            txData.recipient
        );
        
        console.log("Gas estimate:", gasEstimate.toString());
        
        // Submit transaction
        const tx = await this.verifier.claimHEAT(
            txData.secret,
            txData.proof,
            txData.publicInputs,
            txData.recipient,
            {
                gasLimit: gasEstimate.mul(120).div(100), // 20% buffer
                maxFeePerGas: this.config.maxGasPrice
            }
        );
        
        console.log("📝 Transaction submitted:", tx.hash);
        console.log("⏳ Waiting for confirmation...");
        
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed!");
        console.log("Block:", receipt.blockNumber);
        console.log("Gas used:", receipt.gasUsed.toString());
        
        // Verify HEAT was minted
        const balance = await this.heatToken.balanceOf(recipientAddress);
        const expectedAmount = ethers.utils.parseEther("8000000"); // 8M HEAT
        
        if (balance.gte(expectedAmount)) {
            console.log("✅ HEAT minted successfully!");
            console.log("Balance:", ethers.utils.formatEther(balance), "HEAT");
        } else {
            console.log("❌ HEAT minting failed - insufficient balance");
        }
        
        return {
            txHash: tx.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            balance: balance.toString()
        };
    }

    /**
     * Process a single XFG burn → HEAT mint
     */
    async processBurn(burnData, recipientAddress) {
        console.log("🔥 Processing XFG burn for HEAT minting...");
        console.log("=" .repeat(60));
        
        try {
            // Step 1: Generate ZK proof
            const proofData = await this.generateProof(burnData);
            
            // Step 2: Submit proof and mint HEAT
            const result = await this.submitProofAndMint(burnData, proofData, recipientAddress);
            
            console.log("=" .repeat(60));
            console.log("🎉 Burn processing complete!");
            console.log("Transaction:", result.txHash);
            console.log("HEAT Balance:", ethers.utils.formatEther(result.balance));
            
            return result;
            
        } catch (error) {
            console.error("❌ Burn processing failed:", error.message);
            throw error;
        }
    }

    /**
     * Process multiple burns in batch
     */
    async processBatch(burns) {
        console.log("📦 Processing batch of", burns.length, "burns...");
        console.log();
        
        const results = [];
        
        for (let i = 0; i < burns.length; i += this.config.batchSize) {
            const batch = burns.slice(i, i + this.config.batchSize);
            console.log(`Processing batch ${Math.floor(i / this.config.batchSize) + 1}/${Math.ceil(burns.length / this.config.batchSize)}`);
            
            const batchPromises = batch.map(burn => 
                this.processBurn(burn.burnData, burn.recipientAddress)
                    .catch(error => ({ error: error.message, burnData: burn.burnData }))
            );
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            
            // Wait between batches to avoid rate limiting
            if (i + this.config.batchSize < burns.length) {
                console.log("⏳ Waiting 5 seconds before next batch...");
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
        
        // Summary
        const successful = results.filter(r => !r.error).length;
        const failed = results.filter(r => r.error).length;
        
        console.log();
        console.log("📊 Batch Processing Summary:");
        console.log("- Total burns:", burns.length);
        console.log("- Successful:", successful);
        console.log("- Failed:", failed);
        console.log("- Success rate:", ((successful / burns.length) * 100).toFixed(1) + "%");
        
        return results;
    }

    /**
     * Get privacy statistics
     */
    async getPrivacyStats() {
        const stats = await this.heatToken.getPrivacyStats();
        
        console.log("🔒 Privacy Statistics:");
        console.log("- Unique addresses used:", stats.uniqueAddresses.toString());
        console.log("- Total HEAT minted:", ethers.utils.formatEther(stats.totalMinted));
        console.log("- Repeat attempts blocked:", stats.repeatAttempts.toString());
        console.log("- Privacy score:", stats.privacyScore.toString() + "%");
        console.log("- Total XFG burned:", stats.totalXFGBurned.toString());
        
        return stats;
    }

    /**
     * Generate fresh recipient address for privacy
     */
    generateFreshAddress() {
        const wallet = ethers.Wallet.createRandom();
        return wallet.address;
    }

    /**
     * Validate burn data format
     */
    validateBurnData(burnData) {
        const required = ['txHash', 'from', 'to', 'amount', 'blockHeight', 'blockHash', 'secret', 'signature'];
        
        for (const field of required) {
            if (!burnData[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        
        // Validate transaction hash format
        if (!burnData.txHash.startsWith('0x') || burnData.txHash.length !== 66) {
            throw new Error('Invalid transaction hash format');
        }
        
        // Validate address format
        if (!ethers.utils.isAddress(burnData.from) || !ethers.utils.isAddress(burnData.to)) {
            throw new Error('Invalid address format');
        }
        
        // Validate amount
        if (burnData.amount !== this.config.standardizedDeposit) {
            throw new Error(`Amount must be exactly ${this.config.standardizedDeposit} (0.8 XFG)`);
        }
        
        return true;
    }
}

/**
 * Example usage and deployment script
 */
async function main() {
    console.log("🚀 Standalone ZK Heat Minter - Pre-L3 Launch");
    console.log("=" .repeat(60));
    
    // Configuration
    const config = {
        // Contract addresses (deploy these first)
        heatTokenAddress: "0x...", // Deploy HEATTokenArbitrum first
        verifierAddress: "0x...",  // Deploy RealXFGProofValidator first
        
        // Network
        network: "arbitrumOne",
        
        // Privacy settings
        enforceOneTimeAddress: true,
        standardizedDeposit: "800000000", // 0.8 XFG in raw units
        
        // Performance
        batchSize: 5,
        maxGasPrice: ethers.utils.parseUnits("0.1", "gwei")
    };
    
    // Initialize minter
    const minter = new StandaloneZKHeatMinter(config);
    await minter.initialize();
    
    // Example: Process a single burn
    const exampleBurn = {
        txHash: "0x77c45ea61513b10ed0a638218dc9bd113fe55aea4f322856d373a3594087e304",
        from: "0x1234567890abcdef1234567890abcdef12345678",
        to: "0x000000000000000000000000000000000000dEaD",
        amount: "800000000", // 0.8 XFG
        blockHeight: 1,
        blockHash: "0x...",
        secret: "0x...", // 32-byte secret
        signature: "0x...", // 65-byte signature
        merkleProof: [] // Merkle inclusion proof
    };
    
    const freshAddress = minter.generateFreshAddress();
    
    console.log("Example burn processing:");
    console.log("Burn TX:", exampleBurn.txHash);
    console.log("Fresh recipient:", freshAddress);
    console.log();
    
    // Uncomment to process example burn
    // await minter.processBurn(exampleBurn, freshAddress);
    
    // Get privacy stats
    await minter.getPrivacyStats();
    
    console.log();
    console.log("🎯 Ready for production use!");
    console.log("Next steps:");
    console.log("1. Deploy HEATTokenArbitrum contract");
    console.log("2. Deploy RealXFGProofValidator contract");
    console.log("3. Update contract addresses in config");
    console.log("4. Process real XFG burns with ZK proofs");
}

// Export for use in other scripts
module.exports = { StandaloneZKHeatMinter };

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("❌ Script failed:", error);
            process.exit(1);
        });
} 