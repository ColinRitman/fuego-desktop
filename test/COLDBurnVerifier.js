const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("COLDBurnVerifier", function () {
  let embersToken, mockVerifier, burnVerifier, owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    const EmbersToken = await ethers.getContractFactory("EmbersToken");
    embersToken = await EmbersToken.deploy(owner.address);
    await embersToken.deployed();

    const MockVerifier = await ethers.getContractFactory("MockWinterfellVerifier");
    mockVerifier = await MockVerifier.deploy();
    await mockVerifier.deployed();

    const COLDBurnVerifier = await ethers.getContractFactory("COLDBurnVerifier");
    burnVerifier = await COLDBurnVerifier.deploy(
      embersToken.address,
      mockVerifier.address,
      owner.address
    );
    await burnVerifier.deployed();

    // Transfer ownership of token to verifier
    await embersToken.transferOwnership(burnVerifier.address);
  });

  it("mints tokens on valid proof", async function () {
    // Prepare dummy proof and signals
    const proof = ethers.utils.hexlify(ethers.utils.randomBytes(32));
    const nullifier = ethers.utils.hexlify(ethers.utils.randomBytes(32));
    const recipientHash = ethers.BigNumber.from(ethers.utils.keccak256(user.address)).and(0xffffffff);

    const publicSignals = [nullifier, 0, recipientHash];

    // Submit proof
    await expect(
      burnVerifier.connect(user).submitProof(proof, publicSignals, user.address)
    ).to.emit(burnVerifier, "ProofVerified");

    // Check token balance
    const bal = await embersToken.balanceOf(user.address);
    expect(bal).to.equal(await burnVerifier.EMBERS_PER_XFG());

    // Nullifier should be marked used
    expect(await burnVerifier.nullifierUsed(nullifier)).to.equal(true);
  });

  it("rejects double spend", async function () {
    const proof = ethers.utils.hexlify(ethers.utils.randomBytes(32));
    const nullifier = ethers.utils.hexlify(ethers.utils.randomBytes(32));
    const recipientHash = ethers.BigNumber.from(ethers.utils.keccak256(user.address)).and(0xffffffff);
    const publicSignals = [nullifier, 0, recipientHash];

    await burnVerifier.connect(user).submitProof(proof, publicSignals, user.address);

    // Second attempt should revert
    await expect(
      burnVerifier.connect(user).submitProof(proof, publicSignals, user.address)
    ).to.be.revertedWith("nullifier used");
  });
}); 