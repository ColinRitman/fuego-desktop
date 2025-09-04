const { ethers } = require("hardhat");

/**
 * 🚀 Deploy Embers Token System to Arbitrum Sepolia Testnet
 * 
 * This script deploys the EmbersToken and XFGProofValidator contracts
 * to Arbitrum Sepolia testnet for testing the burn→mint flow.
 */

async function main() {
    console.log("🚀 Deploying Embers Token System to Arbitrum Sepolia Testnet");
    console.log("=" .repeat(70));
    
    // Get deployer
    const [deployer] = await ethers.getSigners();
    console.log("🧑‍💻 Deployer Account:", deployer.address);
    
    // Check balance
    const balance = await deployer.getBalance();
    console.log("💰 Balance:", ethers.utils.formatEther(balance), "ETH");
    
    if (balance.lt(ethers.utils.parseEther("0.01"))) {
        console.log("⚠️  Warning: Low balance. You may need testnet ETH from:");
        console.log("   https://faucet.triangleplatform.com/arbitrum/sepolia");
        console.log("   https://sepolia.arbiscan.io/");
    }
    console.log();
    
    // Deploy EmbersToken
    console.log("📄 Step 1: Deploying EmbersToken...");
    const EmbersToken = await ethers.getContractFactory("EmbersToken");
    const embersToken = await EmbersToken.deploy(deployer.address);
    await embersToken.deployed();
    console.log("✅ EmbersToken deployed to:", embersToken.address);
    console.log("   Transaction:", embersToken.deployTransaction.hash);
    console.log();
    
    // Deploy MockWinterfellVerifier
    console.log("📄 Step 1b: Deploying Winterfell Verifier (placeholder)...");
    const MockVerifier = await ethers.getContractFactory("MockWinterfellVerifier");
    const verifier = await MockVerifier.deploy();
    await verifier.deployed();
    console.log("✅ Winterfell Verifier deployed to:", verifier.address);
    console.log("   Transaction:", verifier.deployTransaction.hash);
    console.log();

    // Deploy XFG Proof Validator
    console.log("📄 Step 2: Deploying XFG Proof Validator...");
    const XFGProofValidator = await ethers.getContractFactory("XFGProofValidator");
    const validator = await XFGProofValidator.deploy(
        embersToken.address,
        verifier.address,
        deployer.address
    );
    await validator.deployed();
    console.log("✅ XFG Proof Validator deployed to:", validator.address);
    console.log("   Transaction:", validator.deployTransaction.hash);
    console.log();
    
    // Grant minting permission
    console.log("📄 Step 3: Granting minting permission...");
    const tx = await embersToken.transferOwnership(validator.address);
    await tx.wait();
    console.log("✅ Minting permission granted to validator");
    console.log("   Transaction:", tx.hash);
    console.log();
    
    // Verify deployment
    console.log("📄 Step 4: Verifying deployment...");
    const owner = await embersToken.owner();
    const stats = await validator.getStats();
    
    console.log("✅ Deployment verification:");
    console.log("   - EmbersToken owner:", owner);
    console.log("   - Validator is owner:", owner === validator.address);
    console.log("   - Initial stats:", {
        totalProofs: stats._totalProofsVerified.toString(),
        totalEmbers: ethers.utils.formatEther(stats._totalEmbersMinted),
        uniqueClaimers: stats._uniqueClaimers.toString()
    });
    console.log();
    
    // Summary
    console.log("🎯 Deployment Summary");
    console.log("=" .repeat(50));
    console.log("Network: Arbitrum Sepolia Testnet");
    console.log("Deployer:", deployer.address);
    console.log();
    console.log("Contract Addresses:");
    console.log("- EmbersToken:", embersToken.address);
    console.log("- XFG Proof Validator:", validator.address);
    console.log();
    console.log("✅ System Features:");
    console.log("  - Standardized 0.8 XFG burns → 8M Embers");
    console.log("  - One-time address privacy enforcement");
    console.log("  - ZK proof validation (placeholder)");
    console.log("  - Nullifier double-spend protection");
    console.log();
    console.log("🔗 Arbitrum Sepolia Explorer:");
    console.log(`  EmbersToken: https://sepolia.arbiscan.io/address/${embersToken.address}`);
    console.log(`  Validator: https://sepolia.arbiscan.io/address/${validator.address}`);
    console.log();
    console.log("🎉 Deployment Complete!");
    console.log("✅ Ready for burn→mint testing on Arbitrum Sepolia");
    
    // Save deployment info
    const deploymentInfo = {
        timestamp: new Date().toISOString(),
        network: "arbitrumSepolia",
        deployer: deployer.address,
        contracts: {
            embersToken: embersToken.address,
            validator: validator.address
        },
        transactions: {
            embersToken: embersToken.deployTransaction.hash,
            validator: validator.deployTransaction.hash,
            ownership: tx.hash
        },
        explorerUrls: {
            embersToken: `https://sepolia.arbiscan.io/address/${embersToken.address}`,
            validator: `https://sepolia.arbiscan.io/address/${validator.address}`
        }
    };
    
    require('fs').writeFileSync(
        'arbitrum-sepolia-deployment.json',
        JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\n💾 Deployment info saved to arbitrum-sepolia-deployment.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }); 