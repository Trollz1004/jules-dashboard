/**
 * Initialize Dating Revenue Router in Survival Mode
 * Gospel V1.4.1 SURVIVAL MODE
 *
 * This script initializes the DatingRevenueRouter contract with:
 * - 100% allocation to founder (survival mode)
 * - All governance roles assigned to founder
 *
 * "Until no kid is in need"
 */

import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment from secure location
dotenv.config({ path: "C:\\Keys\\MASTER-PLATFORM-ENV.env" });

// Configuration
const CONFIG = {
  network: "base-mainnet",
  chainId: 8453,
  survival: {
    founderBps: 10000,  // 100%
    daoBps: 0,          // 0%
    charityBps: 0       // 0%
  },
  timelock: {
    minDelay: 604800,   // 7 days
    maxDelay: 2592000   // 30 days
  }
};

// Role definitions
const ROLES = {
  DEFAULT_ADMIN_ROLE: ethers.constants.HashZero,
  GOVERNOR_ROLE: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("GOVERNOR_ROLE")),
  UPGRADER_ROLE: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("UPGRADER_ROLE")),
  PAUSER_ROLE: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("PAUSER_ROLE"))
};

async function main() {
  console.log("=".repeat(60));
  console.log("Gospel V1.4.1 SURVIVAL MODE - Initialize Dating Router");
  console.log("=".repeat(60));
  console.log();

  // Validate environment
  if (!process.env.FOUNDER_WALLET_ADDRESS) {
    throw new Error("FOUNDER_WALLET_ADDRESS not found in environment");
  }
  if (!process.env.CHARITY_WALLET_ADDRESS) {
    throw new Error("CHARITY_WALLET_ADDRESS not found in environment");
  }

  const founderAddress = process.env.FOUNDER_WALLET_ADDRESS;
  const charityAddress = process.env.CHARITY_WALLET_ADDRESS;

  console.log("Configuration:");
  console.log(`  Network: ${CONFIG.network}`);
  console.log(`  Chain ID: ${CONFIG.chainId}`);
  console.log(`  Founder Address: ${founderAddress}`);
  console.log(`  Charity Address: ${charityAddress}`);
  console.log();

  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  const balance = await deployer.getBalance();
  console.log(`Balance: ${ethers.utils.formatEther(balance)} ETH`);
  console.log();

  // Verify deployer is founder
  if (deployer.address.toLowerCase() !== founderAddress.toLowerCase()) {
    throw new Error("Deployer must be founder wallet for survival mode initialization");
  }

  // Deploy DatingRevenueRouter
  console.log("Deploying DatingRevenueRouter...");

  const DatingRevenueRouter = await ethers.getContractFactory("DatingRevenueRouter");

  // Deploy as UUPS proxy
  const datingRouter = await upgrades.deployProxy(
    DatingRevenueRouter,
    [
      founderAddress,           // founder wallet
      ethers.constants.AddressZero, // DAO wallet (none in survival)
      charityAddress,           // charity wallet
      CONFIG.survival.founderBps,
      CONFIG.survival.daoBps,
      CONFIG.survival.charityBps
    ],
    {
      initializer: "initialize",
      kind: "uups"
    }
  );

  await datingRouter.deployed();
  console.log(`DatingRevenueRouter deployed to: ${datingRouter.address}`);
  console.log();

  // Verify initial state
  console.log("Verifying initial state...");

  const split = await datingRouter.getSplit();
  console.log(`  Founder BPS: ${split.founder} (expected: ${CONFIG.survival.founderBps})`);
  console.log(`  DAO BPS: ${split.dao} (expected: ${CONFIG.survival.daoBps})`);
  console.log(`  Charity BPS: ${split.charity} (expected: ${CONFIG.survival.charityBps})`);

  if (split.founder !== CONFIG.survival.founderBps) {
    throw new Error("Founder BPS mismatch!");
  }
  if (split.dao !== CONFIG.survival.daoBps) {
    throw new Error("DAO BPS mismatch!");
  }
  if (split.charity !== CONFIG.survival.charityBps) {
    throw new Error("Charity BPS mismatch!");
  }
  console.log("  Split verification: PASSED");
  console.log();

  // Verify roles
  console.log("Verifying roles...");

  const hasAdminRole = await datingRouter.hasRole(ROLES.DEFAULT_ADMIN_ROLE, founderAddress);
  const hasGovernorRole = await datingRouter.hasRole(ROLES.GOVERNOR_ROLE, founderAddress);
  const hasUpgraderRole = await datingRouter.hasRole(ROLES.UPGRADER_ROLE, founderAddress);

  console.log(`  DEFAULT_ADMIN_ROLE: ${hasAdminRole ? "GRANTED" : "MISSING"}`);
  console.log(`  GOVERNOR_ROLE: ${hasGovernorRole ? "GRANTED" : "MISSING"}`);
  console.log(`  UPGRADER_ROLE: ${hasUpgraderRole ? "GRANTED" : "MISSING"}`);

  if (!hasAdminRole || !hasGovernorRole || !hasUpgraderRole) {
    throw new Error("Role verification failed!");
  }
  console.log("  Role verification: PASSED");
  console.log();

  // Verify permanent split is NOT active
  const isPermanent = await datingRouter.permanentSplitActivated();
  console.log(`Permanent split activated: ${isPermanent}`);
  if (isPermanent) {
    throw new Error("Permanent split should NOT be active in survival mode!");
  }
  console.log("  Survival mode verification: PASSED");
  console.log();

  // Summary
  console.log("=".repeat(60));
  console.log("INITIALIZATION COMPLETE - SURVIVAL MODE ACTIVE");
  console.log("=".repeat(60));
  console.log();
  console.log("Contract Address:", datingRouter.address);
  console.log();
  console.log("Survival Mode Configuration:");
  console.log("  - Founder receives 100% of dating app revenue");
  console.log("  - All governance roles held by founder");
  console.log("  - Permanent split NOT activated");
  console.log("  - Contract is upgradeable via UUPS");
  console.log();
  console.log("Next Steps:");
  console.log("  1. Verify contract on BaseScan");
  console.log("  2. Update governance-config.json with deployed address");
  console.log("  3. Test revenue distribution");
  console.log("  4. When ready, begin transition phase");
  console.log();
  console.log("\"Until no kid is in need\"");
  console.log();

  // Return deployment info
  return {
    datingRouter: datingRouter.address,
    founder: founderAddress,
    charity: charityAddress,
    split: {
      founder: CONFIG.survival.founderBps,
      dao: CONFIG.survival.daoBps,
      charity: CONFIG.survival.charityBps
    },
    permanentSplitActivated: false
  };
}

// Execute
main()
  .then((result) => {
    console.log("Deployment result:", JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
