require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Generate a random private key for testing if none provided
const generateTestPrivateKey = () => {
  const { randomBytes } = require("crypto");
  return "0x" + randomBytes(32).toString("hex");
};

// Get private key from environment or generate test key
const getPrivateKey = () => {
  const envKey = process.env.PRIVATE_KEY;
  if (envKey && envKey.length === 66 && envKey.startsWith("0x")) {
    return envKey;
  }
  console.log("⚠️  Using generated test private key. Set PRIVATE_KEY in .env for production");
  return generateTestPrivateKey();
};

const privateKey = getPrivateKey();

/** @type import('hardhat/config').HardhatConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
    },
    arbitrumOne: {
      url: process.env.ARBITRUM_ONE_RPC || "https://arb1.arbitrum.io/rpc",
      chainId: 42161,
      accounts: [privateKey],
    },
    arbitrumSepolia: {
      url: process.env.ARBITRUM_SEPOLIA_RPC || "https://sepolia-rollup.arbitrum.io/rpc",
      chainId: 421614,
      accounts: [privateKey],
      gasPrice: 100000000, // 0.1 gwei
    },
    arbitrumGoerli: {
      url: process.env.ARBITRUM_GOERLI_RPC || "https://goerli-rollup.arbitrum.io/rpc",
      chainId: 421613,
      accounts: [privateKey],
    },
  },
  etherscan: {
    apiKey: {
      arbitrumOne: process.env.ARBISCAN_API_KEY || "",
      arbitrumSepolia: process.env.ARBISCAN_API_KEY || "",
      arbitrumGoerli: process.env.ARBISCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io/",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
}; 