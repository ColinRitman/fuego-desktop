const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const EPOCH_DURATION = 60 * 60 * 24; // 1 day
const FEE_BPS = 500; // 5%
const INITIAL_PRICE = "200000000000"; // 2000 with 8 decimals

module.exports = buildModule("FuegoForecastModule", (m) => {
  // Parameters for deployment. For a real deployment, these would be addresses of existing contracts.
  const treasury = m.getAccount(0); // Using deployer as treasury for this example
  const coldTokenAddress = m.getParameter("coldTokenAddress");
  const priceOracleAddress = m.getParameter("priceOracleAddress");

  // For a test deployment, we might deploy mocks first.
  // Example:
  // const mockColdToken = m.contract("MockERC20", ["Mock COLD", "mCOLD", 18, ethers.parseEther("1000000")]);
  // const mockPriceOracle = m.contract("MockPriceOracle", [INITIAL_PRICE]);
  
  const fuegoForecast = m.contract("FuegoForecast", [
    coldTokenAddress,
    treasury,
    priceOracleAddress,
    EPOCH_DURATION,
    FEE_BPS,
  ]);

  return { fuegoForecast };
}); 