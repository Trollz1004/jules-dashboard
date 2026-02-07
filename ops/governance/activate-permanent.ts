/**
 * Activate Permanent Split - IRREVERSIBLE
 * Gospel V1.4.1 SURVIVAL MODE
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !! WARNING: THIS SCRIPT PERFORMS AN IRREVERSIBLE ACTION    !!
 * !! Once executed, the founder allocation can NEVER exceed  !!
 * !! the specified maximum percentage (default: 10%)         !!
 * !! THIS CANNOT BE UNDONE                                   !!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 *
 * "Until no kid is in need"
 */

import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as readline from "readline";

// Load environment from secure location
dotenv.config({ path: "C:\\Keys\\MASTER-PLATFORM-ENV.env" });

// ============================================================
// CONFIGURATION - VERIFY BEFORE RUNNING
// ============================================================

const PERMANENT_CONFIG = {
  // Contract address - UPDATE THIS
  datingRouterAddress: "0x0000000000000000000000000000000000000000", // TODO: Set actual address

  // Maximum founder allocation (in basis points)
  // 1000 = 10% - this caps founder at 10% FOREVER
  maxFounderBps: 1000,

  // Safety confirmations required
  requiredConfirmations: 3
};

// ============================================================

// Role definition
const GOVERNOR_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("GOVERNOR_ROLE"));

interface ActivationResult {
  success: boolean;
  transactionHash?: string;
  maxFounderBps?: number;
  maxFounderPercent?: string;
  permanentSplitActivated?: boolean;
  error?: string;
}

async function promptConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "yes" || answer.toLowerCase() === "y");
    });
  });
}

async function runSafetyChecks(datingRouter: any, signer: any): Promise<boolean> {
  console.log("Running safety checks...");
  console.log();

  let allPassed = true;

  // Check 1: Contract address is valid
  console.log("Check 1: Contract address validation");
  if (PERMANENT_CONFIG.datingRouterAddress === "0x0000000000000000000000000000000000000000") {
    console.log("  FAILED: Contract address not set!");
    allPassed = false;
  } else {
    console.log(`  PASSED: Contract address is ${PERMANENT_CONFIG.datingRouterAddress}`);
  }

  // Check 2: Verify signer has GOVERNOR_ROLE
  console.log("Check 2: GOVERNOR_ROLE verification");
  const hasGovernorRole = await datingRouter.hasRole(GOVERNOR_ROLE, signer.address);
  if (!hasGovernorRole) {
    console.log(`  FAILED: Signer ${signer.address} does not have GOVERNOR_ROLE`);
    allPassed = false;
  } else {
    console.log(`  PASSED: Signer has GOVERNOR_ROLE`);
  }

  // Check 3: Verify permanent split is NOT already active
  console.log("Check 3: Permanent split status");
  const isPermanent = await datingRouter.permanentSplitActivated();
  if (isPermanent) {
    console.log("  FAILED: Permanent split is already active!");
    allPassed = false;
  } else {
    console.log("  PASSED: Permanent split not yet activated");
  }

  // Check 4: Verify maxFounderBps is within bounds
  console.log("Check 4: Max founder BPS validation");
  if (PERMANENT_CONFIG.maxFounderBps > 1000) {
    console.log(`  FAILED: maxFounderBps (${PERMANENT_CONFIG.maxFounderBps}) exceeds maximum allowed (1000)`);
    allPassed = false;
  } else if (PERMANENT_CONFIG.maxFounderBps <= 0) {
    console.log(`  FAILED: maxFounderBps must be positive`);
    allPassed = false;
  } else {
    console.log(`  PASSED: maxFounderBps is ${PERMANENT_CONFIG.maxFounderBps} (${PERMANENT_CONFIG.maxFounderBps / 100}%)`);
  }

  // Check 5: Verify current founder allocation is within new limit
  console.log("Check 5: Current allocation compatibility");
  const currentSplit = await datingRouter.getSplit();
  if (currentSplit.founder > PERMANENT_CONFIG.maxFounderBps) {
    console.log(`  FAILED: Current founder allocation (${currentSplit.founder}) exceeds new max (${PERMANENT_CONFIG.maxFounderBps})`);
    console.log("  ACTION REQUIRED: Reduce founder allocation before activating permanent split");
    allPassed = false;
  } else {
    console.log(`  PASSED: Current founder allocation (${currentSplit.founder}) is within new max (${PERMANENT_CONFIG.maxFounderBps})`);
  }

  // Check 6: No pending scheduled split
  console.log("Check 6: Pending schedule check");
  const scheduled = await datingRouter.getScheduledSplit();
  if (scheduled.executionTime.gt(0)) {
    console.log(`  WARNING: There is a pending scheduled split`);
    console.log(`  Scheduled founder BPS: ${scheduled.founder}`);
    if (scheduled.founder > PERMANENT_CONFIG.maxFounderBps) {
      console.log(`  FAILED: Scheduled founder allocation exceeds new max`);
      allPassed = false;
    } else {
      console.log("  Scheduled allocation is compatible with new max");
    }
  } else {
    console.log("  PASSED: No pending scheduled split");
  }

  console.log();
  return allPassed;
}

async function main(): Promise<ActivationResult> {
  console.log("=".repeat(70));
  console.log("!!  DANGER: PERMANENT SPLIT ACTIVATION - IRREVERSIBLE ACTION  !!");
  console.log("=".repeat(70));
  console.log();
  console.log("This script will permanently cap the founder allocation.");
  console.log(`Maximum founder allocation will be: ${PERMANENT_CONFIG.maxFounderBps / 100}%`);
  console.log();
  console.log("THIS ACTION CANNOT BE UNDONE!");
  console.log();

  try {
    // Get signer
    const [signer] = await ethers.getSigners();
    console.log(`Signer: ${signer.address}`);

    const balance = await signer.getBalance();
    console.log(`Balance: ${ethers.utils.formatEther(balance)} ETH`);
    console.log();

    // Connect to contract
    const datingRouter = await ethers.getContractAt(
      "DatingRevenueRouter",
      PERMANENT_CONFIG.datingRouterAddress
    );

    // Run safety checks
    const safetyPassed = await runSafetyChecks(datingRouter, signer);

    if (!safetyPassed) {
      console.log("=".repeat(70));
      console.log("SAFETY CHECKS FAILED - ABORTING");
      console.log("=".repeat(70));
      console.log();
      console.log("Please address the failed checks before retrying.");
      return {
        success: false,
        error: "Safety checks failed"
      };
    }

    console.log("=".repeat(70));
    console.log("ALL SAFETY CHECKS PASSED");
    console.log("=".repeat(70));
    console.log();

    // Multiple confirmation prompts
    console.log("CONFIRMATION REQUIRED");
    console.log("-".repeat(70));
    console.log();
    console.log("You are about to activate the permanent split with:");
    console.log(`  Maximum founder allocation: ${PERMANENT_CONFIG.maxFounderBps} BPS (${PERMANENT_CONFIG.maxFounderBps / 100}%)`);
    console.log();
    console.log("After this action:");
    console.log("  - Founder can NEVER receive more than the specified percentage");
    console.log("  - This restriction is enforced at the smart contract level");
    console.log("  - No one can reverse this action, not even the contract owner");
    console.log();

    // Confirmation 1
    console.log("CONFIRMATION 1 of 3:");
    const confirm1 = await promptConfirmation(
      "Do you understand this action is IRREVERSIBLE? (yes/no): "
    );
    if (!confirm1) {
      console.log("Aborted by user at confirmation 1.");
      return { success: false, error: "User cancelled at confirmation 1" };
    }

    // Confirmation 2
    console.log("\nCONFIRMATION 2 of 3:");
    const confirm2 = await promptConfirmation(
      `Do you confirm setting max founder to ${PERMANENT_CONFIG.maxFounderBps / 100}% FOREVER? (yes/no): `
    );
    if (!confirm2) {
      console.log("Aborted by user at confirmation 2.");
      return { success: false, error: "User cancelled at confirmation 2" };
    }

    // Confirmation 3 - Type specific phrase
    console.log("\nCONFIRMATION 3 of 3:");
    console.log("Type 'ACTIVATE PERMANENT' to proceed:");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const finalConfirm = await new Promise<string>((resolve) => {
      rl.question("> ", (answer) => {
        rl.close();
        resolve(answer);
      });
    });

    if (finalConfirm !== "ACTIVATE PERMANENT") {
      console.log("Aborted: Incorrect confirmation phrase.");
      return { success: false, error: "Incorrect confirmation phrase" };
    }

    console.log();
    console.log("=".repeat(70));
    console.log("EXECUTING PERMANENT SPLIT ACTIVATION...");
    console.log("=".repeat(70));
    console.log();

    // Execute the irreversible action
    console.log("Calling activatePermanentSplit()...");
    const tx = await datingRouter.activatePermanentSplit(PERMANENT_CONFIG.maxFounderBps);

    console.log(`Transaction hash: ${tx.hash}`);
    console.log("Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log(`Confirmed in block: ${receipt.blockNumber}`);
    console.log(`Gas used: ${receipt.gasUsed.toString()}`);
    console.log();

    // Verify activation
    console.log("Verifying activation...");
    const isPermanentNow = await datingRouter.permanentSplitActivated();
    const maxBps = await datingRouter.maxFounderBps();

    if (!isPermanentNow) {
      throw new Error("Verification failed: permanentSplitActivated is still false");
    }
    if (maxBps !== PERMANENT_CONFIG.maxFounderBps) {
      throw new Error(`Verification failed: maxFounderBps is ${maxBps}, expected ${PERMANENT_CONFIG.maxFounderBps}`);
    }

    const result: ActivationResult = {
      success: true,
      transactionHash: tx.hash,
      maxFounderBps: PERMANENT_CONFIG.maxFounderBps,
      maxFounderPercent: `${PERMANENT_CONFIG.maxFounderBps / 100}%`,
      permanentSplitActivated: true
    };

    // Success summary
    console.log();
    console.log("=".repeat(70));
    console.log("PERMANENT SPLIT ACTIVATED SUCCESSFULLY");
    console.log("=".repeat(70));
    console.log();
    console.log("Permanent Configuration:");
    console.log(`  Maximum Founder Allocation: ${result.maxFounderBps} BPS (${result.maxFounderPercent})`);
    console.log(`  Permanent Split Active: ${result.permanentSplitActivated}`);
    console.log(`  Transaction: ${result.transactionHash}`);
    console.log();
    console.log("This action is now PERMANENT and IRREVERSIBLE.");
    console.log();
    console.log("The founder can NEVER receive more than the specified percentage");
    console.log("of dating app revenue, enforced by the smart contract.");
    console.log();
    console.log("=".repeat(70));
    console.log("Gospel V1.4.1 - Mission Secured");
    console.log("\"Until no kid is in need\"");
    console.log("=".repeat(70));

    return result;

  } catch (error: any) {
    console.error();
    console.error("=".repeat(70));
    console.error("ACTIVATION FAILED");
    console.error("=".repeat(70));
    console.error();
    console.error("Error:", error.message);
    console.error();
    console.error("The permanent split was NOT activated.");
    console.error("Please investigate the error and retry if appropriate.");

    return {
      success: false,
      error: error.message
    };
  }
}

// Execute
main()
  .then((result) => {
    console.log("\nResult:", JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });
