const { ethers } = require("hardhat");
const fs = require("fs");

/**
 * Deploy Inverse XFG Token (IXFG)
 * A clean, purpose-built token that automatically maintains inverse correlation with XFG
 */

async function main() {
    console.log("🚀 Deploying Inverse XFG Token (IXFG)...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const deployments = {};
    
    // Configuration
    const INITIAL_SUPPLY = ethers.utils.parseEther("100000000"); // 100M IXFG
    const TREASURY_ADDRESS = deployer.address; // Change to actual treasury
    const ORACLE_ADDRESS = deployer.address; // Change to actual oracle

    // 1. Deploy Mock Price Oracle for testing
    console.log("\n📄 Deploying Mock Price Oracle...");
    const MockPriceOracle = await ethers.getContractFactory("MockPriceOracle");
    const priceOracle = await MockPriceOracle.deploy();
    await priceOracle.deployed();
    console.log("✅ Mock Price Oracle deployed to:", priceOracle.address);
    deployments.priceOracle = priceOracle.address;

    // 2. Deploy Inverse XFG Token
    console.log("\n📄 Deploying Inverse XFG Token...");
    const InverseXFGToken = await ethers.getContractFactory("InverseXFGToken");
    const ixfgToken = await InverseXFGToken.deploy(
        TREASURY_ADDRESS,
        priceOracle.address,
        INITIAL_SUPPLY
    );
    await ixfgToken.deployed();
    console.log("✅ Inverse XFG Token deployed to:", ixfgToken.address);
    deployments.ixfgToken = ixfgToken.address;

    // 3. Deploy AMM for IXFG trading
    console.log("\n📄 Deploying IXFG AMM...");
    const IXFGAMM = await ethers.getContractFactory("IXFGAMM");
    const ixfgAMM = await IXFGAMM.deploy(
        ixfgToken.address,
        priceOracle.address
    );
    await ixfgAMM.deployed();
    console.log("✅ IXFG AMM deployed to:", ixfgAMM.address);
    deployments.ixfgAMM = ixfgAMM.address;

    // 4. Configure initial parameters
    console.log("\n🔧 Configuring IXFG parameters...");
    
    // Set initial XFG price in oracle
    const initialXfgPrice = ethers.utils.parseEther("1.0"); // $1 USD
    await priceOracle.setPrice("XFG", initialXfgPrice);
    
    // Update IXFG with initial price
    await ixfgToken.updateXfgPrice(initialXfgPrice);
    
    // Set correlation parameters
    await ixfgToken.updateParameters(
        ethers.utils.parseEther("1.0"), // 100% inverse correlation
        9000, // 90% damping
        200   // 2% rebalance threshold
    );
    
    console.log("✅ IXFG configured with inverse correlation parameters");

    // 5. Add initial liquidity to AMM
    console.log("\n💰 Adding initial liquidity...");
    
    const liquidityAmount = ethers.utils.parseEther("1000000"); // 1M tokens
    await ixfgToken.approve(ixfgAMM.address, liquidityAmount);
    
    try {
        await ixfgAMM.addLiquidity(liquidityAmount, { value: ethers.utils.parseEther("1000") }); // 1000 ETH
        console.log("✅ Initial liquidity added to AMM");
    } catch (error) {
        console.log("⚠️  Could not add liquidity:", error.message);
    }

    // 6. Save deployment information
    const deploymentData = {
        network: await getNetworkName(),
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: deployments,
        tokenDetails: {
            name: "Inverse XFG",
            symbol: "IXFG",
            initialSupply: INITIAL_SUPPLY.toString(),
            maxSupply: ethers.utils.parseEther("1000000000").toString(),
            treasury: TREASURY_ADDRESS,
            oracle: priceOracle.address
        },
        configuration: {
            correlationFactor: "1000000000000000000", // 100%
            dampingFactor: "9000", // 90%
            rebalanceThreshold: "200", // 2%
            yieldRate: "500" // 5% APY
        }
    };

    const outputPath = `deployments/ixfg-${await getNetworkName()}.json`;
    ensureDirectoryExists("deployments");
    fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));

    console.log("\n🎉 Inverse XFG Token (IXFG) deployed successfully!");
    console.log("📝 Deployment data saved to:", outputPath);

    // 7. Display contract information
    console.log("\n📊 Contract Details:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Token Name:", await ixfgToken.name());
    console.log("Token Symbol:", await ixfgToken.symbol());
    console.log("Initial Supply:", ethers.utils.formatEther(await ixfgToken.totalSupply()));
    console.log("Deployer Balance:", ethers.utils.formatEther(await ixfgToken.balanceOf(deployer.address)));
    console.log("Treasury Reserve:", ethers.utils.formatEther(await ixfgToken.treasuryReserve()));
    console.log("Rebalance Reserve:", ethers.utils.formatEther(await ixfgToken.rebalanceReserve()));

    // 8. Display usage instructions
    console.log("\n📋 Usage Instructions:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("1. Update XFG price (triggers inverse adjustment):");
    console.log(`   await ixfgToken.updateXfgPrice(newPrice);`);
    console.log("\n2. Check token status:");
    console.log(`   await ixfgToken.getTokenStatus();`);
    console.log("\n3. Claim yield:");
    console.log(`   await ixfgToken.claimYield();`);
    console.log("\n4. Treasury price adjustment:");
    console.log(`   await ixfgToken.treasuryPriceAdjustment(changePercent, increase);`);

    // 9. Test inverse correlation
    console.log("\n🧪 Testing Inverse Correlation:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    // Test XFG price increase
    const newXfgPrice = ethers.utils.parseEther("1.2"); // 20% increase
    await priceOracle.setPrice("XFG", newXfgPrice);
    await ixfgToken.updateXfgPrice(newXfgPrice);
    
    const status = await ixfgToken.getTokenStatus();
    console.log("XFG Price:", ethers.utils.formatEther(status.currentXfgPrice));
    console.log("IXFG Target Price:", ethers.utils.formatEther(status.targetInversePrice));
    console.log("Price Deviation:", status.priceDeviation.toString(), "basis points");
    
    // Calculate expected inverse price
    const expectedInversePrice = ethers.utils.formatEther(
        await ixfgToken.calculateTargetPrice(newXfgPrice)
    );
    console.log("Expected IXFG Price:", expectedInversePrice);

    console.log("\n🎯 Inverse Correlation Active!");
    console.log("XFG +20% → IXFG should decrease proportionally");
    console.log("Treasury can fine-tune correlation through supply adjustments");

    return deployments;
}

/**
 * Get network name
 */
async function getNetworkName() {
    const network = await ethers.provider.getNetwork();
    return network.name === "unknown" ? `chainId-${network.chainId}` : network.name;
}

/**
 * Ensure directory exists
 */
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Handle deployment errors
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });

module.exports = { main }; 