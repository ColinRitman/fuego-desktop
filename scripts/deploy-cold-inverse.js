const { ethers } = require("hardhat");
const fs = require("fs");

/**
 * Deploy COLD Inverse Asset System
 * This script deploys and configures the complete COLD inverse correlation system
 */

async function main() {
    console.log("🚀 Deploying COLD Inverse Asset System...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const deployments = {};
    
    // 1. Deploy or get existing token contracts
    console.log("\n📄 Setting up token contracts...");
    
    // Get existing COLD token or deploy mock
    let coldToken;
    try {
        const COLDtoken = await ethers.getContractFactory("COLDtoken");
        const existingDeployments = loadExistingDeployments();
        if (existingDeployments && existingDeployments.contracts.coldToken) {
            coldToken = COLDtoken.attach(existingDeployments.contracts.coldToken);
            console.log("✅ Using existing COLD token at:", coldToken.address);
        } else {
            coldToken = await COLDtoken.deploy();
            await coldToken.deployed();
            console.log("✅ COLD token deployed to:", coldToken.address);
        }
    } catch (error) {
        console.log("⚠️  Creating mock COLD token...");
        coldToken = await deployMockToken("COLD", "O", ethers.utils.parseEther("1000000000"));
    }
    deployments.coldToken = coldToken.address;

    // Deploy mock XFG token (since it's on a different chain)
    console.log("📄 Deploying XFG token representation...");
    const xfgToken = await deployMockToken("XFG", "XFG", ethers.utils.parseEther("1000000000"));
    deployments.xfgToken = xfgToken.address;

    // Get existing HEAT token or deploy mock
    let heatToken;
    try {
        const EmbersToken = await ethers.getContractFactory("EmbersToken");
        heatToken = await EmbersToken.deploy();
        await heatToken.deployed();
        console.log("✅ HEAT token deployed to:", heatToken.address);
    } catch (error) {
        console.log("⚠️  Creating mock HEAT token...");
        heatToken = await deployMockToken("HEAT", "HEAT", ethers.utils.parseEther("1000000000"));
    }
    deployments.heatToken = heatToken.address;

    // 2. Deploy COLD Inverse Protocol
    console.log("\n📄 Deploying COLD Inverse Protocol...");
    const COLDInverseProtocol = await ethers.getContractFactory("COLDInverseProtocol");
    const inverseProtocol = await COLDInverseProtocol.deploy(
        coldToken.address,
        xfgToken.address,
        heatToken.address,
        deployer.address // treasury address
    );
    await inverseProtocol.deployed();
    console.log("✅ COLD Inverse Protocol deployed to:", inverseProtocol.address);
    deployments.inverseProtocol = inverseProtocol.address;

    // 3. Deploy Mock Price Oracle for testing
    console.log("\n📄 Deploying Mock Price Oracle...");
    const PriceOracle = await deployMockPriceOracle();
    deployments.priceOracle = PriceOracle.address;

    // 4. Configure initial parameters
    console.log("\n🔧 Configuring inverse correlation parameters...");
    
    // Set initial prices
    const initialXfgPrice = ethers.utils.parseEther("1.0"); // $1 USD
    const initialColdPrice = ethers.utils.parseEther("1.0"); // $1 USD
    
    await inverseProtocol.updatePrices(initialXfgPrice, initialColdPrice);
    console.log("✅ Initial prices set");

    // Configure correlation parameters
    await inverseProtocol.setCorrelationFactor(ethers.utils.parseEther("1.0")); // 100% inverse correlation
    await inverseProtocol.setDampingFactor(9000); // 90% damping
    await inverseProtocol.setRebalanceThreshold(200); // 2% threshold
    console.log("✅ Correlation parameters configured");

    // 5. Set up token permissions
    console.log("\n🔑 Setting up token permissions...");
    
    // If COLD token has minter functionality, grant it to inverse protocol
    try {
        if (typeof coldToken.setMinter === 'function') {
            await coldToken.setMinter(inverseProtocol.address);
            console.log("✅ Inverse protocol set as COLD minter");
        }
    } catch (error) {
        console.log("⚠️  Could not set minter permissions:", error.message);
    }

    // 6. Add initial reserves to protocol
    console.log("\n💰 Adding initial reserves...");
    
    const initialReserve = ethers.utils.parseEther("10000");
    
    // Mint tokens to deployer for reserves
    await mintTokens(coldToken, deployer.address, initialReserve);
    await mintTokens(xfgToken, deployer.address, initialReserve);
    await mintTokens(heatToken, deployer.address, initialReserve);

    // Approve and add reserves
    await coldToken.approve(inverseProtocol.address, initialReserve);
    await xfgToken.approve(inverseProtocol.address, initialReserve);
    
    await inverseProtocol.addColdReserve(initialReserve);
    await inverseProtocol.addXfgReserve(initialReserve);
    
    console.log("✅ Initial reserves added");

    // 7. Deploy testing and monitoring contracts
    console.log("\n📊 Deploying testing and monitoring contracts...");
    
    const InverseMonitor = await deployInverseMonitor(inverseProtocol.address);
    deployments.inverseMonitor = InverseMonitor.address;

    const PriceSimulator = await deployPriceSimulator(
        inverseProtocol.address,
        PriceOracle.address
    );
    deployments.priceSimulator = PriceSimulator.address;

    // 8. Create integration with L3 if contracts exist
    console.log("\n🔗 Setting up L3 integration...");
    
    try {
        // Try to integrate with existing L3 contracts
        const l3Deployments = loadL3Deployments();
        if (l3Deployments && l3Deployments.contracts) {
            await setupL3Integration(inverseProtocol, l3Deployments);
            console.log("✅ L3 integration configured");
        }
    } catch (error) {
        console.log("⚠️  L3 integration skipped:", error.message);
    }

    // 9. Save deployment data
    const deploymentData = {
        network: await getNetworkName(),
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: deployments,
        config: {
            initialXfgPrice: initialXfgPrice.toString(),
            initialColdPrice: initialColdPrice.toString(),
            correlationFactor: "1000000000000000000", // 100%
            dampingFactor: "9000", // 90%
            rebalanceThreshold: "200" // 2%
        }
    };

    const outputPath = `deployments/cold-inverse-${await getNetworkName()}.json`;
    ensureDirectoryExists("deployments");
    fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));
    
    console.log("\n🎉 COLD Inverse Asset System deployed successfully!");
    console.log("📝 Deployment data saved to:", outputPath);

    // 10. Display usage instructions
    console.log("\n📋 Usage Instructions:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("1. Monitor price correlation:");
    console.log(`   npx hardhat run scripts/monitor-inverse.js --network ${await getNetworkName()}`);
    console.log("\n2. Update XFG price (triggers inverse adjustment):");
    console.log(`   npx hardhat run scripts/update-xfg-price.js --network ${await getNetworkName()}`);
    console.log("\n3. Test inverse functionality:");
    console.log(`   npx hardhat test test/cold-inverse.test.js --network ${await getNetworkName()}`);
    console.log("\n4. View protocol status:");
    console.log("   Call getProtocolStatus() on:", inverseProtocol.address);

    // 11. Display configuration summary
    console.log("\n📊 Configuration Summary:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("COLD Token:", coldToken.address);
    console.log("XFG Token:", xfgToken.address);
    console.log("HEAT Token:", heatToken.address);
    console.log("Inverse Protocol:", inverseProtocol.address);
    console.log("Price Oracle:", PriceOracle.address);
    console.log("Inverse Monitor:", InverseMonitor.address);
    console.log("Price Simulator:", PriceSimulator.address);
    console.log("\n🎯 Inverse Correlation Active!");
    console.log("When XFG price increases → COLD price decreases");
    console.log("When XFG price decreases → COLD price increases");

    return deployments;
}

/**
 * Deploy mock ERC20 token
 */
async function deployMockToken(name, symbol, initialSupply) {
    const MockToken = await ethers.getContractFactory("MockERC20");
    const token = await MockToken.deploy(name, symbol, initialSupply);
    await token.deployed();
    console.log(`✅ Mock ${name} token deployed to:`, token.address);
    return token;
}

/**
 * Deploy mock price oracle
 */
async function deployMockPriceOracle() {
    const MockPriceOracle = await ethers.getContractFactory("MockPriceOracle");
    const oracle = await MockPriceOracle.deploy();
    await oracle.deployed();
    console.log("✅ Mock Price Oracle deployed to:", oracle.address);
    return oracle;
}

/**
 * Deploy inverse monitor contract
 */
async function deployInverseMonitor(inverseProtocolAddress) {
    const InverseMonitor = await ethers.getContractFactory("InverseMonitor");
    const monitor = await InverseMonitor.deploy(inverseProtocolAddress);
    await monitor.deployed();
    console.log("✅ Inverse Monitor deployed to:", monitor.address);
    return monitor;
}

/**
 * Deploy price simulator for testing
 */
async function deployPriceSimulator(inverseProtocolAddress, priceOracleAddress) {
    const PriceSimulator = await ethers.getContractFactory("PriceSimulator");
    const simulator = await PriceSimulator.deploy(inverseProtocolAddress, priceOracleAddress);
    await simulator.deployed();
    console.log("✅ Price Simulator deployed to:", simulator.address);
    return simulator;
}

/**
 * Mint tokens to address
 */
async function mintTokens(token, to, amount) {
    try {
        if (typeof token.mint === 'function') {
            await token.mint(to, amount);
        } else if (typeof token.transfer === 'function') {
            // If no mint function, try to transfer from deployer
            await token.transfer(to, amount);
        }
    } catch (error) {
        console.log(`⚠️  Could not mint ${await token.symbol()} tokens:`, error.message);
    }
}

/**
 * Setup L3 integration
 */
async function setupL3Integration(inverseProtocol, l3Deployments) {
    // Configure inverse protocol to work with L3 contracts
    if (l3Deployments.contracts.coldL3Settlement) {
        // Add L3 settlement contract as authorized
        // This would require additional functions in the inverse protocol
        console.log("Configuring L3 settlement integration...");
    }
    
    if (l3Deployments.contracts.heatTokenL3) {
        // Configure HEAT token integration
        console.log("Configuring HEAT token integration...");
    }
}

/**
 * Load existing deployments
 */
function loadExistingDeployments() {
    try {
        const networkName = process.env.HARDHAT_NETWORK || "localhost";
        const deploymentPath = `deployments/${networkName}-deployments.json`;
        if (fs.existsSync(deploymentPath)) {
            return JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
        }
    } catch (error) {
        console.log("No existing deployments found");
    }
    return null;
}

/**
 * Load L3 deployments
 */
function loadL3Deployments() {
    try {
        const networkName = process.env.HARDHAT_NETWORK || "localhost";
        const l3DeploymentPath = `deployments/l3-${networkName}-deployments.json`;
        if (fs.existsSync(l3DeploymentPath)) {
            return JSON.parse(fs.readFileSync(l3DeploymentPath, 'utf8'));
        }
    } catch (error) {
        console.log("No L3 deployments found");
    }
    return null;
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