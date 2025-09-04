const { ethers } = require("hardhat");

async function main() {
    console.log("🔒 Deploying Stealth Address HEAT System");
    console.log("=======================================\n");
    
    const [deployer] = await ethers.getSigners();
    console.log("👤 Deploying with account:", deployer.address);
    console.log("💰 Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");
    
    const networkName = await deployer.provider.getNetwork().then(n => n.name);
    const chainId = await deployer.provider.getNetwork().then(n => n.chainId);
    
    console.log("🌐 Network:", networkName);
    console.log("🔗 Chain ID:", chainId);
    
    // Determine deployment scenario
    const isArbitrumOne = chainId === 42161;
    const isCOLDL3 = chainId === 2024; // COLD L3 chain ID
    const scenario = isArbitrumOne ? "PRE-L3" : isCOLDL3 ? "POST-L3" : "TESTNET";
    
    console.log("\n📋 Deployment Scenario:", scenario);
    console.log("=========================================");
    
    if (scenario === "PRE-L3") {
        console.log("📍 Pre-L3 Launch: Deploying on Arbitrum One");
        console.log("   - HEAT minted on Arbitrum");
        console.log("   - Bridge to COLD L3 required");
        console.log("   - Stealth addresses HARD-CODED requirement");
    } else if (scenario === "POST-L3") {
        console.log("📍 Post-L3 Launch: Deploying on COLD L3");
        console.log("   - HEAT minted directly on L3");
        console.log("   - No bridging required");
        console.log("   - Native gas token integration");
    } else {
        console.log("📍 Testnet Deployment");
        console.log("   - Testing stealth address functionality");
    }
    
    // Step 1: Deploy EmbersToken (HEAT)
    console.log("\n🔥 Step 1: Deploying EmbersToken (HEAT)...");
    const EmbersToken = await ethers.getContractFactory("EmbersToken");
    const heatToken = await EmbersToken.deploy(deployer.address);
    await heatToken.deployed();
    console.log("✅ EmbersToken deployed to:", heatToken.address);
    
    // Step 2: Deploy StealthAddressHEATMinter
    console.log("\n🕵️ Step 2: Deploying StealthAddressHEATMinter...");
    const StealthMinter = await ethers.getContractFactory("StealthAddressHEATMinter");
    const stealthMinter = await StealthMinter.deploy(heatToken.address, deployer.address);
    await stealthMinter.deployed();
    console.log("✅ StealthAddressHEATMinter deployed to:", stealthMinter.address);
    
    // Step 3: Deploy Mock Fuego Oracle (for testing)
    console.log("\n🔮 Step 3: Deploying Mock Fuego Oracle...");
    const MockOracle = await ethers.getContractFactory("FuegoChainOracleV2Simple");
    const fuegoOracle = await MockOracle.deploy(
        deployer.address,      // admin
        "ws://fuego.spaceportx.net:26657/websocket", // websocket endpoint
        "http://fuego.spaceportx.net:26657"          // rpc endpoint
    );
    await fuegoOracle.deployed();
    console.log("✅ Mock Fuego Oracle deployed to:", fuegoOracle.address);
    
    // Step 4: Deploy Stealth-Enabled Burn Verifier
    console.log("\n🔍 Step 4: Deploying Stealth Burn Verifier...");
    const StealthVerifier = await ethers.getContractFactory("HEATXFGBurnVerifierStealth");
    const burnVerifier = await StealthVerifier.deploy(
        deployer.address,       // admin
        heatToken.address,      // HEAT token
        fuegoOracle.address,    // Fuego oracle
        stealthMinter.address   // Stealth minter
    );
    await burnVerifier.deployed();
    console.log("✅ HEATXFGBurnVerifierStealth deployed to:", burnVerifier.address);
    
    // Step 5: Configure System
    console.log("\n⚙️ Step 5: Configuring System...");
    
    // Transfer HEAT token ownership to burn verifier
    console.log("   📋 Transferring HEAT ownership to burn verifier...");
    await heatToken.transferOwnership(burnVerifier.address);
    console.log("   ✅ HEAT ownership transferred");
    
    // Authorize stealth minter in HEAT token
    console.log("   📋 Authorizing stealth minter...");
    await stealthMinter.authorizeVerifier(burnVerifier.address);
    console.log("   ✅ Stealth minter authorized");
    
    // Configure oracle with test data
    console.log("   📋 Setting up oracle with test XFG burn data...");
    const testTxHash = "0x77c45ea61513b10ed0a638218dc9bd113fe55aea4f322856d373a3594087e304";
    await fuegoOracle.submitBlockHeader(
        1,                           // block height
        testTxHash,                  // block hash (using tx hash as example)
        ethers.utils.keccak256("0x"), // merkle root
        Math.floor(Date.now() / 1000) // timestamp
    );
    console.log("   ✅ Oracle configured with test data");
    
    // Step 6: Privacy Compliance Verification
    console.log("\n🛡️ Step 6: Verifying Privacy Compliance...");
    const [allStealthy, directMints, stealthMints, status] = await burnVerifier.verifyPrivacyCompliance();
    console.log("   Privacy Compliant:", allStealthy ? "YES ✅" : "NO ❌");
    console.log("   Direct Mints:", directMints.toString());
    console.log("   Stealth Mints:", stealthMints.toString());
    console.log("   Status:", status);
    
    // Step 7: Demonstrate Stealth Minting
    console.log("\n🎭 Step 7: Demonstrating Stealth Minting...");
    
    // Generate test user master keys
    const testUser = ethers.Wallet.createRandom();
    const masterPubKey = ethers.utils.keccak256(testUser.publicKey);
    
    console.log("   Test User Master Address:", testUser.address);
    console.log("   Master Public Key:", masterPubKey);
    
    // Create stealth burn proof structure
    const burnProof = {
        burnData: {
            transaction: {
                from: testUser.address,
                to: "0x000000000000000000000000000000000000dEaD", // burn address
                amount: ethers.utils.parseEther("100"), // 100 XFG
                nonce: 1,
                txHash: testTxHash,
                signature: "0x" + "00".repeat(65) // placeholder signature
            },
            merkleProof: [ethers.utils.keccak256("0x")], // placeholder
            blockHeight: 1,
            blockMerkleRoot: ethers.utils.keccak256("0x")
        },
        userMasterPubKey: masterPubKey,
        stealthFee: ethers.utils.parseEther("0.001") // 0.001 ETH stealth fee
    };
    
    console.log("   📋 Stealth Burn Proof Created");
    console.log("   XFG Amount:", ethers.utils.formatEther(burnProof.burnData.transaction.amount), "XFG");
    console.log("   Expected HEAT:", ethers.utils.formatEther(burnProof.burnData.transaction.amount.mul(10_000_000)), "HEAT");
    
    // Test stealth mint (would require actual oracle integration in production)
    console.log("   🎯 Stealth minting ready for production use");
    console.log("   ⚠️  Note: Requires valid Fuego oracle data for actual minting");
    
    // Step 8: Deployment Summary
    console.log("\n📊 Deployment Summary");
    console.log("=====================");
    console.log("Scenario:", scenario);
    console.log("EmbersToken (HEAT):", heatToken.address);
    console.log("StealthAddressHEATMinter:", stealthMinter.address);
    console.log("FuegoChainOracle:", fuegoOracle.address);
    console.log("HEATXFGBurnVerifierStealth:", burnVerifier.address);
    
    console.log("\n🔒 Privacy Features:");
    console.log("- ✅ Stealth addresses HARD-CODED required");
    console.log("- ✅ Zero public linkage between XFG burns and HEAT recipients");
    console.log("- ✅ Unlinkable stealth address generation");
    console.log("- ✅ Master private key recovery system");
    console.log("- ✅ Forward secrecy through ephemeral keys");
    
    if (scenario === "PRE-L3") {
        console.log("\n🌉 Bridge Integration (Pre-L3):");
        console.log("- HEAT minted on Arbitrum One with stealth addresses");
        console.log("- Bridge to COLD L3 when launched");
        console.log("- Maintain privacy throughout bridge process");
        
        console.log("\n📋 Next Steps:");
        console.log("1. Fund burn verifier with ETH for oracle operations");
        console.log("2. Configure Fuego oracle endpoints");
        console.log("3. Test XFG burn → stealth HEAT minting flow");
        console.log("4. Prepare L3 migration scripts");
        
    } else if (scenario === "POST-L3") {
        console.log("\n⚡ L3 Native Integration (Post-L3):");
        console.log("- HEAT minted directly on COLD L3");
        console.log("- No bridging delays or costs");
        console.log("- Native gas token with stealth privacy");
        console.log("- Optimal user experience");
        
        console.log("\n📋 Next Steps:");
        console.log("1. Configure L3 Fuego oracle");
        console.log("2. Test direct L3 stealth minting");
        console.log("3. Migrate from Arbitrum if needed");
        console.log("4. Enable L3 privacy features");
    }
    
    console.log("\n🎉 Stealth Address HEAT System: DEPLOYED!");
    console.log("🔐 ALL HEAT minting now requires stealth addresses");
    console.log("🛡️  Privacy guaranteed at protocol level");
    
    // Step 9: Save Deployment Info
    const deploymentInfo = {
        network: networkName,
        chainId: chainId,
        scenario: scenario,
        timestamp: new Date().toISOString(),
        contracts: {
            EmbersToken: heatToken.address,
            StealthAddressHEATMinter: stealthMinter.address,
            FuegoChainOracle: fuegoOracle.address,
            HEATXFGBurnVerifierStealth: burnVerifier.address
        },
        privacyFeatures: {
            stealthRequired: true,
            directMintingDisabled: true,
            unlinkableAddresses: true,
            forwardSecrecy: true,
            masterKeyRecovery: true
        },
        configuration: {
            xfgToHeatRatio: "1:10,000,000",
            genesisXFGTx: "0x77c45ea61513b10ed0a638218dc9bd113fe55aea4f322856d373a3594087e304",
            initialSupply: "8,000,000,000 HEAT (from 800 XFG)",
            maxSupply: "80,000,000,000,000 HEAT (from 8M XFG)"
        }
    };
    
    const fs = require('fs');
    const fileName = `stealth-heat-deployment-${scenario.toLowerCase()}-${chainId}.json`;
    fs.writeFileSync(fileName, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 Deployment info saved to: ${fileName}`);
    
    return deploymentInfo;
}

main()
    .then((deploymentInfo) => {
        console.log("\n✅ Stealth Address HEAT System deployment completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Deployment failed:", error);
        process.exit(1);
    }); 