import { ethers, upgrades, network } from "hardhat";

/**
 * FOR THE KIDS Platform - Deployment Script
 * Gospel V1.4.1 SURVIVAL MODE
 *
 * Deploys:
 * 1. CharityRouter100 - Immutable 100% charity router for AI platforms
 * 2. DatingRevenueRouter - Upgradeable three-phase router for dating app
 *
 * "Until no kid is in need"
 */

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("=".repeat(60));
  console.log("FOR THE KIDS Platform - Contract Deployment");
  console.log("Gospel V1.4.1 SURVIVAL MODE");
  console.log("=".repeat(60));
  console.log();
  console.log("Network:", network.name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log();

  // Configuration - Update these addresses before deployment
  const CONFIG = {
    // Charity Safe - receives 100% from AI platforms
    CHARITY_SAFE: process.env.CHARITY_SAFE_ADDRESS || "",

    // Dating App Configuration
    FOUNDER_WALLET: process.env.FOUNDER_WALLET_ADDRESS || "",
    DAO_TREASURY: process.env.DAO_TREASURY_ADDRESS || "",
    ADMIN_ADDRESS: process.env.ADMIN_ADDRESS || deployer.address,
    GOVERNOR_ADDRESS: process.env.GOVERNOR_ADDRESS || deployer.address,
  };

  // Validate configuration
  if (!CONFIG.CHARITY_SAFE) {
    throw new Error("CHARITY_SAFE_ADDRESS not set in environment");
  }
  if (!CONFIG.FOUNDER_WALLET) {
    throw new Error("FOUNDER_WALLET_ADDRESS not set in environment");
  }
  if (!CONFIG.DAO_TREASURY) {
    throw new Error("DAO_TREASURY_ADDRESS not set in environment");
  }

  console.log("Configuration:");
  console.log("  Charity Safe:", CONFIG.CHARITY_SAFE);
  console.log("  Founder Wallet:", CONFIG.FOUNDER_WALLET);
  console.log("  DAO Treasury:", CONFIG.DAO_TREASURY);
  console.log("  Admin:", CONFIG.ADMIN_ADDRESS);
  console.log("  Governor:", CONFIG.GOVERNOR_ADDRESS);
  console.log();

  // ========== Deploy CharityRouter100 ==========
  console.log("-".repeat(60));
  console.log("Deploying CharityRouter100...");
  console.log("  This is an IMMUTABLE contract - 100% to charity forever");
  console.log();

  const CharityRouter = await ethers.getContractFactory("CharityRouter100");
  const charityRouter = await CharityRouter.deploy(CONFIG.CHARITY_SAFE);
  await charityRouter.waitForDeployment();

  const charityRouterAddress = await charityRouter.getAddress();
  console.log("  CharityRouter100 deployed to:", charityRouterAddress);
  console.log("  Charity Safe (immutable):", await charityRouter.CHARITY_SAFE());
  console.log();

  // ========== Deploy DatingRevenueRouter ==========
  console.log("-".repeat(60));
  console.log("Deploying DatingRevenueRouter (UUPS Proxy)...");
  console.log("  Starting in SURVIVAL MODE - 100% to founder");
  console.log();

  const DatingRouter = await ethers.getContractFactory("DatingRevenueRouter");
  const datingRouter = await upgrades.deployProxy(
    DatingRouter,
    [
      CONFIG.FOUNDER_WALLET,
      CONFIG.DAO_TREASURY,
      CONFIG.CHARITY_SAFE,
      CONFIG.ADMIN_ADDRESS,
      CONFIG.GOVERNOR_ADDRESS,
    ],
    {
      kind: "uups",
      initializer: "initialize",
    }
  );
  await datingRouter.waitForDeployment();

  const datingRouterAddress = await datingRouter.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(datingRouterAddress);

  console.log("  DatingRevenueRouter Proxy:", datingRouterAddress);
  console.log("  Implementation:", implementationAddress);
  console.log("  Current Phase:", await datingRouter.currentPhase(), "(0 = SURVIVAL)");
  console.log();

  // ========== Verify Split ==========
  const [pctFounder, pctDao, pctCharity] = await datingRouter.getCurrentSplit();
  console.log("  Current Split:");
  console.log("    Founder:", Number(pctFounder) / 100, "%");
  console.log("    DAO:", Number(pctDao) / 100, "%");
  console.log("    Charity:", Number(pctCharity) / 100, "%");
  console.log();

  // ========== Summary ==========
  console.log("=".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log();
  console.log("Deployed Contracts:");
  console.log();
  console.log("  CharityRouter100 (AI Platforms - 100% Charity)");
  console.log("    Address:", charityRouterAddress);
  console.log("    Type: Immutable");
  console.log();
  console.log("  DatingRevenueRouter (Dating App - SURVIVAL MODE)");
  console.log("    Proxy:", datingRouterAddress);
  console.log("    Implementation:", implementationAddress);
  console.log("    Type: UUPS Upgradeable");
  console.log();
  console.log("-".repeat(60));
  console.log("Next Steps:");
  console.log("  1. Verify contracts on BaseScan:");
  console.log(`     npx hardhat verify --network ${network.name} ${charityRouterAddress} ${CONFIG.CHARITY_SAFE}`);
  console.log(`     npx hardhat verify --network ${network.name} ${implementationAddress}`);
  console.log("  2. Update OPUS-STATUS.md with deployed addresses");
  console.log("  3. Configure payment integrations to send to router addresses");
  console.log();
  console.log('"Until no kid is in need"');
  console.log("=".repeat(60));

  // Return addresses for programmatic use
  return {
    charityRouter: charityRouterAddress,
    datingRouterProxy: datingRouterAddress,
    datingRouterImplementation: implementationAddress,
  };
}

main()
  .then((addresses) => {
    console.log();
    console.log("Deployment addresses (JSON):");
    console.log(JSON.stringify(addresses, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
