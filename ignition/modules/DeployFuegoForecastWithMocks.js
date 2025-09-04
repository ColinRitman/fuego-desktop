const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { ethers } = require("hardhat");

const EPOCH_DURATION = 60 * 60 * 24; // 1 day
const FEE_BPS = 500; // 5%
const INITIAL_PRICE = ethers.parseUnits("2000", 8); // 2000 with 8 decimals
const MINT_AMOUNT = ethers.parseEther("1000000");

module.exports = buildModule("FuegoForecastWithMocksModule", (m) => {
  // Use the deployer account for the treasury
  const treasury = m.getAccount(0);

  // Deploy mock contracts first
  const coldToken = m.contract("MockERC20", [
    "Mock COLD Token",
    "mCOLD",
    18,
    MINT_AMOUNT,
  ]);
  
  const priceOracle = m.contract("MockPriceOracle", [INITIAL_PRICE]);
  
  // Deploy the main contract, passing the addresses of the mocks
  const fuegoForecast = m.contract("FuegoForecast", {
    args: [
      coldToken,
      treasury,
      priceOracle,
      EPOCH_DURATION,
      FEE_BPS,
    ],
  });

  return { fuegoForecast, coldToken, priceOracle };
}); 