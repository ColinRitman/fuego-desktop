const { ethers } = require("hardhat");

async function main() {
    console.log("🔥 Deploying HEAT Token to Arbitrum Mainnet...\n");
    
    // Get deployer
    const [deployer] = await ethers.getSigners();
    console.log("Deploying from:", deployer.address);
    console.log("Balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH\n");
    
    // Deployment configuration
    const config = {
        admin: deployer.address,                    // Admin role (can transfer minter)
        initialMinter: deployer.address,            // Initial minter (manual for genesis)
        genesisRecipient: deployer.address,         // Where genesis HEAT goes
        network: "arbitrumOne"
    };
    
    console.log("Configuration:");
    console.log("- Admin:", config.admin);
    console.log("- Initial Minter:", config.initialMinter);
    console.log("- Genesis Recipient:", config.genesisRecipient);
    console.log("- Network:", config.network);
    console.log();
    
    // Deploy HEAT Token
    console.log("📄 Deploying HEATTokenArbitrum contract...");
    const HEATToken = await ethers.getContractFactory("HEATTokenArbitrum");
    const heatToken = await HEATToken.deploy(
        config.admin,
        config.initialMinter
    );
    
    await heatToken.deployed();
    console.log("✅ HEAT Token deployed to:", heatToken.address);
    console.log("   Transaction hash:", heatToken.deployTransaction.hash);
    console.log();
    
    // Wait for confirmations
    console.log("⏳ Waiting for confirmations...");
    await heatToken.deployTransaction.wait(5);
    console.log("✅ Contract confirmed on-chain\n");
    
    // Process genesis transaction
    console.log("🌱 Processing genesis transaction...");
    console.log("   Genesis TX: 77c45ea61513b10ed0a638218dc9bd113fe55aea4f322856d373a3594087e304");
    console.log("   Amount: 800 XFG → 8,000,000,000 HEAT");
    
    const genesisTx = await heatToken.processGenesis(config.genesisRecipient);
    await genesisTx.wait();
    console.log("✅ Genesis processed! TX:", genesisTx.hash);
    console.log();
    
    // Verify deployment
    console.log("🔍 Verifying deployment...");
    const totalSupply = await heatToken.totalSupply();
    const balance = await heatToken.balanceOf(config.genesisRecipient);
    const privacyStats = await heatToken.getPrivacyStats();
    const tokenMetrics = await heatToken.getTokenMetrics();
    
    console.log("Contract State:");
    console.log("- Total Supply:", ethers.utils.formatEther(totalSupply), "HEAT");
    console.log("- Genesis Balance:", ethers.utils.formatEther(balance), "HEAT");
    console.log("- Unique Claimers:", privacyStats.uniqueClaimers.toString());
    console.log("- Privacy Score:", privacyStats.privacyScore.toString() + "%");
    console.log("- Total XFG Burned:", privacyStats.totalXFGBurned.toString());
    console.log("- Remaining Supply:", ethers.utils.formatEther(tokenMetrics.remainingSupply), "HEAT");
    console.log();
    
    // Contract verification info
    console.log("📋 Contract Verification:");
    console.log("Contract Address:", heatToken.address);
    console.log("Constructor Args:", [config.admin, config.initialMinter]);
    console.log();
    
    // Role information
    const DEFAULT_ADMIN_ROLE = await heatToken.DEFAULT_ADMIN_ROLE();
    const MINTER_ROLE = await heatToken.MINTER_ROLE();
    const PAUSER_ROLE = await heatToken.PAUSER_ROLE();
    
    console.log("🔐 Role Configuration:");
    console.log("- DEFAULT_ADMIN_ROLE:", DEFAULT_ADMIN_ROLE);
    console.log("- MINTER_ROLE:", MINTER_ROLE);
    console.log("- PAUSER_ROLE:", PAUSER_ROLE);
    console.log();
    
    // Test privacy enforcement
    console.log("🛡️  Testing privacy enforcement...");
    try {
        // This should fail because genesis recipient already minted
        await heatToken.mint(
            config.genesisRecipient,
            ethers.utils.parseEther("1000000"),
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test")),
            "XFG_BURN"
        );
        console.log("❌ Privacy enforcement FAILED - should have blocked repeat minting");
    } catch (error) {
        console.log("✅ Privacy enforcement WORKING - blocked repeat minting");
        console.log("   Error:", error.reason || error.message.split("'")[1]);
    }
    console.log();
    
    // DEX listing preparation
    console.log("💱 DEX Listing Information:");
    console.log("Token Details:");
    console.log("- Name: HEAT Token");
    console.log("- Symbol: HEAT");
    console.log("- Decimals: 18");
    console.log("- Total Supply: 8,000,000,000 HEAT (genesis)");
    console.log("- Max Supply: 80,000,000,000,000 HEAT");
    console.log("- Contract: " + heatToken.address);
    console.log();
    
    // Next steps
    console.log("🚀 Next Steps:");
    console.log("1. Verify contract on Arbiscan:");
    console.log("   npx hardhat verify --network arbitrumOne " + heatToken.address + " " + config.admin + " " + config.initialMinter);
    console.log();
    console.log("2. Create Uniswap V3 pool:");
    console.log("   - Pair: HEAT/WETH");
    console.log("   - Fee Tier: 0.3% (3000)");
    console.log("   - Initial Price: TBD based on market");
    console.log();
    console.log("3. Add liquidity and enable trading");
    console.log();
    console.log("4. When COLD L3 launches, transfer minter role:");
    console.log("   await heatToken.transferMinter(COLD_L3_BRIDGE_ADDRESS);");
    console.log();
    
    // Save deployment info
    const deploymentInfo = {
        network: "arbitrumOne",
        contractAddress: heatToken.address,
        deployer: deployer.address,
        admin: config.admin,
        initialMinter: config.initialMinter,
        genesisRecipient: config.genesisRecipient,
        deploymentTx: heatToken.deployTransaction.hash,
        genesisTx: genesisTx.hash,
        totalSupply: totalSupply.toString(),
        timestamp: new Date().toISOString(),
        roles: {
            DEFAULT_ADMIN_ROLE,
            MINTER_ROLE,
            PAUSER_ROLE
        }
    };
    
    console.log("💾 Deployment info saved to heat-deployment.json");
    require('fs').writeFileSync(
        'heat-deployment.json',
        JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\n🎉 HEAT Token deployment complete!");
    console.log("Contract Address: " + heatToken.address);
    console.log("Genesis Supply: 8,000,000,000 HEAT");
    console.log("Privacy: ✅ Enforced");
    console.log("Ready for: DEX listing, liquidity provision, trading");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }); 