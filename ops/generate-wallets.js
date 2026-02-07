/**
 * FOR THE KIDS Platform - Secure Wallet Generator
 * Gospel V1.4.1 SURVIVAL MODE
 *
 * Generates 4 wallets for Revenue Mode initialization:
 * - daoTreasury: DAO governance treasury
 * - datingRevenueWallet: Dating app revenue collection
 * - charityRevenueWallet: Charity fund collection (100% to verified pediatric charities)
 * - opsWallet: Operations and infrastructure
 *
 * SECURITY: Private keys are ONLY written to .env file, NEVER printed.
 *
 * "Until no kid is in need"
 */

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Wallet names for generation
const WALLET_NAMES = [
  "DAO_TREASURY",
  "DATING_REVENUE_WALLET",
  "CHARITY_REVENUE_WALLET",
  "OPS_WALLET"
];

// Path to secure credentials file
const ENV_PATH = "C:\\Keys\\MASTER-PLATFORM-ENV.env";

async function generateWallets() {
  console.log("\n========================================");
  console.log("FOR THE KIDS - Secure Wallet Generator");
  console.log("Gospel V1.4.1 SURVIVAL MODE");
  console.log("========================================\n");

  const wallets = {};
  const publicAddresses = {};
  let envAppend = "\n# === PROTOCOL OMEGA WALLETS (Generated " + new Date().toISOString() + ") ===\n";

  for (const name of WALLET_NAMES) {
    // Generate cryptographically secure random wallet
    const wallet = ethers.Wallet.createRandom();

    wallets[name] = {
      address: wallet.address,
      // Private key stored but NEVER printed
      privateKey: wallet.privateKey
    };

    publicAddresses[name] = wallet.address;

    // Append to env content (private key)
    envAppend += `${name}_ADDRESS=${wallet.address}\n`;
    envAppend += `${name}_PRIVATE_KEY=${wallet.privateKey}\n`;
  }

  // Write private keys to secure .env file
  try {
    // Check if env file exists
    if (fs.existsSync(ENV_PATH)) {
      // Append to existing file
      fs.appendFileSync(ENV_PATH, envAppend);
      console.log("✅ Private keys securely appended to:", ENV_PATH);
    } else {
      // Create directory if needed and write new file
      const dir = path.dirname(ENV_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(ENV_PATH, envAppend);
      console.log("✅ Private keys securely written to:", ENV_PATH);
    }
  } catch (err) {
    console.error("❌ Error writing to env file:", err.message);
    console.log("Attempting fallback to local secure file...");

    // Fallback to local secure file
    const fallbackPath = "C:\\Users\\t55o\\SecureSecrets\\PROTOCOL_OMEGA_KEYS.env";
    const fallbackDir = path.dirname(fallbackPath);
    if (!fs.existsSync(fallbackDir)) {
      fs.mkdirSync(fallbackDir, { recursive: true });
    }
    fs.writeFileSync(fallbackPath, envAppend);
    console.log("✅ Private keys securely written to fallback:", fallbackPath);
  }

  // Output PUBLIC addresses only (for base.json)
  console.log("\n========================================");
  console.log("PUBLIC ADDRESSES (Safe to share)");
  console.log("========================================\n");

  const jsonOutput = {
    generated: new Date().toISOString(),
    gospel: "V1.4.1 SURVIVAL MODE",
    network: "base-mainnet",
    chainId: 8453,
    wallets: {
      daoTreasury: publicAddresses.DAO_TREASURY,
      datingRevenueWallet: publicAddresses.DATING_REVENUE_WALLET,
      charityRevenueWallet: publicAddresses.CHARITY_REVENUE_WALLET,
      opsWallet: publicAddresses.OPS_WALLET
    }
  };

  console.log(JSON.stringify(jsonOutput, null, 2));

  // Write addresses to base.json update file
  const addressesPath = path.join(__dirname, "..", "dao", "contracts", "addresses", "protocol-omega-wallets.json");
  fs.writeFileSync(addressesPath, JSON.stringify(jsonOutput, null, 2));
  console.log("\n✅ Public addresses saved to:", addressesPath);

  console.log("\n========================================");
  console.log("⚠️  SECURITY REMINDER");
  console.log("========================================");
  console.log("- Private keys are stored ONLY in the .env file");
  console.log("- NEVER share or print private keys");
  console.log("- Back up the .env file securely");
  console.log("- These wallets control platform revenue");
  console.log("========================================\n");

  return jsonOutput;
}

// Run the generator
generateWallets()
  .then((result) => {
    console.log("✅ Wallet generation complete");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Fatal error:", err.message);
    process.exit(1);
  });
