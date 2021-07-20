import * as dotenv from "dotenv"; // Env
import "@nomiclabs/hardhat-waffle"; // Hardhat

// Hardhat plugins
import "hardhat-gas-reporter"; // Gas stats
import "hardhat-abi-exporter"; // ABI exports
import "@nomiclabs/hardhat-solhint"; // Solhint

// Setup env
dotenv.config();

// Export Hardhat params
export default {
  // Soldity ^0.8.0
  solidity: "0.8.4",
  // Fork mainnet
  networks: {
    hardhat: {
      forking: {
        url: process.env.RPC_NODE_URL,
        blockNumber: 12861740,
      },
    },
  },
  // Gas reporting
  gasReporter: {
    currency: "USD",
    gasPrice: 20,
  },
  // Export ABIs
  abiExporter: {
    path: "./abi",
    clear: true,
  },
};
