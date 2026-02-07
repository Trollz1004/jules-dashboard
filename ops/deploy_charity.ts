/**
 * FOR THE KIDS Platform - CharityRouter100 Deployment Script
 * Gospel V1.4.1 SURVIVAL MODE
 *
 * Deploys the CharityRouter100 contract that routes 100% of AI platform
 * revenue to verified pediatric charities.
 *
 * "Until no kid is in need"
 */

import { ethers, run, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const ADDRESSES_DIR = path.join(__dirname, "..", "dao", "contracts", "addresses");
const ADDRESSES_FILE = path.join(ADDRESSES_DIR, "base.json");

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

async function verifyContract(
  address: string,
  constructorArguments: unknown[]
): Promise<void> {
  console.log("\nVerifying contract on BaseScan...");
  try {
    await run("verify:verify", {
      address,
      constructorArguments,
    });
    console.log("Contract verified successfully!");
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Already Verified")) {
      console.log("Contract already verified.");
    } else {
      console.error("Verification failed:", error);
      console.log("You can verify manually later using:");
      console.log(`npx hardhat verify --network ${network.name} ${address} ${constructorArguments.join(" ")}`);
    }
  }
}

async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("FOR THE KIDS Platform - CharityRouter100 Deployment");
  console.log("Gospel V1.4.1 SURVIVAL MODE");
  console.log("=".repeat(60));
  console.log("");

  // Validate environment
  const charitySafe = process.env.CHARITY_SAFE;
  const usdcAddress = process.env.USDC_ADDRESS || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

  if (!charitySafe) {
    throw new Error("CHARITY_SAFE address not set in environment variables");
  }

  if (!ethers.isAddress(charitySafe)) {
    throw new Error(`Invalid CHARITY_SAFE address: ${charitySafe}`);
  }

  if (!ethers.isAddress(usdcAddress)) {
    throw new Error(`Invalid USDC_ADDRESS: ${usdcAddress}`);
  }

  // Get deployer
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);

  console.log("Deployment Configuration:");
  console.log("-".repeat(40));
  console.log(`Network:        ${network.name}`);
  console.log(`Chain ID:       ${network.config.chainId}`);
  console.log(`Deployer:       ${deployerAddress}`);
  console.log(`Balance:        ${ethers.formatEther(balance)} ETH`);
  console.log(`USDC Address:   ${usdcAddress}`);
  console.log(`Charity Safe:   ${charitySafe}`);
  console.log("");

  // Check deployer balance
  if (balance === 0n) {
    throw new Error("Deployer has no ETH for gas fees");
  }

  // Deploy CharityRouter100
  console.log("Deploying CharityRouter100...");

  const CharityRouter100 = await ethers.getContractFactory("CharityRouter100");
  const charityRouter = await CharityRouter100.deploy(usdcAddress, charitySafe);

  await charityRouter.waitForDeployment();
  const charityRouterAddress = await charityRouter.getAddress();
  const deployTx = charityRouter.deploymentTransaction();
  const receipt = await deployTx?.wait();

  console.log("");
  console.log("Deployment Successful!");
  console.log("-".repeat(40));
  console.log(`Contract Address: ${charityRouterAddress}`);
  console.log(`Transaction Hash: ${deployTx?.hash}`);
  console.log(`Block Number:     ${receipt?.blockNumber}`);
  console.log(`Gas Used:         ${receipt?.gasUsed.toString()}`);
  console.log("");

  // Save addresses
  const addresses = await loadAddresses();
  addresses.charityRouter = {
    address: charityRouterAddress,
    charitySafe: charitySafe,
    txHash: deployTx?.hash || "",
    blockNumber: receipt?.blockNumber || 0,
  };
  addresses.deployedAt = new Date().toISOString();
  await saveAddresses(addresses);

  // Verify contract if not on localhost
  if (network.name !== "hardhat" && network.name !== "localhost") {
    // Wait for block confirmations before verification
    console.log("Waiting for block confirmations...");
    await deployTx?.wait(5);

    await verifyContract(charityRouterAddress, [usdcAddress, charitySafe]);
  }

  console.log("");
  console.log("=".repeat(60));
  console.log("CharityRouter100 Deployment Complete!");
  console.log("");
  console.log("100% of AI platform revenue will be routed to:");
  console.log(`  ${charitySafe} (verified pediatric charities)`);
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
