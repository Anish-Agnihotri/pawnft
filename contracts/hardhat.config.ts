import * as dotenv from "dotenv"; // Env
import "@nomiclabs/hardhat-waffle"; // Hardhat

// Hardhat plugins
import "hardhat-gas-reporter"; // Gas stats
import "hardhat-abi-exporter"; // ABI exports
import "@nomiclabs/hardhat-solhint"; // Solhint

// Setup env
dotenv.config();
const ALCHEMY_API_KEY: string = process.env.ALCHEMY_API_KEY ?? "";
const RINKEBY_DEPLOY_PK: string = process.env.RINKEBY_DEPLOY_PK ?? "";

// Export Hardhat params
export default {
  // Soldity ^0.8.0
  solidity: "0.8.4",
  networks: {
    // Fork mainnet for testing
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
        blockNumber: 12864983,
      },
    },
    // Deploy to Rinkeby
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      accounts: [`${RINKEBY_DEPLOY_PK}`],
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
