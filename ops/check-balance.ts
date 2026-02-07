import { ethers } from "hardhat";

async function main() {
  const signers = await ethers.getSigners();

  if (signers.length === 0) {
    console.log("❌ No signers available. Check DEPLOYER_PRIVATE_KEY or OPS_WALLET_PRIVATE_KEY in env.");
    process.exit(1);
  }

  const deployer = signers[0];
  const addr = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(addr);

  console.log(`\nDeployer: ${addr}`);
  console.log(`Balance:  ${ethers.formatEther(balance)} ETH`);

  if (balance < ethers.parseEther("0.01")) {
    console.log(`\n⚠️  Warning: Balance is low. Need at least 0.01 ETH for deployment.`);
  } else {
    console.log(`\n✅ Balance sufficient for deployment.`);
  }
}

main().catch(console.error);
