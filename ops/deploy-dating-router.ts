import { ethers, network, upgrades } from "hardhat";

/**
 * Protocol Omega: Deploy DatingRevenueRouter
 * Gospel V1.4.1 SURVIVAL MODE
 *
 * Network: Base Mainnet (chainId 8453)
 * USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
 *
 * Protocol Omega Wallets:
 * - DAO_TREASURY:             0xa87874d5320555c8639670645F1A2B4f82363a7c
 * - DATING_REVENUE_WALLET:    0xbe571f8392c28e2baa9a8b18E73B1D25bcFD0121
 * - CHARITY_REVENUE_WALLET:   0x222aEB4d88fd1963ffa27783d48d22C7b7EcF76B
 * - OPS_WALLET:               0xc043F5D516ee024d1dB812cb81fB64302b0Fe2B4
 *
 * "Until no kid is in need"
 */

function short(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddr = await deployer.getAddress();

  console.log(`\n========================================`);
  console.log(`Protocol Omega: Deploy DatingRevenueRouter`);
  console.log(`Gospel V1.4.1 SURVIVAL MODE`);
  console.log(`========================================\n`);

  console.log(`Network: ${network.name} (chainId: ${network.config.chainId})`);
  console.log(`Deployer: ${short(deployerAddr)}`);

  // Verify we're on Base Mainnet
  if (network.config.chainId !== 8453 && network.name !== "base") {
    console.warn(`\n⚠️  Warning: Not on Base Mainnet (chainId=${network.config.chainId})`);
    console.warn(`   Expected Base Mainnet (8453). Proceeding anyway...\n`);
  }

  // Protocol Omega addresses (hardcoded as per doctrine)
  const FOUNDER_WALLET = "0xbe571f8392c28e2baa9a8b18E73B1D25bcFD0121";
  const DAO_TREASURY = "0xa87874d5320555c8639670645F1A2B4f82363a7c";
  const CHARITY_SAFE = "0x222aEB4d88fd1963ffa27783d48d22C7b7EcF76B";

  console.log(`\nRecipient Addresses:`);
  console.log(`  Founder: ${short(FOUNDER_WALLET)}`);
  console.log(`  DAO:     ${short(DAO_TREASURY)}`);
  console.log(`  Charity: ${short(CHARITY_SAFE)}`);

  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployerAddr);
  console.log(`\nDeployer ETH Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance < ethers.parseEther("0.001")) {
    console.error(`\n❌ Insufficient balance for deployment. Need at least 0.001 ETH.`);
    process.exit(1);
  }

  console.log(`✅ Balance sufficient for deployment.`);

  // Deploy UUPS proxy
  console.log(`\n📦 Deploying DatingRevenueRouter (UUPS Proxy)...`);

  const Factory = await ethers.getContractFactory("DatingRevenueRouter");

  const router = await upgrades.deployProxy(
    Factory,
    [
      FOUNDER_WALLET,   // _founderWallet
      DAO_TREASURY,     // _daoTreasury
      CHARITY_SAFE,     // _charitySafe
      deployerAddr,     // _admin (deployer initially)
      deployerAddr,     // _governor (deployer initially)
    ],
    {
      kind: "uups",
      initializer: "initialize",
    }
  );

  await router.waitForDeployment();

  const proxyAddress = await router.getAddress();
  const implAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log(`\n✅ Deployment Complete!`);
  console.log(`\n========================================`);
  console.log(`CONTRACT ADDRESSES`);
  console.log(`========================================`);
  console.log(`Proxy:          ${proxyAddress}`);
  console.log(`Implementation: ${implAddress}`);
  console.log(`========================================\n`);

  // Verify initial state
  const phase = await router.currentPhase();
  const [pctFounder, pctDao, pctCharity] = await router.getCurrentSplit();

  console.log(`Initial State:`);
  console.log(`  Phase: ${["SURVIVAL", "TRANSITION", "PERMANENT"][Number(phase)]}`);
  console.log(`  Split: ${pctFounder}/${pctDao}/${pctCharity} (Founder/DAO/Charity)`);
  console.log(`  Mode:  100% to Founder (Survival Mode Active)`);

  console.log(`\n========================================`);
  console.log(`NEXT STEPS`);
  console.log(`========================================`);
  console.log(`1. Verify on BaseScan:`);
  console.log(`   npx hardhat verify --network base ${implAddress}`);
  console.log(`\n2. Update base.json with addresses`);
  console.log(`\n3. Transfer admin/governor roles to multisig when ready`);
  console.log(`========================================\n`);

  console.log(`"Until no kid is in need"\n`);

  // Return addresses for scripts
  return {
    proxy: proxyAddress,
    implementation: implAddress,
    network: network.name,
    chainId: network.config.chainId,
  };
}

main()
  .then((result) => {
    console.log(`Deployment result:`, JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error(`\n❌ Deployment failed:`, error);
    process.exit(1);
  });
