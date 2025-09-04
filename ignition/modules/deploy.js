const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("embertokenModule", (m) => {
  // Get the deployer account
  const initialOwner = m.getAccount(0);

  // Deploy the EmbersToken contract
  const emberToken = m.contract("embertoken", [initialOwner]);

  return { emberToken };
}); 