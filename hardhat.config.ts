import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import * as dotenv from "dotenv";

// Load environment variables from the secure credentials file
dotenv.config({ path: "C:\\Keys\\MASTER-PLATFORM-ENV.env" });

/**
 * FOR THE KIDS Platform - Hardhat Configuration
 * Gospel V1.4.1 SURVIVAL MODE
 *
 * Networks:
 * - Base Mainnet (chainId: 8453) - Production deployment
 * - Base Sepolia (chainId: 84532) - Testing
 * - Hardhat local - Development/testing
 *
 * "Until no kid is in need"
 */

// Use DEPLOYER_PRIVATE_KEY or fallback to OPS_WALLET (Protocol Omega)
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.OPS_WALLET_PRIVATE_KEY || "";
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY || "";
const BASE_RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const BASE_SEPOLIA_RPC_URL = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
      evmVersion: "cancun",
    },
  },

  networks: {
    // Local development network
    hardhat: {
      chainId: 31337,
      forking: {
        url: BASE_RPC_URL,
        enabled: false, // Enable for mainnet forking tests
      },
    },

    // Base Mainnet - Production
    base: {
      url: BASE_RPC_URL,
      chainId: 8453,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      gasPrice: "auto",
      verify: {
        etherscan: {
          apiUrl: "https://api.basescan.org",
          apiKey: BASESCAN_API_KEY,
        },
      },
    },

    // Base Sepolia Testnet
    "base-sepolia": {
      url: BASE_SEPOLIA_RPC_URL,
      chainId: 84532,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      gasPrice: "auto",
      verify: {
        etherscan: {
          apiUrl: "https://api-sepolia.basescan.org",
          apiKey: BASESCAN_API_KEY,
        },
      },
    },
  },

  etherscan: {
    apiKey: BASESCAN_API_KEY,
  },

  sourcify: {
    enabled: false,
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    token: "ETH",
    gasPriceApi: "https://api.basescan.org/api?module=proxy&action=eth_gasPrice",
  },

  paths: {
    sources: "./contracts",
    tests: "./contracts/test",
    cache: "./cache",
    artifacts: "./artifacts",
  },

  typechain: {
    outDir: "contracts/typechain-types",
    target: "ethers-v6",
  },

  mocha: {
    timeout: 120000, // 2 minutes for slow tests
  },
};

export default config;
