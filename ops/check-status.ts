import { ethers } from "hardhat";

/**
 * FOR THE KIDS Platform - Contract Status Check
 * Gospel V1.4.1 SURVIVAL MODE
 *
 * Checks the current state of deployed contracts
 *
 * "Until no kid is in need"
 */

// Update these addresses after deployment
const CONTRACTS = {
  charityRouter: process.env.CHARITY_ROUTER_ADDRESS || "",
  datingRouter: process.env.DATING_ROUTER_PROXY_ADDRESS || "",
};

async function main() {
  console.log("=".repeat(60));
  console.log("FOR THE KIDS Platform - Contract Status");
  console.log("Gospel V1.4.1 SURVIVAL MODE");
  console.log("=".repeat(60));
  console.log();

  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId);
  console.log();

  // ========== CharityRouter100 Status ==========
  if (CONTRACTS.charityRouter) {
    console.log("-".repeat(60));
    console.log("CharityRouter100");
    console.log("-".repeat(60));

    const charityRouter = await ethers.getContractAt(
      "CharityRouter100",
      CONTRACTS.charityRouter
    );

    const charitySafe = await charityRouter.CHARITY_SAFE();
    const pendingUSDC = await charityRouter.pendingUSDC();
    const pendingETH = await charityRouter.pendingETH();

    console.log("  Address:", CONTRACTS.charityRouter);
    console.log("  Charity Safe:", charitySafe);
    console.log("  Pending USDC:", ethers.formatUnits(pendingUSDC, 6));
    console.log("  Pending ETH:", ethers.formatEther(pendingETH));
    console.log();
  }

  // ========== DatingRevenueRouter Status ==========
  if (CONTRACTS.datingRouter) {
    console.log("-".repeat(60));
    console.log("DatingRevenueRouter");
    console.log("-".repeat(60));

    const datingRouter = await ethers.getContractAt(
      "DatingRevenueRouter",
      CONTRACTS.datingRouter
    );

    const phase = await datingRouter.currentPhase();
    const phaseNames = ["SURVIVAL", "TRANSITION", "PERMANENT"];
    const [pctFounder, pctDao, pctCharity] = await datingRouter.getCurrentSplit();
    const founderWallet = await datingRouter.founderWallet();
    const daoTreasury = await datingRouter.daoTreasury();
    const charitySafe = await datingRouter.charitySafe();
    const pendingUSDC = await datingRouter.pendingUSDC();
    const pendingETH = await datingRouter.pendingETH();

    console.log("  Address:", CONTRACTS.datingRouter);
    console.log("  Phase:", phaseNames[Number(phase)], `(${phase})`);
    console.log();
    console.log("  Wallets:");
    console.log("    Founder:", founderWallet);
    console.log("    DAO:", daoTreasury);
    console.log("    Charity:", charitySafe);
    console.log();
    console.log("  Current Split:");
    console.log("    Founder:", Number(pctFounder) / 100, "%");
    console.log("    DAO:", Number(pctDao) / 100, "%");
    console.log("    Charity:", Number(pctCharity) / 100, "%");
    console.log();
    console.log("  Pending Balances:");
    console.log("    USDC:", ethers.formatUnits(pendingUSDC, 6));
    console.log("    ETH:", ethers.formatEther(pendingETH));

    // Check for scheduled split
    const scheduled = await datingRouter.getScheduledSplit();
    if (scheduled.isScheduled) {
      console.log();
      console.log("  SCHEDULED SPLIT:");
      console.log("    Founder:", Number(scheduled.founder) / 100, "%");
      console.log("    DAO:", Number(scheduled.dao) / 100, "%");
      console.log("    Charity:", Number(scheduled.charity) / 100, "%");
      console.log("    Effective:", new Date(Number(scheduled.effectiveTime) * 1000).toISOString());
    }
    console.log();
  }

  console.log("=".repeat(60));
  console.log('"Until no kid is in need"');
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
