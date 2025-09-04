// Deployment script for EmbersToken + MockWinterfellVerifier + COLDBurnVerifier
// Usage: npx hardhat run scripts/deploy-cold-burn-verifier.js --network hardhat

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with", deployer.address);

  // 1. Deploy EmbersToken
  const EmbersToken = await hre.ethers.getContractFactory("EmbersToken");
  const embersToken = await EmbersToken.deploy(deployer.address);
  await embersToken.waitForDeployment();
  console.log("EmbersToken deployed to", await embersToken.getAddress());

  // 2. Deploy MockWinterfellVerifier (replace with real verifier later)
  const MockVerifier = await hre.ethers.getContractFactory("MockWinterfellVerifier");
  const mockVerifier = await MockVerifier.deploy();
  await mockVerifier.waitForDeployment();
  console.log("MockVerifier deployed to", await mockVerifier.getAddress());

  // 3. Deploy COLDBurnVerifier
  const COLDBurnVerifier = await hre.ethers.getContractFactory("COLDBurnVerifier");
  const burnVerifier = await COLDBurnVerifier.deploy(
    await embersToken.getAddress(),
    await mockVerifier.getAddress(),
    deployer.address
  );
  await burnVerifier.waitForDeployment();
  console.log("COLDBurnVerifier deployed to", await burnVerifier.getAddress());

  // 4. Transfer ownership of EmbersToken to COLDBurnVerifier so it can mint
  const tx = await embersToken.transferOwnership(await burnVerifier.getAddress());
  await tx.wait();
  console.log("Ownership of EmbersToken transferred to COLDBurnVerifier");

  console.log("Deployment complete.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 