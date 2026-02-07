import { ethers } from "hardhat";
import { run } from "hardhat";

/**
 * FOR THE KIDS Platform - Contract Verification Script
 * Gospel V1.4.1 SURVIVAL MODE
 *
 * Verifies deployed contracts on BaseScan
 *
 * Usage:
 *   npx hardhat run scripts/verify.ts --network base-sepolia
 *   npx hardhat run scripts/verify.ts --network base
 *
 * "Until no kid is in need"
 */

// Update these addresses after deployment
const DEPLOYED = {
  charityRouter: process.env.CHARITY_ROUTER_ADDRESS || "",
  datingRouterProxy: process.env.DATING_ROUTER_PROXY_ADDRESS || "",
  datingRouterImplementation: process.env.DATING_ROUTER_IMPL_ADDRESS || "",
  charitySafe: process.env.CHARITY_SAFE_ADDRESS || "",
};

async function verifyContract(
  address: string,
  constructorArgs: any[],
  contractName: string
) {
  console.log(`Verifying ${contractName} at ${address}...`);

  try {
    await run("verify:verify", {
      address: address,
      constructorArguments: constructorArgs,
    });
    console.log(`  ${contractName} verified successfully`);
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log(`  ${contractName} already verified`);
    } else {
      console.error(`  Failed to verify ${contractName}:`, error.message);
    }
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("FOR THE KIDS Platform - Contract Verification");
  console.log("Gospel V1.4.1 SURVIVAL MODE");
  console.log("=".repeat(60));
  console.log();

  if (!DEPLOYED.charityRouter) {
    throw new Error("CHARITY_ROUTER_ADDRESS not set");
  }

  // Verify CharityRouter100
  console.log("Verifying CharityRouter100...");
  await verifyContract(
    DEPLOYED.charityRouter,
    [DEPLOYED.charitySafe],
    "CharityRouter100"
  );
  console.log();

  // Verify DatingRevenueRouter Implementation
  if (DEPLOYED.datingRouterImplementation) {
    console.log("Verifying DatingRevenueRouter Implementation...");
    await verifyContract(
      DEPLOYED.datingRouterImplementation,
      [],
      "DatingRevenueRouter"
    );
    console.log();
  }

  console.log("=".repeat(60));
  console.log("Verification complete");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
