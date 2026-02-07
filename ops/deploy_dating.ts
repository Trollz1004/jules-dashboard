/**
 * FOR THE KIDS Platform - DatingRevenueRouter Deployment Script
 * Gospel V1.4.1 SURVIVAL MODE
 *
 * Deploys the DatingRevenueRouter contract using UUPS proxy pattern.
 * SURVIVAL MODE: 100% to founder (temporary until platform is sustainable)
 *
 * "Until no kid is in need"
 */

import { ethers, upgrades, run, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const ADDRESSES_DIR = path.join(__dirname, "..", "dao", "contracts", "addresses");
const ADDRESSES_FILE = path.join(ADDRESSES_DIR, "base.json");

// SURVIVAL MODE: 100% to founder (10000 basis points)
const SURVIVAL_MODE_CONFIG = {
  founderBps: 10000, // 100% to founder
  charityBps: 0,     // 0% to charity (temporary)
  daoBps: 0,         // 0% to DAO (temporary)
};

interface DeploymentAddresses {
  network: string;
  chainId: number;
  deployedAt: string;
  charityRouter?: {
    address: string;
    charitySafe: string;
    txHash: string;
    blockNumber: number;
  };
  datingRouter?: {
    implementation: string;
    proxy: string;
    founderWallet: string;
    mode: string;
    txHash: string;
    blockNumber: number;
  };
}

async function loadAddresses(): Promise<DeploymentAddresses> {
  if (fs.existsSync(ADDRESSES_FILE)) {
    const data = fs.readFileSync(ADDRESSES_FILE, "utf8");
    return JSON.parse(data);
  }
  return {
    network: network.name,
    chainId: network.config.chainId || 8453,
    deployedAt: new Date().toISOString(),
  };
}

async function saveAddresses(addresses: DeploymentAddresses): Promise<void> {
  // Ensure directory exists
  if (!fs.existsSync(ADDRESSES_DIR)) {
    fs.mkdirSync(ADDRESSES_DIR, { recursive: true });
  }
  fs.writeFileSync(ADDRESSES_FILE, JSON.stringify(addresses, null, 2));
  console.log(`Addresses saved to ${ADDRESSES_FILE}`);
}

async function verifyImplementation(
  implementationAddress: string
): Promise<void> {
  console.log("\nVerifying implementation contract on BaseScan...");
  try {
    await run("verify:verify", {
      address: implementationAddress,
      constructorArguments: [],
    });
    console.log("Implementation contract verified successfully!");
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Already Verified")) {
      console.log("Implementation contract already verified.");
    } else {
      console.error("Verification failed:", error);
      console.log("You can verify manually later using:");
      console.log(`npx hardhat verify --network ${network.name} ${implementationAddress}`);
    }
  }
}

async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("FOR THE KIDS Platform - DatingRevenueRouter Deployment");
  console.log("Gospel V1.4.1 SURVIVAL MODE");
  console.log("=".repeat(60));
  console.log("");

  // Validate environment
  const founderWallet = process.env.FOUNDER_WALLET;
  const charitySafe = process.env.CHARITY_SAFE;
  const daoSafe = process.env.DAO_SAFE;
  const usdcAddress = process.env.USDC_ADDRESS || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

  if (!founderWallet) {
    throw new Error("FOUNDER_WALLET address not set in environment variables");
  }

  if (!charitySafe) {
    throw new Error("CHARITY_SAFE address not set in environment variables");
  }

  if (!daoSafe) {
    throw new Error("DAO_SAFE address not set in environment variables");
  }

  // Validate addresses
  for (const [name, addr] of Object.entries({ founderWallet, charitySafe, daoSafe, usdcAddress })) {
    if (!ethers.isAddress(addr)) {
      throw new Error(`Invalid ${name} address: ${addr}`);
    }
  }

  // Get deployer
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);

  console.log("Deployment Configuration:");
  console.log("-".repeat(40));
  console.log(`Network:         ${network.name}`);
  console.log(`Chain ID:        ${network.config.chainId}`);
  console.log(`Deployer:        ${deployerAddress}`);
  console.log(`Balance:         ${ethers.formatEther(balance)} ETH`);
  console.log("");
  console.log("Contract Parameters:");
  console.log("-".repeat(40));
  console.log(`USDC Address:    ${usdcAddress}`);
  console.log(`Founder Wallet:  ${founderWallet}`);
  console.log(`Charity Safe:    ${charitySafe}`);
  console.log(`DAO Safe:        ${daoSafe}`);
  console.log("");
  console.log("SURVIVAL MODE Revenue Split:");
  console.log("-".repeat(40));
  console.log(`Founder:         ${SURVIVAL_MODE_CONFIG.founderBps / 100}%`);
  console.log(`Charity:         ${SURVIVAL_MODE_CONFIG.charityBps / 100}%`);
  console.log(`DAO:             ${SURVIVAL_MODE_CONFIG.daoBps / 100}%`);
  console.log("");

  // Check deployer balance
  if (balance === 0n) {
    throw new Error("Deployer has no ETH for gas fees");
  }

  // Deploy DatingRevenueRouter with UUPS proxy
  console.log("Deploying DatingRevenueRouter (UUPS Proxy)...");
  console.log("");

  const DatingRevenueRouter = await ethers.getContractFactory("DatingRevenueRouter");

  // Deploy proxy with initialize call
  const datingRouter = await upgrades.deployProxy(
    DatingRevenueRouter,
    [
      usdcAddress,
      founderWallet,
      charitySafe,
      daoSafe,
      SURVIVAL_MODE_CONFIG.founderBps,
      SURVIVAL_MODE_CONFIG.charityBps,
      SURVIVAL_MODE_CONFIG.daoBps,
    ],
    {
      initializer: "initialize",
      kind: "uups",
    }
  );

  await datingRouter.waitForDeployment();
  const proxyAddress = await datingRouter.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  const deployTx = datingRouter.deploymentTransaction();
  const receipt = await deployTx?.wait();

  console.log("Proxy Deployment Successful!");
  console.log("-".repeat(40));
  console.log(`Proxy Address:          ${proxyAddress}`);
  console.log(`Implementation Address: ${implementationAddress}`);
  console.log(`Transaction Hash:       ${deployTx?.hash}`);
  console.log(`Block Number:           ${receipt?.blockNumber}`);
  console.log(`Gas Used:               ${receipt?.gasUsed.toString()}`);
  console.log("");

  // Set roles: FOUNDER_WALLET as admin and governor
  console.log("Setting up roles...");

  // Get role identifiers
  const DEFAULT_ADMIN_ROLE = await datingRouter.DEFAULT_ADMIN_ROLE();
  const GOVERNOR_ROLE = await datingRouter.GOVERNOR_ROLE();

  // Grant roles to founder wallet
  const grantAdminTx = await datingRouter.grantRole(DEFAULT_ADMIN_ROLE, founderWallet);
  await grantAdminTx.wait();
  console.log(`Granted DEFAULT_ADMIN_ROLE to ${founderWallet}`);

  const grantGovernorTx = await datingRouter.grantRole(GOVERNOR_ROLE, founderWallet);
  await grantGovernorTx.wait();
  console.log(`Granted GOVERNOR_ROLE to ${founderWallet}`);

  // Renounce deployer's admin role (transfer to founder)
  if (deployerAddress.toLowerCase() !== founderWallet.toLowerCase()) {
    const renounceTx = await datingRouter.renounceRole(DEFAULT_ADMIN_ROLE, deployerAddress);
    await renounceTx.wait();
    console.log(`Renounced DEFAULT_ADMIN_ROLE from deployer`);
  }

  console.log("Role setup complete!");
  console.log("");

  // Save addresses
  const addresses = await loadAddresses();
  addresses.datingRouter = {
    implementation: implementationAddress,
    proxy: proxyAddress,
    founderWallet: founderWallet,
    mode: "SURVIVAL",
    txHash: deployTx?.hash || "",
    blockNumber: receipt?.blockNumber || 0,
  };
  addresses.deployedAt = new Date().toISOString();
  await saveAddresses(addresses);

  // Verify contracts if not on localhost
  if (network.name !== "hardhat" && network.name !== "localhost") {
    // Wait for block confirmations before verification
    console.log("Waiting for block confirmations...");
    await deployTx?.wait(5);

    await verifyImplementation(implementationAddress);
  }

  console.log("");
  console.log("=".repeat(60));
  console.log("DatingRevenueRouter Deployment Complete!");
  console.log("");
  console.log("SURVIVAL MODE ACTIVE:");
  console.log("  - 100% revenue to founder (temporary)");
  console.log("  - Will transition to full charity mode when sustainable");
  console.log("");
  console.log("Roles Assigned:");
  console.log(`  - Admin:    ${founderWallet}`);
  console.log(`  - Governor: ${founderWallet}`);
  console.log("");
  console.log('"Until no kid is in need"');
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
