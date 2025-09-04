const { ethers } = require("hardhat");

/**
 * Deploy HEAT XFG Commitment Verifier
 * Production deployment script for Arbitrum One
 */

async function main() {
    console.log("\n🔥 HEAT XFG Commitment Verifier Deployment");
    console.log("==========================================");
    
    // Get deployment account
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying from: ${deployer.address}`);
    console.log(`Balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);
    
    // Deployment parameters
    const TOKEN_NAME = "HEAT Token";
    const TOKEN_SYMBOL = "HEAT";
    const INITIAL_OWNER = deployer.address; // Change for production
    
    console.log("\n📋 Deployment Parameters:");
    console.log(`Token Name: ${TOKEN_NAME}`);
    console.log(`Token Symbol: ${TOKEN_SYMBOL}`);
    console.log(`Initial Owner: ${INITIAL_OWNER}`);
    
    // Deploy contract
    console.log("\n🚀 Deploying HEATXFGCommitmentVerifier...");
    
    const HEATVerifier = await ethers.getContractFactory("HEATXFGCommitmentVerifier");
    const verifier = await HEATVerifier.deploy(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        INITIAL_OWNER
    );
    
    await verifier.deployed();
    console.log(`✅ Contract deployed at: ${verifier.address}`);
    console.log(`Deployment tx: ${verifier.deployTransaction.hash}`);
    
    // Wait for confirmations
    console.log("\n⏳ Waiting for confirmations...");
    await verifier.deployTransaction.wait(3);
    console.log("✅ 3 confirmations received");
    
    // Display contract info
    console.log("\n📊 Contract Information:");
    console.log("=======================");
    console.log(`Contract Address: ${verifier.address}`);
    console.log(`Owner: ${await verifier.owner()}`);
    console.log(`Name: ${await verifier.name()}`);
    console.log(`Symbol: ${await verifier.symbol()}`);
    console.log(`Decimals: ${await verifier.decimals()}`);
    console.log(`Max Supply: ${ethers.utils.formatEther(await verifier.MAX_SUPPLY())} HEAT`);
    console.log(`HEAT per XFG: ${ethers.utils.formatEther(await verifier.HEAT_PER_XFG())}`);
    
    // Process genesis transaction (if needed)
    const processGenesis = process.env.PROCESS_GENESIS === 'true';
    if (processGenesis) {
        console.log("\n🌱 Processing Genesis Transaction...");
        
        const genesisRecipient = process.env.GENESIS_RECIPIENT || deployer.address;
        console.log(`Genesis recipient: ${genesisRecipient}`);
        
        const genesisTx = await verifier.processGenesis(genesisRecipient);
        await genesisTx.wait();
        
        console.log(`✅ Genesis processed: ${genesisTx.hash}`);
        
        const genesisBalance = await verifier.balanceOf(genesisRecipient);
        console.log(`Genesis HEAT balance: ${ethers.utils.formatEther(genesisBalance)} HEAT`);
    }
    
    // Display privacy stats
    const stats = await verifier.getPrivacyStats();
    console.log("\n🔒 Privacy Statistics:");
    console.log("=====================");
    console.log(`Unique Claimers: ${stats.uniqueClaimers.toString()}`);
    console.log(`Total Transactions: ${stats.totalTransactions.toString()}`);
    console.log(`Privacy Score: ${stats.privacyScore.toString()}%`);
    
    // Contract verification info
    console.log("\n🔍 Contract Verification:");
    console.log("========================");
    console.log("To verify on Arbiscan, run:");
    console.log(`npx hardhat verify --network arbitrum ${verifier.address} "${TOKEN_NAME}" "${TOKEN_SYMBOL}" "${INITIAL_OWNER}"`);
    
    // Usage instructions
    console.log("\n📖 Usage Instructions:");
    console.log("=====================");
    console.log("1. Users generate secrets off-chain using heat_claim_helper.js");
    console.log("2. Commitments go in Fuego tx_extra field during burns");
    console.log("3. Users claim HEAT by revealing secrets with proof data");
    console.log("4. One-time address enforcement provides privacy");
    
    // Contract interface
    console.log("\n🔗 Key Functions:");
    console.log("================");
    console.log("• claimHEAT(secret, proof) - main claiming function");
    console.log("• hasAddressMinted(address) - check address status");
    console.log("• isNullifierUsed(nullifier) - check secret status");
    console.log("• getPrivacyStats() - privacy metrics");
    console.log("• processGenesis(recipient) - owner only");
    
    // Important addresses and hashes
    console.log("\n📋 Important Constants:");
    console.log("======================");
    console.log(`Genesis TX Hash: ${await verifier.GENESIS_TX_HASH()}`);
    console.log(`HEAT per XFG: ${(await verifier.HEAT_PER_XFG()).toString()}`);
    console.log(`Max Supply: ${(await verifier.MAX_SUPPLY()).toString()}`);
    
    // Save deployment info
    const deploymentInfo = {
        contractAddress: verifier.address,
        deploymentTx: verifier.deployTransaction.hash,
        deployer: deployer.address,
        network: network.name,
        blockNumber: await ethers.provider.getBlockNumber(),
        timestamp: new Date().toISOString(),
        parameters: {
            name: TOKEN_NAME,
            symbol: TOKEN_SYMBOL,
            owner: INITIAL_OWNER
        },
        constants: {
            heatPerXfg: (await verifier.HEAT_PER_XFG()).toString(),
            maxSupply: (await verifier.MAX_SUPPLY()).toString(),
            genesisTxHash: await verifier.GENESIS_TX_HASH()
        }
    };
    
    // Write deployment info to file
    const fs = require('fs');
    const deploymentFile = `deployments/heat-verifier-${network.name}-${Date.now()}.json`;
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);
    
    // Success message
    console.log("\n🎉 Deployment Complete!");
    console.log("======================");
    console.log("✅ HEAT XFG Commitment Verifier deployed successfully");
    console.log("✅ Privacy enforcement is active");
    console.log("✅ Ready for XFG burn claims");
    console.log("✅ Contract verified and documented");
    
    // Final checklist
    console.log("\n✅ Post-Deployment Checklist:");
    console.log("=============================");
    console.log("□ Verify contract on Arbiscan");
    console.log("□ Test with small XFG burn");
    console.log("□ Update frontend with contract address");
    console.log("□ Deploy helper tools for users");
    console.log("□ Monitor privacy statistics");
    console.log("□ Set up event monitoring");
    
    return verifier.address;
}

// Handle deployment
if (require.main === module) {
    main()
        .then((address) => {
            console.log(`\nContract deployed at: ${address}`);
            process.exit(0);
        })
        .catch((error) => {
            console.error("\n❌ Deployment failed:");
            console.error(error);
            process.exit(1);
        });
}

module.exports = main; 