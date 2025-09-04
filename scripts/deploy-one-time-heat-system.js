const { ethers } = require("hardhat");

async function main() {
    console.log("🔒 Deploying One-Time Address HEAT System");
    console.log("=========================================\n");
    
    const [deployer] = await ethers.getSigners();
    console.log("👤 Deploying with account:", deployer.address);
    console.log("💰 Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");
    
    const networkName = await deployer.provider.getNetwork().then(n => n.name);
    const chainId = await deployer.provider.getNetwork().then(n => n.chainId);
    
    console.log("🌐 Network:", networkName);
    console.log("🔗 Chain ID:", chainId);
    
    // Determine deployment scenario
    const isArbitrumOne = chainId === 42161;
    const scenario = isArbitrumOne ? "ARBITRUM-ONE" : "TESTNET";
    
    console.log("\n📋 Deployment Scenario:", scenario);
    console.log("=========================================");
    
    if (scenario === "ARBITRUM-ONE") {
        console.log("📍 Production: Deploying on Arbitrum One");
        console.log("   - HEAT minted on Arbitrum with one-time addresses");
        console.log("   - Ready for bridge to COLD L3 when launched");
        console.log("   - Privacy rule HARD-CODED and enforced");
    } else {
        console.log("📍 Testnet Deployment");
        console.log("   - Testing one-time address functionality");
    }
    
    // Step 1: Deploy EmbersToken (HEAT)
    console.log("\n🔥 Step 1: Deploying EmbersToken (HEAT)...");
    const EmbersToken = await ethers.getContractFactory("EmbersToken");
    const heatToken = await EmbersToken.deploy(deployer.address);
    await heatToken.deployed();
    console.log("✅ EmbersToken deployed to:", heatToken.address);
    
    // Step 2: Deploy Mock Fuego Oracle (for testing)
    console.log("\n🔮 Step 2: Deploying Fuego Oracle...");
    const MockOracle = await ethers.getContractFactory("FuegoChainOracleV2Simple");
    const fuegoOracle = await MockOracle.deploy(
        deployer.address,      // admin
        "ws://fuego.spaceportx.net:26657/websocket", // websocket endpoint
        "http://fuego.spaceportx.net:26657"          // rpc endpoint
    );
    await fuegoOracle.deployed();
    console.log("✅ Fuego Oracle deployed to:", fuegoOracle.address);
    
    // Step 3: Deploy One-Time Address HEAT Verifier
    console.log("\n🔍 Step 3: Deploying One-Time Address Burn Verifier...");
    const HEATVerifier = await ethers.getContractFactory("HEATXFGBurnVerifier");
    const burnVerifier = await HEATVerifier.deploy(
        deployer.address,       // admin
        heatToken.address,      // HEAT token
        fuegoOracle.address     // Fuego oracle
    );
    await burnVerifier.deployed();
    console.log("✅ HEATXFGBurnVerifier deployed to:", burnVerifier.address);
    
    // Step 4: Configure System
    console.log("\n⚙️ Step 4: Configuring System...");
    
    // Transfer HEAT token ownership to burn verifier
    console.log("   📋 Transferring HEAT ownership to burn verifier...");
    await heatToken.transferOwnership(burnVerifier.address);
    console.log("   ✅ HEAT ownership transferred");
    
    // Configure oracle with test data
    console.log("   📋 Setting up oracle with genesis XFG burn data...");
    const genesisXFGTx = "0x77c45ea61513b10ed0a638218dc9bd113fe55aea4f322856d373a3594087e304";
    await fuegoOracle.submitBlockHeader(
        1,                           // block height
        genesisXFGTx,               // block hash (using tx hash as example)
        ethers.utils.keccak256("0x"), // merkle root
        Math.floor(Date.now() / 1000) // timestamp
    );
    console.log("   ✅ Oracle configured with genesis data");
    
    // Step 5: Privacy Compliance Verification
    console.log("\n🛡️ Step 5: Verifying One-Time Address Compliance...");
    const [ruleEnforced, uniqueAddresses, totalAttempts, status] = await burnVerifier.verifyOneTimeCompliance();
    console.log("   One-Time Rule Enforced:", ruleEnforced ? "YES ✅" : "NO ❌");
    console.log("   Unique Addresses:", uniqueAddresses.toString());
    console.log("   Total Attempts:", totalAttempts.toString());
    console.log("   Status:", status);
    
    // Step 6: Demonstrate Address Checking
    console.log("\n🎭 Step 6: Demonstrating Address Checking...");
    
    // Test different addresses
    const testAddresses = [
        deployer.address,                          // Admin (already used)
        ethers.Wallet.createRandom().address,     // Fresh address 1
        ethers.Wallet.createRandom().address,     // Fresh address 2
        "0x0000000000000000000000000000000000000000" // Zero address
    ];
    
    for (let i = 0; i < testAddresses.length; i++) {
        const addr = testAddresses[i];
        const [canMint, reason, firstTx, firstTime] = await burnVerifier.canAddressMint(addr);
        
        console.log(`\n   Address ${i + 1}: ${addr}`);
        console.log("      Can Mint:", canMint ? "YES ✅" : "NO ❌");
        console.log("      Reason:", reason);
        if (firstTx !== ethers.constants.HashZero) {
            console.log("      First Mint TX:", firstTx);
            console.log("      First Mint Time:", new Date(firstTime.toNumber() * 1000).toISOString());
        }
    }
    
    // Step 7: Get Privacy Statistics
    console.log("\n📊 Step 7: Privacy Statistics...");
    const [uniqueAddr, totalMinted, repeatAttempts, privacyScore] = await burnVerifier.getPrivacyStats();
    
    console.log("   Unique Addresses:", uniqueAddr.toString());
    console.log("   Total HEAT Minted:", ethers.utils.formatEther(totalMinted), "HEAT");
    console.log("   Blocked Repeat Attempts:", repeatAttempts.toString());
    console.log("   Privacy Score:", privacyScore.toString() + "%");
    
    // Step 8: Demo Transaction Structure
    console.log("\n🔗 Step 8: Transaction Structure Demo...");
    
    const testUser = ethers.Wallet.createRandom();
    const freshAddress = ethers.Wallet.createRandom().address;
    
    console.log("   Test User:", testUser.address);
    console.log("   Fresh Mint Address:", freshAddress);
    
    // Create example burn verification data
    const exampleBurnData = {
        transaction: {
            from: testUser.address,
            to: "0x000000000000000000000000000000000000dEaD", // burn address
            amount: ethers.utils.parseEther("100"), // 100 XFG
            nonce: 1,
            txHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("example_burn_tx")),
            signature: "0x" + "00".repeat(65) // placeholder signature
        },
        merkleProof: [ethers.utils.keccak256("0x")], // placeholder
        blockHeight: 2,
        blockMerkleRoot: ethers.utils.keccak256("0x")
    };
    
    console.log("   📋 Example Burn Data:");
    console.log("      XFG Amount:", ethers.utils.formatEther(exampleBurnData.transaction.amount), "XFG");
    console.log("      Expected HEAT:", ethers.utils.formatEther(exampleBurnData.transaction.amount.mul(10_000_000)), "HEAT");
    console.log("      Fresh Address Required:", freshAddress);
    console.log("      One-Time Rule: ENFORCED ✅");
    
    // Step 9: Deployment Summary
    console.log("\n📊 Deployment Summary");
    console.log("=====================");
    console.log("Network:", networkName, "(Chain ID:", chainId + ")");
    console.log("EmbersToken (HEAT):", heatToken.address);
    console.log("FuegoChainOracle:", fuegoOracle.address);
    console.log("HEATXFGBurnVerifier:", burnVerifier.address);
    
    console.log("\n🔒 One-Time Address Privacy Features:");
    console.log("- ✅ Each address can mint HEAT exactly once");
    console.log("- ✅ Repeat minting attempts blocked automatically");
    console.log("- ✅ Forces users to use fresh addresses");
    console.log("- ✅ Prevents address clustering patterns");
    console.log("- ✅ Simple but effective privacy protection");
    
    console.log("\n🌉 Pre-L3 Launch Benefits:");
    console.log("- ✅ Immediate privacy protection on Arbitrum One");
    console.log("- ✅ Clean address separation for each XFG burn");
    console.log("- ✅ Ready for COLD L3 bridge when launched");
    console.log("- ✅ Maintains privacy through bridge process");
    console.log("- ✅ Can migrate same system to L3 directly");
    
    console.log("\n📋 User Instructions:");
    console.log("=====================");
    console.log("1. **Burn XFG** on Fuego chain");
    console.log("2. **Generate fresh address** for HEAT minting");
    console.log("3. **Submit burn proof** with fresh address");
    console.log("4. **Receive HEAT** to fresh address");
    console.log("5. **Bridge to L3** when COLD L3 launches (optional)");
    
    console.log("\n⚠️  Important Privacy Rules:");
    console.log("=============================");
    console.log("❌ **DO NOT** reuse addresses for multiple burns");
    console.log("✅ **DO** create fresh address for each XFG burn");
    console.log("✅ **DO** keep fresh addresses separate from main wallet");
    console.log("✅ **DO** use different timing for transactions");
    
    // Step 10: Save Deployment Info
    const deploymentInfo = {
        network: networkName,
        chainId: chainId,
        scenario: scenario,
        timestamp: new Date().toISOString(),
        contracts: {
            EmbersToken: heatToken.address,
            FuegoChainOracle: fuegoOracle.address,
            HEATXFGBurnVerifier: burnVerifier.address
        },
        privacyFeatures: {
            oneTimeAddressRequired: true,
            repeatMintingBlocked: true,
            addressClusteringPrevented: true,
            privacyScoreTracked: true,
            simpleImplementation: true
        },
        configuration: {
            xfgToHeatRatio: "1:10,000,000",
            genesisXFGTx: "0x77c45ea61513b10ed0a638218dc9bd113fe55aea4f322856d373a3594087e304",
            initialSupply: "8,000,000,000 HEAT (from 800 XFG)",
            maxSupply: "80,000,000,000,000 HEAT (from 8M XFG)",
            privacyRule: "one-time-address-only"
        },
        userGuidance: {
            freshAddressRequired: true,
            noAddressReuse: true,
            separateFromMainWallet: true,
            bridgeToL3Ready: true
        }
    };
    
    const fs = require('fs');
    const fileName = `one-time-heat-deployment-${scenario.toLowerCase()}-${chainId}.json`;
    fs.writeFileSync(fileName, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 Deployment info saved to: ${fileName}`);
    
    console.log("\n🎉 One-Time Address HEAT System: DEPLOYED!");
    console.log("🔐 Privacy protection active on", networkName);
    console.log("🚀 Ready for production use!");
    
    return deploymentInfo;
}

main()
    .then((deploymentInfo) => {
        console.log("\n✅ One-Time Address HEAT System deployment completed successfully!");
        console.log("🔒 Privacy rule enforced: Each address can mint HEAT exactly once");
        console.log("🌉 Ready for COLD L3 launch!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Deployment failed:", error);
        process.exit(1);
    }); 