import { ethers } from "hardhat";

async function main() {
  const addr = '0x1512012677fd2dA1Eb9a00DAEff17c56303d9614';
  const DatingRevenueRouter = await ethers.getContractFactory('DatingRevenueRouter');
  const router = DatingRevenueRouter.attach(addr);

  console.log('\n========================================');
  console.log('Checking Existing Proxy');
  console.log('========================================');
  console.log('Proxy Address:', addr);

  try {
    const phase = await router.currentPhase();
    const founder = await router.founderWallet();
    const dao = await router.daoTreasury();
    const charity = await router.charitySafe();
    const split = await router.getCurrentSplit();

    console.log('\n✅ Contract is initialized!');
    console.log('Phase:', ['SURVIVAL', 'TRANSITION', 'PERMANENT'][Number(phase)]);
    console.log('Founder Wallet:', founder);
    console.log('DAO Treasury:', dao);
    console.log('Charity Safe:', charity);
    console.log('Split:', `${split[0]}/${split[1]}/${split[2]} (Founder/DAO/Charity)`);
  } catch (e: any) {
    console.log('\n❌ Contract not initialized or error:', e.message);
  }
}

main().catch(console.error);
