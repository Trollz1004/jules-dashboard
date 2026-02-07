/**
 * Schedule New Revenue Split
 * Gospel V1.4.1 SURVIVAL MODE
 *
 * This script schedules a new revenue split for the DatingRevenueRouter.
 * The scheduled split will become executable after the mandatory delay period.
 *
 * WARNING: Verify all parameters carefully before execution!
 *
 * "Until no kid is in need"
 */

import { ethers } from "hardhat";
import * as dotenv from "dotenv";

// Load environment from secure location
dotenv.config({ path: "C:\\Keys\\MASTER-PLATFORM-ENV.env" });

// ============================================================
// CONFIGURATION - MODIFY THESE VALUES BEFORE RUNNING
// ============================================================

const SCHEDULE_CONFIG = {
  // Contract address - UPDATE THIS
  datingRouterAddress: "0x0000000000000000000000000000000000000000", // TODO: Set actual address

  // New split parameters (must sum to 10000)
  newSplit: {
    founderBps: 1000,   // 10% to founder
    daoBps: 4500,       // 45% to DAO
    charityBps: 4500    // 45% to charity
  },

  // Expected delay
  expectedMinDelay: 604800,  // 7 days in seconds
  expectedMaxDelay: 2592000  // 30 days in seconds
};

// ============================================================

// Role definition
const GOVERNOR_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("GOVERNOR_ROLE"));

interface ScheduleResult {
  success: boolean;
  transactionHash?: string;
  scheduledSplit?: {
    founder: number;
    dao: number;
    charity: number;
    executionTime: number;
    executionDate: string;
    expiryTime: number;
    expiryDate: string;
  };
  error?: string;
}

async function validateConfiguration(): Promise<void> {
  console.log("Validating configuration...");

  // Check contract address
  if (SCHEDULE_CONFIG.datingRouterAddress === "0x0000000000000000000000000000000000000000") {
    throw new Error("Contract address not set! Update SCHEDULE_CONFIG.datingRouterAddress");
  }

  // Check split sums to 10000
  const total = SCHEDULE_CONFIG.newSplit.founderBps +
                SCHEDULE_CONFIG.newSplit.daoBps +
                SCHEDULE_CONFIG.newSplit.charityBps;

  if (total !== 10000) {
    throw new Error(`Split must sum to 10000, got ${total}`);
  }

  // Check individual values are within bounds
  if (SCHEDULE_CONFIG.newSplit.founderBps < 0 || SCHEDULE_CONFIG.newSplit.founderBps > 10000) {
    throw new Error("Founder BPS out of range (0-10000)");
  }
  if (SCHEDULE_CONFIG.newSplit.daoBps < 0 || SCHEDULE_CONFIG.newSplit.daoBps > 10000) {
    throw new Error("DAO BPS out of range (0-10000)");
  }
  if (SCHEDULE_CONFIG.newSplit.charityBps < 0 || SCHEDULE_CONFIG.newSplit.charityBps > 10000) {
    throw new Error("Charity BPS out of range (0-10000)");
  }

  console.log("  Configuration validation: PASSED");
}

async function main(): Promise<ScheduleResult> {
  console.log("=".repeat(60));
  console.log("Gospel V1.4.1 - Schedule Revenue Split");
  console.log("=".repeat(60));
  console.log();

  try {
    // Validate configuration
    await validateConfiguration();
    console.log();

    // Get signer
    const [signer] = await ethers.getSigners();
    console.log(`Signer: ${signer.address}`);

    const balance = await signer.getBalance();
    console.log(`Balance: ${ethers.utils.formatEther(balance)} ETH`);
    console.log();

    // Connect to contract
    console.log("Connecting to DatingRevenueRouter...");
    const datingRouter = await ethers.getContractAt(
      "DatingRevenueRouter",
      SCHEDULE_CONFIG.datingRouterAddress
    );
    console.log(`Contract: ${datingRouter.address}`);
    console.log();

    // Pre-flight checks
    console.log("Running pre-flight checks...");

    // Check 1: Verify signer has GOVERNOR_ROLE
    const hasGovernorRole = await datingRouter.hasRole(GOVERNOR_ROLE, signer.address);
    console.log(`  Has GOVERNOR_ROLE: ${hasGovernorRole ? "YES" : "NO"}`);
    if (!hasGovernorRole) {
      throw new Error("Signer does not have GOVERNOR_ROLE");
    }

    // Check 2: Verify permanent split is NOT active
    const isPermanent = await datingRouter.permanentSplitActivated();
    console.log(`  Permanent split active: ${isPermanent ? "YES" : "NO"}`);
    if (isPermanent) {
      throw new Error("Cannot schedule split - permanent split is already active");
    }

    // Check 3: Check for existing scheduled split
    const existingSchedule = await datingRouter.getScheduledSplit();
    if (existingSchedule.executionTime.gt(0)) {
      console.log(`  Existing schedule found: execution time ${existingSchedule.executionTime}`);
      console.log("  WARNING: This will overwrite the existing scheduled split!");
    } else {
      console.log("  No existing schedule found");
    }

    // Check 4: Get current split for comparison
    const currentSplit = await datingRouter.getSplit();
    console.log(`  Current split: Founder ${currentSplit.founder}, DAO ${currentSplit.dao}, Charity ${currentSplit.charity}`);

    console.log("  Pre-flight checks: PASSED");
    console.log();

    // Display proposed changes
    console.log("Proposed Split Changes:");
    console.log("  +-----------+----------+----------+");
    console.log("  |           | Current  | New      |");
    console.log("  +-----------+----------+----------+");
    console.log(`  | Founder   | ${String(currentSplit.founder).padStart(6)}   | ${String(SCHEDULE_CONFIG.newSplit.founderBps).padStart(6)}   |`);
    console.log(`  | DAO       | ${String(currentSplit.dao).padStart(6)}   | ${String(SCHEDULE_CONFIG.newSplit.daoBps).padStart(6)}   |`);
    console.log(`  | Charity   | ${String(currentSplit.charity).padStart(6)}   | ${String(SCHEDULE_CONFIG.newSplit.charityBps).padStart(6)}   |`);
    console.log("  +-----------+----------+----------+");
    console.log();

    // Calculate execution window
    const currentTime = Math.floor(Date.now() / 1000);
    const executionTime = currentTime + SCHEDULE_CONFIG.expectedMinDelay;
    const expiryTime = currentTime + SCHEDULE_CONFIG.expectedMaxDelay;

    console.log("Execution Window:");
    console.log(`  Earliest: ${new Date(executionTime * 1000).toISOString()}`);
    console.log(`  Latest:   ${new Date(expiryTime * 1000).toISOString()}`);
    console.log();

    // Execute schedule
    console.log("Scheduling split...");
    const tx = await datingRouter.scheduleSplit(
      SCHEDULE_CONFIG.newSplit.founderBps,
      SCHEDULE_CONFIG.newSplit.daoBps,
      SCHEDULE_CONFIG.newSplit.charityBps
    );

    console.log(`Transaction hash: ${tx.hash}`);
    console.log("Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log(`Confirmed in block: ${receipt.blockNumber}`);
    console.log(`Gas used: ${receipt.gasUsed.toString()}`);
    console.log();

    // Verify scheduled split
    console.log("Verifying scheduled split...");
    const scheduled = await datingRouter.getScheduledSplit();

    const result: ScheduleResult = {
      success: true,
      transactionHash: tx.hash,
      scheduledSplit: {
        founder: scheduled.founder,
        dao: scheduled.dao,
        charity: scheduled.charity,
        executionTime: scheduled.executionTime.toNumber(),
        executionDate: new Date(scheduled.executionTime.toNumber() * 1000).toISOString(),
        expiryTime: scheduled.executionTime.toNumber() + SCHEDULE_CONFIG.expectedMaxDelay - SCHEDULE_CONFIG.expectedMinDelay,
        expiryDate: new Date((scheduled.executionTime.toNumber() + SCHEDULE_CONFIG.expectedMaxDelay - SCHEDULE_CONFIG.expectedMinDelay) * 1000).toISOString()
      }
    };

    console.log("  Scheduled founder BPS:", scheduled.founder);
    console.log("  Scheduled DAO BPS:", scheduled.dao);
    console.log("  Scheduled charity BPS:", scheduled.charity);
    console.log("  Execution time:", result.scheduledSplit!.executionDate);
    console.log();

    // Summary
    console.log("=".repeat(60));
    console.log("SPLIT SCHEDULED SUCCESSFULLY");
    console.log("=".repeat(60));
    console.log();
    console.log("Next Steps:");
    console.log(`  1. Wait until ${result.scheduledSplit!.executionDate}`);
    console.log("  2. Run apply-split.ts to apply the new split");
    console.log("  3. OR run cancel-split.ts to cancel before execution time");
    console.log();
    console.log("IMPORTANT: The split can be cancelled until it is applied!");
    console.log();
    console.log("\"Until no kid is in need\"");

    return result;

  } catch (error: any) {
    console.error("Schedule failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Execute
main()
  .then((result) => {
    if (result.success) {
      console.log("\nResult:", JSON.stringify(result, null, 2));
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });
