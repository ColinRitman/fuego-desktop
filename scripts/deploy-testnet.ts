import { ethers } from "hardhat";
import { Contract } from "ethers";

interface DeployedContracts {
  embersToken: Contract;
  heatToken: Contract;
  coldToken: Contract;
  celestiaVerifier: Contract;
  coldInverseProtocol: Contract;
  coldAMM: Contract;
  heatTokenL3: Contract;
  coldL3Settlement: Contract;
  coldPrivacyEngine: Contract;
}

async function main() {
  console.log("🚀 Starting COLD Protocol Testnet Deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  const deployedContracts: Partial<DeployedContracts> = {};

  try {
    // 1. Deploy Celestia Verifier Mock
    console.log("📡 Deploying CelestiaVerifierMock...");
    const CelestiaVerifier = await ethers.getContractFactory("CelestiaVerifierMock");
    deployedContracts.celestiaVerifier = await CelestiaVerifier.deploy();
    await deployedContracts.celestiaVerifier.deployed();
    console.log("✅ CelestiaVerifierMock deployed to:", deployedContracts.celestiaVerifier.address);

    // 2. Deploy Embers Token (with Unicode Ξmbers name!)
    console.log("\n🔥 Deploying EmbersToken (Ξmbers)...");
    const EmbersToken = await ethers.getContractFactory("EmbersToken");
    deployedContracts.embersToken = await EmbersToken.deploy(deployer.address);
    await deployedContracts.embersToken.deployed();
    console.log("✅ EmbersToken (Ξmbers) deployed to:", deployedContracts.embersToken.address);

    // 3. Deploy HEAT Token
    console.log("\n🔥 Deploying HEATToken...");
    const HEATToken = await ethers.getContractFactory("HEATToken");
    deployedContracts.heatToken = await HEATToken.deploy(deployer.address);
    await deployedContracts.heatToken.deployed();
    console.log("✅ HEATToken deployed to:", deployedContracts.heatToken.address);

    // 4. Deploy COLD Token
    console.log("\n❄️ Deploying COLDToken...");
    const COLDToken = await ethers.getContractFactory("COLDToken");
    deployedContracts.coldToken = await COLDToken.deploy(deployer.address);
    await deployedContracts.coldToken.deployed();
    console.log("✅ COLDToken deployed to:", deployedContracts.coldToken.address);

    // 5. Deploy COLD Inverse Protocol
    console.log("\n🔄 Deploying COLDInverseProtocol...");
    const COLDInverseProtocol = await ethers.getContractFactory("COLDInverseProtocol");
    deployedContracts.coldInverseProtocol = await COLDInverseProtocol.deploy(
      deployer.address, // initialOwner
      deployedContracts.coldToken.address,
      "0x0000000000000000000000000000000000000000", // XFG token placeholder
      deployedContracts.heatToken.address,
      deployer.address // treasury
    );
    await deployedContracts.coldInverseProtocol.deployed();
    console.log("✅ COLDInverseProtocol deployed to:", deployedContracts.coldInverseProtocol.address);

    // 6. Deploy COLD AMM
    console.log("\n🌊 Deploying COLDAMMInverse...");
    const COLDAMMinverse = await ethers.getContractFactory("COLDAMMInverse");
    deployedContracts.coldAMM = await COLDAMMinverse.deploy(
      deployer.address, // initialOwner
      deployedContracts.coldToken.address,
      "0x0000000000000000000000000000000000000000", // XFG token placeholder
      deployedContracts.heatToken.address,
      deployedContracts.coldInverseProtocol.address
    );
    await deployedContracts.coldAMM.deployed();
    console.log("✅ COLDAMMInverse deployed to:", deployedContracts.coldAMM.address);

    // 7. Deploy HEAT Token L3
    console.log("\n🔥 Deploying HeatTokenL3...");
    const HeatTokenL3 = await ethers.getContractFactory("HeatTokenL3");
    deployedContracts.heatTokenL3 = await HeatTokenL3.deploy(
      "0x0000000000000000000000000000000000000000", // burn verifier placeholder
      deployer.address // initial owner
    );
    await deployedContracts.heatTokenL3.deployed();
    console.log("✅ HeatTokenL3 deployed to:", deployedContracts.heatTokenL3.address);

    // 8. Deploy COLD L3 Settlement
    console.log("\n🌐 Deploying COLDL3Settlement...");
    const COLDL3Settlement = await ethers.getContractFactory("COLDL3Settlement");
    const celestiaNamespace = "0x434f4c4400000000000000000000000000000000000000000000000000000000";
    deployedContracts.coldL3Settlement = await COLDL3Settlement.deploy(
      deployer.address, // initialOwner
      deployedContracts.heatToken.address, // HEAT token on Arbitrum
      celestiaNamespace,
      deployedContracts.celestiaVerifier.address
    );
    await deployedContracts.coldL3Settlement.deployed();
    console.log("✅ COLDL3Settlement deployed to:", deployedContracts.coldL3Settlement.address);

    // 9. Deploy COLD Privacy Engine
    console.log("\n🔐 Deploying COLDPrivacyEngine...");
    const COLDPrivacyEngine = await ethers.getContractFactory("COLDPrivacyEngine");
    deployedContracts.coldPrivacyEngine = await COLDPrivacyEngine.deploy(
      deployedContracts.heatTokenL3.address,
      deployedContracts.coldToken.address
    );
    await deployedContracts.coldPrivacyEngine.deployed();
    console.log("✅ COLDPrivacyEngine deployed to:", deployedContracts.coldPrivacyEngine.address);

    // Print deployment summary
    console.log("\n🎉 COLD Protocol Deployment Complete!");
    console.log("==========================================");
    console.log("Network:", await ethers.provider.getNetwork());
    console.log("\n📄 Contract Addresses:");
    console.log("CelestiaVerifierMock:", deployedContracts.celestiaVerifier?.address);
    console.log("EmbersToken (Ξmbers):", deployedContracts.embersToken?.address);
    console.log("HEATToken:", deployedContracts.heatToken?.address);
    console.log("COLDToken:", deployedContracts.coldToken?.address);
    console.log("COLDInverseProtocol:", deployedContracts.coldInverseProtocol?.address);
    console.log("COLDAMMInverse:", deployedContracts.coldAMM?.address);
    console.log("HeatTokenL3:", deployedContracts.heatTokenL3?.address);
    console.log("COLDL3Settlement:", deployedContracts.coldL3Settlement?.address);
    console.log("COLDPrivacyEngine:", deployedContracts.coldPrivacyEngine?.address);

    // Save deployment info
    const deploymentInfo = {
      network: await ethers.provider.getNetwork(),
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: {
        CelestiaVerifierMock: deployedContracts.celestiaVerifier?.address,
        EmbersToken: deployedContracts.embersToken?.address,
        HEATToken: deployedContracts.heatToken?.address,
        COLDToken: deployedContracts.coldToken?.address,
        COLDInverseProtocol: deployedContracts.coldInverseProtocol?.address,
        COLDAMMInverse: deployedContracts.coldAMM?.address,
        HeatTokenL3: deployedContracts.heatTokenL3?.address,
        COLDL3Settlement: deployedContracts.coldL3Settlement?.address,
        COLDPrivacyEngine: deployedContracts.coldPrivacyEngine?.address,
      }
    };

    console.log("\n💾 Deployment info saved to deployments.json");
    
    const fs = require('fs');
    fs.writeFileSync('deployments.json', JSON.stringify(deploymentInfo, null, 2));

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 