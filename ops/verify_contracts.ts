/**
 * FOR THE KIDS Platform - Contract Verification Script
 * Gospel V1.4.1 SURVIVAL MODE
 *
 * Verifies deployed contracts on BaseScan.
 * Reads addresses from dao/contracts/addresses/base.json
 *
 * "Until no kid is in need"
 */

import { run, network, upgrades, ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const ADDRESSES_FILE = path.join(__dirname, "..", "dao", "contracts", "addresses", "base.json");

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

interface VerificationResult {
  contract: string;
  address: string;
  success: boolean;
  message: string;
}

async function loadAddresses(): Promise<DeploymentAddresses | null> {
  if (!fs.existsSync(ADDRESSES_FILE)) {
    console.error(`Addresses file not found: ${ADDRESSES_FILE}`);
    return null;
  }
  const data = fs.readFileSync(ADDRESSES_FILE, "utf8");
  return JSON.parse(data);
}

async function verifyWithRetry(
  address: string,
  constructorArguments: unknown[],
  contractName: string,
  maxRetries: number = 3
): Promise<VerificationResult> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`  Attempt ${attempt}/${maxRetries}...`);
      await run("verify:verify", {
        address,
        constructorArguments,
      });
      return {
        contract: contractName,
        address,
        success: true,
        message: "Verified successfully",
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes("Already Verified")) {
          return {
            contract: contractName,
            address,
            success: true,
            message: "Already verified",
          };
        }
        if (error.message.includes("does not have bytecode")) {
          return {
            contract: contractName,
            address,
            success: false,
            message: "Contract not deployed or address incorrect",
          };
        }
        if (attempt === maxRetries) {
          return {
            contract: contractName,
            address,
            success: false,
            message: error.message,
          };
        }
        // Wait before retry
        console.log(`  Retrying in 10 seconds...`);
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }
  }
  return {
    contract: contractName,
    address,
    success: false,
    message: "Max retries exceeded",
  };
}

async function verifyCharityRouter(addresses: DeploymentAddresses): Promise<VerificationResult | null> {
  if (!addresses.charityRouter) {
    console.log("No CharityRouter100 deployment found. Skipping...");
    return null;
  }

  const usdcAddress = process.env.USDC_ADDRESS || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const charitySafe = addresses.charityRouter.charitySafe;

  console.log("\nVerifying CharityRouter100...");
  console.log(`  Address: ${addresses.charityRouter.address}`);
  console.log(`  Constructor Args: [${usdcAddress}, ${charitySafe}]`);

  return verifyWithRetry(
    addresses.charityRouter.address,
    [usdcAddress, charitySafe],
    "CharityRouter100"
  );
}

async function verifyDatingRouter(addresses: DeploymentAddresses): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];

  if (!addresses.datingRouter) {
    console.log("No DatingRevenueRouter deployment found. Skipping...");
    return results;
  }

  // Verify implementation contract
  console.log("\nVerifying DatingRevenueRouter Implementation...");
  console.log(`  Address: ${addresses.datingRouter.implementation}`);

  const implResult = await verifyWithRetry(
    addresses.datingRouter.implementation,
    [],
    "DatingRevenueRouter (Implementation)"
  );
  results.push(implResult);

  // For UUPS proxies, the proxy itself uses OpenZeppelin's ERC1967Proxy
  // which is typically auto-verified or doesn't need verification
  console.log("\nNote: UUPS Proxy verification...");
  console.log(`  Proxy Address: ${addresses.datingRouter.proxy}`);
  console.log("  Proxy contracts are typically auto-linked on BaseScan when");
  console.log("  the implementation is verified. Check BaseScan for proxy status.");

  // Try to verify proxy (this often works automatically with BaseScan)
  try {
    await run("verify:verify", {
      address: addresses.datingRouter.proxy,
      constructorArguments: [],
    });
    results.push({
      contract: "DatingRevenueRouter (Proxy)",
      address: addresses.datingRouter.proxy,
      success: true,
      message: "Verified successfully",
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Already Verified")) {
      results.push({
        contract: "DatingRevenueRouter (Proxy)",
        address: addresses.datingRouter.proxy,
        success: true,
        message: "Already verified",
      });
    } else {
      results.push({
        contract: "DatingRevenueRouter (Proxy)",
        address: addresses.datingRouter.proxy,
        success: false,
        message: "Manual linking may be required on BaseScan",
      });
    }
  }

  return results;
}

async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("FOR THE KIDS Platform - Contract Verification");
  console.log("Gospel V1.4.1 SURVIVAL MODE");
  console.log("=".repeat(60));

  // Check network
  if (network.name === "hardhat" || network.name === "localhost") {
    console.log("\nSkipping verification on local network.");
    console.log("Deploy to Base Mainnet or Base Sepolia for verification.");
    return;
  }

  // Check for BaseScan API key
  if (!process.env.BASESCAN_API_KEY) {
    throw new Error("BASESCAN_API_KEY not set in environment variables");
  }

  console.log(`\nNetwork: ${network.name}`);
  console.log(`Chain ID: ${network.config.chainId}`);

  // Load addresses
  const addresses = await loadAddresses();
  if (!addresses) {
    throw new Error("Could not load deployment addresses. Run deploy scripts first.");
  }

  console.log(`\nLoaded addresses from: ${ADDRESSES_FILE}`);
  console.log(`Deployment timestamp: ${addresses.deployedAt}`);

  const results: VerificationResult[] = [];

  // Verify CharityRouter100
  const charityResult = await verifyCharityRouter(addresses);
  if (charityResult) {
    results.push(charityResult);
  }

  // Verify DatingRevenueRouter
  const datingResults = await verifyDatingRouter(addresses);
  results.push(...datingResults);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("Verification Summary");
  console.log("=".repeat(60));

  let successCount = 0;
  let failCount = 0;

  for (const result of results) {
    const status = result.success ? "[OK]" : "[FAIL]";
    console.log(`${status} ${result.contract}`);
    console.log(`     Address: ${result.address}`);
    console.log(`     Status:  ${result.message}`);
    console.log("");

    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log("-".repeat(40));
  console.log(`Verified: ${successCount} | Failed: ${failCount}`);

  if (failCount > 0) {
    console.log("\nFor failed verifications, try:");
    console.log("1. Wait a few minutes and run this script again");
    console.log("2. Verify manually on BaseScan");
    console.log("3. Check that the contract source matches exactly");
  }

  console.log("");
  console.log('"Until no kid is in need"');
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Verification failed:", error);
    process.exit(1);
  });
