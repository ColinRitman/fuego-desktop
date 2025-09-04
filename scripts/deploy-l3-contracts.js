const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("🚀 Deploying COLD L3 contracts...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());
    
    const deployments = {};
    
    // 1. Deploy HEAT Token L3
    console.log("\n📄 Deploying HeatTokenL3...");
    const HeatTokenL3 = await ethers.getContractFactory("HeatTokenL3");
    const initialSupply = ethers.utils.parseEther("1000000000"); // 1B HEAT
    const initialGasPrice = ethers.utils.parseUnits("20", "gwei"); // 20 gwei
    
    const heatTokenL3 = await HeatTokenL3.deploy(initialSupply, initialGasPrice);
    await heatTokenL3.deployed();
    
    console.log("✅ HeatTokenL3 deployed to:", heatTokenL3.address);
    deployments.heatTokenL3 = heatTokenL3.address;
    
    // 2. Deploy Celestia Verifier (mock for testing)
    console.log("\n📄 Deploying CelestiaVerifier mock...");
    const CelestiaVerifier = await ethers.getContractFactory("CelestiaVerifierMock");
    const celestiaVerifier = await CelestiaVerifier.deploy();
    await celestiaVerifier.deployed();
    
    console.log("✅ CelestiaVerifier deployed to:", celestiaVerifier.address);
    deployments.celestiaVerifier = celestiaVerifier.address;
    
    // 3. Deploy COLD L3 Settlement
    console.log("\n📄 Deploying COLDL3Settlement...");
    const COLDL3Settlement = await ethers.getContractFactory("COLDL3Settlement");
    const celestiaNamespace = "0x000000000000000000000000000000000000000000000000434f4c44"; // "COLD"
    
    const coldL3Settlement = await COLDL3Settlement.deploy(
        heatTokenL3.address,
        celestiaNamespace,
        celestiaVerifier.address
    );
    await coldL3Settlement.deployed();
    
    console.log("✅ COLDL3Settlement deployed to:", coldL3Settlement.address);
    deployments.coldL3Settlement = coldL3Settlement.address;
    
    // 4. Deploy existing COLD contracts if needed
    const existingContracts = await deployExistingContracts();
    Object.assign(deployments, existingContracts);
    
    // 5. Set up contract relationships
    console.log("\n🔗 Setting up contract relationships...");
    
    // Set COLD contracts in HEAT token
    await heatTokenL3.setColdContracts(
        deployments.coldDeposit || ethers.constants.AddressZero,
        deployments.coldWithdrawal || ethers.constants.AddressZero,
        deployments.coldVerifier || ethers.constants.AddressZero
    );
    console.log("✅ COLD contracts set in HeatTokenL3");
    
    // Authorize settlement contract
    await coldL3Settlement.setAuthorized(deployer.address, true);
    console.log("✅ Deployer authorized in settlement contract");
    
    // 6. Save deployment addresses
    const deploymentData = {
        network: await getNetworkName(),
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: deployments,
        config: {
            celestiaNamespace,
            initialSupply: initialSupply.toString(),
            initialGasPrice: initialGasPrice.toString()
        }
    };
    
    fs.writeFileSync(
        `deployments/${await getNetworkName()}-deployments.json`,
        JSON.stringify(deploymentData, null, 2)
    );
    
    console.log("\n🎉 Deployment completed!");
    console.log("📝 Deployment data saved to:", `deployments/${await getNetworkName()}-deployments.json`);
    
    // 7. Verification instructions
    console.log("\n🔍 To verify contracts, run:");
    console.log(`npx hardhat verify --network ${await getNetworkName()} ${heatTokenL3.address} "${initialSupply}" "${initialGasPrice}"`);
    console.log(`npx hardhat verify --network ${await getNetworkName()} ${celestiaVerifier.address}`);
    console.log(`npx hardhat verify --network ${await getNetworkName()} ${coldL3Settlement.address} "${heatTokenL3.address}" "${celestiaNamespace}" "${celestiaVerifier.address}"`);
    
    return deployments;
}

async function deployExistingContracts() {
    console.log("\n📄 Checking for existing COLD contracts...");
    const deployments = {};
    
    try {
        // Try to deploy COLDprotocol if it exists
        const COLDprotocol = await ethers.getContractFactory("COLDprotocol");
        const coldProtocol = await COLDprotocol.deploy();
        await coldProtocol.deployed();
        
        console.log("✅ COLDprotocol deployed to:", coldProtocol.address);
        deployments.coldProtocol = coldProtocol.address;
    } catch (error) {
        console.log("⚠️  COLDprotocol contract not found, skipping...");
    }
    
    try {
        // Try to deploy COLDtoken if it exists
        const COLDtoken = await ethers.getContractFactory("COLDtoken");
        const coldToken = await COLDtoken.deploy();
        await coldToken.deployed();
        
        console.log("✅ COLDtoken deployed to:", coldToken.address);
        deployments.coldToken = coldToken.address;
    } catch (error) {
        console.log("⚠️  COLDtoken contract not found, skipping...");
    }
    
    return deployments;
}

async function getNetworkName() {
    const network = await ethers.provider.getNetwork();
    return network.name === "unknown" ? `chainId-${network.chainId}` : network.name;
}

// Create deployments directory if it doesn't exist
if (!fs.existsSync("deployments")) {
    fs.mkdirSync("deployments");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }); 