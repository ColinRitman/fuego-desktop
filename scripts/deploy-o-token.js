#!/usr/bin/env node

const { ethers } = require("hardhat");
const fs = require("fs");

/**
 * Deploy COLD O Token on Arbitrum One Mainnet
 * 
 * Tokenomics:
 * - Max Supply: 100,000,000 O tokens
 * - Governance token for COLD L3
 * - Voting power with delegation
 * - Privacy-enabled minting capabilities
 */

async function main() {
    console.log("❄️  Deploying COLD O Token on Arbitrum One...");
    
    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();
    
    console.log("🌐 Network:", network.name, "Chain ID:", network.chainId);
    console.log("👤 Deployer:", deployer.address);
    
    // Check balance
    const balance = await deployer.getBalance();
    console.log("💰 Deployer balance:", ethers.utils.formatEther(balance), "ETH");
    
    if (balance.lt(ethers.utils.parseEther("0.01"))) {
        console.error("❌ Insufficient ETH balance for deployment");
        console.log("💡 Need at least 0.01 ETH on Arbitrum One");
        process.exit(1);
    }
    
    // Verify we're on Arbitrum One
    if (network.chainId !== 42161) {
        console.error("❌ This script is for Arbitrum One (Chain ID: 42161)");
        console.error("   Current Chain ID:", network.chainId);
        process.exit(1);
    }
    
    console.log("\n📄 Deploying COLDOToken (O)...");
    
    // Deploy COLDOToken
    const COLDOToken = await ethers.getContractFactory("COLDOToken");
    const oToken = await COLDOToken.deploy(deployer.address);
    
    await oToken.deployed();
    console.log("✅ COLD O Token deployed to:", oToken.address);
    
    // Verify deployment
    const name = await oToken.name();
    const symbol = await oToken.symbol();
    const decimals = await oToken.decimals();
    const owner = await oToken.owner();
    const maxSupply = await oToken.MAX_SUPPLY();
    
    console.log("\n📊 Token Details:");
    console.log("   Name:", name);
    console.log("   Symbol:", symbol);
    console.log("   Decimals:", decimals);
    console.log("   Owner:", owner);
    console.log("   Max Supply:", ethers.utils.formatEther(maxSupply));
    console.log("   Current Supply:", ethers.utils.formatEther(await oToken.totalSupply()));
    
    // Initial governance setup
    console.log("\n🏛️  Setting up governance parameters...");
    
    const proposalThreshold = await oToken.PROPOSAL_THRESHOLD();
    const quorumThreshold = await oToken.QUORUM_THRESHOLD();
    const votingPeriod = await oToken.VOTING_PERIOD();
    
    console.log("   Proposal Threshold:", ethers.utils.formatEther(proposalThreshold), "O tokens");
    console.log("   Quorum Threshold:", ethers.utils.formatEther(quorumThreshold), "O tokens");
    console.log("   Voting Period:", votingPeriod.toString(), "seconds");
    
    // Create deployment record
    const deploymentInfo = {
        network: {
            name: network.name,
            chainId: network.chainId,
            rpcUrl: "https://arb1.arbitrum.io/rpc"
        },
        deployment: {
            timestamp: new Date().toISOString(),
            deployer: deployer.address,
            deployerBalance: ethers.utils.formatEther(balance)
        },
        token: {
            name: name,
            symbol: symbol,
            decimals: decimals,
            address: oToken.address,
            owner: owner,
            maxSupply: ethers.utils.formatEther(maxSupply),
            currentSupply: ethers.utils.formatEther(await oToken.totalSupply())
        },
        governance: {
            proposalThreshold: ethers.utils.formatEther(proposalThreshold),
            quorumThreshold: ethers.utils.formatEther(quorumThreshold),
            votingPeriod: votingPeriod.toString() + " seconds",
            executionDelay: "2 days",
            features: [
                "On-chain governance voting",
                "Proposal creation and execution", 
                "Vote delegation",
                "Privacy-enabled minting",
                "Liquidity mining rewards"
            ]
        },
        allocations: {
            liquidityRewards: "30,000,000 O (30%)",
            governance: "20,000,000 O (20%)",
            privacyMinting: "25,000,000 O (25%)",
            initialSetup: "5,000,000 O (5%)",
            reserve: "20,000,000 O (20%)"
        },
        usage: {
            purpose: "Governance token for COLD L3 ecosystem",
            voting: "L3 protocol parameters and upgrades",
            rewards: "Liquidity provision incentives",
            privacy: "Anonymous governance participation"
        }
    };
    
    // Save deployment info
    const deploymentPath = `deployments/o-token-arbitrum-mainnet-${Date.now()}.json`;
    fs.mkdirSync("deployments", { recursive: true });
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n📄 Deployment saved to:", deploymentPath);
    
    // Contract verification command
    console.log("\n🔍 Verify contract with:");
    console.log(`npx hardhat verify --network arbitrumOne ${oToken.address} "${deployer.address}"`);
    
    // MetaMask integration info
    console.log("\n🦊 Add to MetaMask:");
    console.log("   Token Address:", oToken.address);
    console.log("   Token Symbol: O");
    console.log("   Token Decimals: 18");
    
    // Next steps
    console.log("\n🚀 Next Steps:");
    console.log("   1. Verify contract on Arbiscan");
    console.log("   2. Set up privacy engine contract address");
    console.log("   3. Configure liquidity mining pools");
    console.log("   4. Create initial governance proposals");
    console.log("   5. Link with HEAT token for L3 governance");
    
    console.log("\n🎉 COLD O Token is now live on Arbitrum One!");
    
    return {
        address: oToken.address,
        deploymentInfo
    };
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("❌ Deployment failed:", error);
            process.exit(1);
        });
}

module.exports = { main }; 