import { expect } from "chai";
import { ethers, network } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("FuegoForecast", function () {
  let coldToken: any, priceOracle: any, fuegoForecast: any;
  let owner: SignerWithAddress, user1: SignerWithAddress, user2: SignerWithAddress, user3: SignerWithAddress, treasury: SignerWithAddress;

  const EPOCH_DURATION = 60 * 60 * 24; // 1 day in seconds
  const FEE_BPS = 500; // 5%

  beforeEach(async function () {
    [owner, user1, user2, user3, treasury] = await ethers.getSigners();

    // Deploy a mock ERC20 token for COLD
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    coldToken = await MockERC20.deploy("COLD Token", "COLD", 18, ethers.parseEther("1000000"));

    // Deploy a mock PriceOracle
    const MockPriceOracle = await ethers.getContractFactory("MockPriceOracle");
    priceOracle = await MockPriceOracle.deploy(ethers.parseUnits("2000", 8));

    // Deploy FuegoForecast
    const FuegoForecast = await ethers.getContractFactory("FuegoForecast");
    fuegoForecast = await FuegoForecast.deploy(
      coldToken.address,
      treasury.address,
      priceOracle.address,
      EPOCH_DURATION,
      FEE_BPS
    );

    // Distribute COLD tokens to users
    await coldToken.transfer(user1.address, ethers.parseEther("1000"));
    await coldToken.transfer(user2.address, ethers.parseEther("1000"));
    await coldToken.transfer(user3.address, ethers.parseEther("1000"));

    // Approve FuegoForecast to spend users' COLD tokens
    await coldToken.connect(user1).approve(fuegoForecast.address, ethers.parseEther("1000"));
    await coldToken.connect(user2).approve(fuegoForecast.address, ethers.parseEther("1000"));
    await coldToken.connect(user3).approve(fuegoForecast.address, ethers.parseEther("1000"));
  });

  describe("Deployment", function () {
    it("Should set the right owner, treasury, token, and parameters", async function () {
      expect(await fuegoForecast.coldToken()).to.equal(coldToken.address);
      expect(await fuegoForecast.treasury()).to.equal(treasury.address);
      expect(await fuegoForecast.priceOracle()).to.equal(priceOracle.address);
      expect(await fuegoForecast.epochDuration()).to.equal(EPOCH_DURATION);
      expect(await fuegoForecast.feeBps()).to.equal(FEE_BPS);
      expect(await fuegoForecast.currentEpoch()).to.equal(1);
    });
  });

  describe("Deposits", function () {
    const DEPOSIT_AMOUNT = ethers.parseEther("100");

    it("Should allow a user to deposit into the UP vault", async function () {
      await expect(fuegoForecast.connect(user1).deposit(DEPOSIT_AMOUNT, 0)) // 0 for Position.Up
        .to.emit(fuegoForecast, "Deposit")
        .withArgs(1, user1.address, 0, DEPOSIT_AMOUNT);

      const epoch = await fuegoForecast.epochs(1);
      expect(epoch.upVault.totalDeposits).to.equal(DEPOSIT_AMOUNT);
      expect(epoch.upVault.userDeposits[user1.address]).to.equal(DEPOSIT_AMOUNT);
      expect(await coldToken.balanceOf(fuegoForecast.address)).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should allow a user to deposit into the DOWN vault", async function () {
      await expect(fuegoForecast.connect(user2).deposit(DEPOSIT_AMOUNT, 1)) // 1 for Position.Down
        .to.emit(fuegoForecast, "Deposit")
        .withArgs(1, user2.address, 1, DEPOSIT_AMOUNT);

      const epoch = await fuegoForecast.epochs(1);
      expect(epoch.downVault.totalDeposits).to.equal(DEPOSIT_AMOUNT);
      expect(await coldToken.balanceOf(fuegoForecast.address)).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should fail if deposit amount is 0", async function () {
      await expect(fuegoForecast.connect(user1).deposit(0, 0)).to.be.revertedWith("Deposit amount must be positive");
    });

    it("Should fail if a user tries to deposit twice", async function () {
      await fuegoForecast.connect(user1).deposit(DEPOSIT_AMOUNT, 0);
      await expect(fuegoForecast.connect(user1).deposit(DEPOSIT_AMOUNT, 0)).to.be.revertedWith("Already deposited in this epoch");
    });

    it("Should fail if epoch is closed", async function () {
      await time.increase(EPOCH_DURATION + 1);
      await expect(fuegoForecast.connect(user1).deposit(DEPOSIT_AMOUNT, 0)).to.be.revertedWith("Epoch is closed");
    });
  });

  describe("Epoch Resolution and Claiming", function () {
    it("Should correctly resolve epoch, pay winners, and send fee to treasury when UP vault wins", async function () {
      // 1. Deposits
      const user1Deposit = ethers.parseEther("100");
      const user2Deposit = ethers.parseEther("300");
      const user3Deposit = ethers.parseEther("100"); // The lone loser

      await fuegoForecast.connect(user1).deposit(user1Deposit, 0); // Up
      await fuegoForecast.connect(user2).deposit(user2Deposit, 0); // Up
      await fuegoForecast.connect(user3).deposit(user3Deposit, 1); // Down

      const startEpoch = await fuegoForecast.epochs(1);
      const startPrice = startEpoch.startPrice;

      // 2. Resolution
      const newPrice = startPrice + ethers.parseUnits("100", 8); // Price goes up
      await priceOracle.setPrice(newPrice);
      await time.increase(EPOCH_DURATION + 1);

      await expect(fuegoForecast.resolveEpoch(1))
        .to.emit(fuegoForecast, "EpochResolved")
        .withArgs(1, newPrice, 0); // 0 for Position.Up

      // Check treasury fee
      const losingAmount = user3Deposit;
      const expectedFee = (losingAmount * BigInt(FEE_BPS)) / 10000n;
      expect(await coldToken.balanceOf(treasury.address)).to.equal(expectedFee);

      // 3. Claiming
      const prizePool = losingAmount - expectedFee;
      const winnerTotalDeposits = user1Deposit + user2Deposit;

      // User 1 (winner) claim
      const user1InitialBalance = await coldToken.balanceOf(user1.address);
      const user1Winnings = (prizePool * user1Deposit) / winnerTotalDeposits;
      const user1TotalClaim = user1Deposit + user1Winnings;
      await expect(fuegoForecast.connect(user1).claim(1))
        .to.emit(fuegoForecast, "Claim")
        .withArgs(1, user1.address, user1TotalClaim);
      expect(await coldToken.balanceOf(user1.address)).to.equal(user1InitialBalance + user1TotalClaim);
      await expect(fuegoForecast.connect(user1).claim(1)).to.be.revertedWith("Already claimed");

      // User 2 (winner) claim
      const user2InitialBalance = await coldToken.balanceOf(user2.address);
      const user2Winnings = (prizePool * user2Deposit) / winnerTotalDeposits;
      const user2TotalClaim = user2Deposit + user2Winnings;
      await fuegoForecast.connect(user2).claim(1);
      expect(await coldToken.balanceOf(user2.address)).to.equal(user2InitialBalance + user2TotalClaim);
      await expect(fuegoForecast.connect(user2).claim(1)).to.be.revertedWith("Already claimed");

      // User 3 (loser) claim
      const user3InitialBalance = await coldToken.balanceOf(user3.address);
      await fuegoForecast.connect(user3).claim(1);
      expect(await coldToken.balanceOf(user3.address)).to.equal(user3InitialBalance); // Balance is unchanged
      await expect(fuegoForecast.connect(user3).claim(1)).to.be.revertedWith("Already claimed");

      // Check contract balance is 0
      expect(await coldToken.balanceOf(fuegoForecast.address)).to.equal(0);
      
      // Check a new epoch has started
      expect(await fuegoForecast.currentEpoch()).to.equal(2);
    });

    it("Should correctly resolve epoch when DOWN vault wins", async function () {
      // 1. Deposits
      const user1Deposit = ethers.parseEther("200"); // Up vault, loser
      const user2Deposit = ethers.parseEther("200"); // Up vault, loser
      const user3Deposit = ethers.parseEther("100"); // Down vault, winner

      await fuegoForecast.connect(user1).deposit(user1Deposit, 0); // Up
      await fuegoForecast.connect(user2).deposit(user2Deposit, 0); // Up
      await fuegoForecast.connect(user3).deposit(user3Deposit, 1); // Down

      const startEpoch = await fuegoForecast.epochs(1);
      const startPrice = startEpoch.startPrice;

      // 2. Resolution
      const newPrice = startPrice - ethers.parseUnits("100", 8); // Price goes down
      await priceOracle.setPrice(newPrice);
      await time.increase(EPOCH_DURATION + 1);

      await expect(fuegoForecast.resolveEpoch(1))
        .to.emit(fuegoForecast, "EpochResolved")
        .withArgs(1, newPrice, 1); // 1 for Position.Down

      // Check treasury fee from the losing (UP) vault
      const losingAmount = user1Deposit + user2Deposit;
      const expectedFee = (losingAmount * BigInt(FEE_BPS)) / 10000n;
      expect(await coldToken.balanceOf(treasury.address)).to.equal(expectedFee);

      // 3. Claiming
      const prizePool = losingAmount - expectedFee;

      // User 3 (winner) claim
      const user3InitialBalance = await coldToken.balanceOf(user3.address);
      const user3TotalClaim = user3Deposit + prizePool; // The only winner gets the whole pool
      await expect(fuegoForecast.connect(user3).claim(1))
        .to.emit(fuegoForecast, "Claim")
        .withArgs(1, user3.address, user3TotalClaim);
      expect(await coldToken.balanceOf(user3.address)).to.equal(user3InitialBalance + user3TotalClaim);
      
      // User 1 (loser) claim
      const user1InitialBalance = await coldToken.balanceOf(user1.address);
      await fuegoForecast.connect(user1).claim(1);
      expect(await coldToken.balanceOf(user1.address)).to.equal(user1InitialBalance);
    });
  });

});

// We need to create Mock contracts for testing purposes
// It's common to put these in the test file for simplicity or in a separate 'contracts/test' folder
// For now, let's assume we will create them in the contracts/test folder.
// I will create MockERC20.sol and MockPriceOracle.sol next. 