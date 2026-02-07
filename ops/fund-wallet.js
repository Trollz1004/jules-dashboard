// Credentials loaded from environment variables - see C:\Keys\MASTER-PLATFORM-ENV.env
/**
 * Fund OPS_WALLET using Coinbase CDP SDK
 * Protocol Omega - Gospel V1.4.1 SURVIVAL MODE
 */

const { Coinbase, Wallet } = require("@coinbase/coinbase-sdk");

// Coinbase CDP API credentials from environment
const CDP_API_KEY_NAME = process.env.CDP_API_KEY_NAME;
const CDP_API_KEY_SECRET = process.env.CDP_API_KEY_SECRET;

if (!CDP_API_KEY_NAME || !CDP_API_KEY_SECRET) {
  throw new Error("Missing CDP credentials - set CDP_API_KEY_NAME and CDP_API_KEY_SECRET env vars");
}

// Target wallet to fund
const OPS_WALLET = "0xc043F5D516ee024d1dB812cb81fB64302b0Fe2B4";

async function main() {
  console.log("\n========================================");
  console.log("Protocol Omega: Fund OPS_WALLET");
  console.log("Gospel V1.4.1 SURVIVAL MODE");
  console.log("========================================\n");

  try {
    // Initialize Coinbase SDK
    const coinbase = new Coinbase({
      apiKeyName: CDP_API_KEY_NAME,
      privateKey: CDP_API_KEY_SECRET,
    });

    console.log("✅ Coinbase SDK initialized");

    // Try to get or create a wallet
    console.log("\nChecking for existing wallets...");

    // List existing wallets
    const wallets = await Wallet.listWallets();
    console.log(`Found ${wallets.length} existing wallet(s)`);

    let wallet;
    if (wallets.length > 0) {
      wallet = wallets[0];
      console.log(`Using existing wallet: ${await wallet.getDefaultAddress()}`);
    } else {
      // Create a new wallet on Base
      console.log("Creating new wallet on Base...");
      wallet = await Wallet.create({ networkId: "base-mainnet" });
      console.log(`Created wallet: ${await wallet.getDefaultAddress()}`);
    }

    // Check wallet balance
    const balance = await wallet.getBalance("eth");
    console.log(`Wallet ETH balance: ${balance}`);

    if (parseFloat(balance) > 0.01) {
      // Transfer to OPS_WALLET
      console.log(`\nTransferring 0.02 ETH to OPS_WALLET: ${OPS_WALLET}`);
      const transfer = await wallet.createTransfer({
        amount: 0.02,
        assetId: "eth",
        destination: OPS_WALLET,
      });

      await transfer.wait();
      console.log(`✅ Transfer complete! TX: ${transfer.getTransactionHash()}`);
    } else {
      console.log("\n⚠️  Wallet has insufficient balance.");
      console.log("Options:");
      console.log("1. Fund this Coinbase wallet first");
      console.log("2. Use faucet (testnet only)");
      console.log(`3. Manual transfer to: ${OPS_WALLET}`);
    }

  } catch (error) {
    console.error("\n❌ Error:", error.message);

    if (error.message.includes("authentication") || error.message.includes("API")) {
      console.log("\nThe API key may be invalid or expired.");
      console.log("Please check your Coinbase Developer Platform credentials.");
    }
  }
}

main().catch(console.error);
