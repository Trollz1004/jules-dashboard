// Credentials loaded from environment variables - see C:\Keys\MASTER-PLATFORM-ENV.env
/**
 * Check Coinbase CDP Wallet Balance via REST API
 * Protocol Omega - Gospel V1.4.1 SURVIVAL MODE
 */

const crypto = require("crypto");
const https = require("https");

// Coinbase CDP API credentials from environment
const CDP_API_KEY_NAME = process.env.CDP_API_KEY_NAME;
const CDP_API_KEY_SECRET = process.env.CDP_API_KEY_SECRET;

if (!CDP_API_KEY_NAME || !CDP_API_KEY_SECRET) {
  throw new Error("Missing CDP credentials - set CDP_API_KEY_NAME and CDP_API_KEY_SECRET env vars");
}

// Target wallet
const OPS_WALLET = "0xc043F5D516ee024d1dB812cb81fB64302b0Fe2B4";

function generateSignature(timestamp, method, path, body = "") {
  const message = timestamp + method + path + body;
  return crypto
    .createHmac("sha256", CDP_API_KEY_SECRET)
    .update(message)
    .digest("hex");
}

async function makeRequest(method, path, body = null) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = generateSignature(timestamp, method, path, body ? JSON.stringify(body) : "");

  const options = {
    hostname: "api.cdp.coinbase.com",
    port: 443,
    path: path,
    method: method,
    headers: {
      "Content-Type": "application/json",
      "CB-ACCESS-KEY": CDP_API_KEY_NAME,
      "CB-ACCESS-SIGN": signature,
      "CB-ACCESS-TIMESTAMP": timestamp,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log("\n========================================");
  console.log("Protocol Omega: Check CDP Wallet");
  console.log("========================================\n");

  try {
    // Try to list wallets
    console.log("Checking CDP API connection...");
    const result = await makeRequest("GET", "/v1/wallets");

    console.log(`Status: ${result.status}`);
    console.log(`Response:`, JSON.stringify(result.data, null, 2));

    if (result.status === 200 && result.data.wallets) {
      console.log(`\nFound ${result.data.wallets.length} wallet(s)`);
      for (const wallet of result.data.wallets) {
        console.log(`  - ${wallet.id}: ${wallet.network_id}`);
      }
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main();
