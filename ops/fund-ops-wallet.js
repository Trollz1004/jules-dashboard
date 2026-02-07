// Credentials loaded from environment variables - see C:\Keys\MASTER-PLATFORM-ENV.env
/**
 * Fund OPS_WALLET via Coinbase API
 * Gospel V1.4.1 SURVIVAL MODE
 */

const crypto = require('crypto');
const https = require('https');

// Coinbase API credentials from environment
const API_KEY = process.env.CDP_API_KEY_NAME;
const API_SECRET = process.env.CDP_API_KEY_SECRET;

if (!API_KEY || !API_SECRET) {
  throw new Error("Missing CDP credentials - set CDP_API_KEY_NAME and CDP_API_KEY_SECRET env vars");
}

// Target wallet
const OPS_WALLET = '0xc043F5D516ee024d1dB812cb81fB64302b0Fe2B4';
const AMOUNT_ETH = '0.02'; // Amount to send

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const bodyStr = body ? JSON.stringify(body) : '';

    // Create signature (CB-ACCESS-SIGN)
    const message = timestamp + method + path + bodyStr;
    const signature = crypto
      .createHmac('sha256', API_SECRET)
      .update(message)
      .digest('hex');

    const options = {
      hostname: 'api.coinbase.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'CB-ACCESS-KEY': API_KEY,
        'CB-ACCESS-SIGN': signature,
        'CB-ACCESS-TIMESTAMP': timestamp,
        'CB-VERSION': '2023-01-01',
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(bodyStr);
    req.end();
  });
}

async function main() {
  console.log('='.repeat(50));
  console.log('Coinbase API - Fund OPS_WALLET');
  console.log('Gospel V1.4.1 SURVIVAL MODE');
  console.log('='.repeat(50));
  console.log(`\nTarget: ${OPS_WALLET}`);
  console.log(`Amount: ${AMOUNT_ETH} ETH on Base\n`);

  // Step 1: Get user info
  console.log('1. Checking API connection...');
  const userRes = await makeRequest('GET', '/v2/user');
  if (userRes.status !== 200) {
    console.log('API Error:', userRes.data);
    return;
  }
  console.log(`   Connected as: ${userRes.data.data?.name || 'Unknown'}`);

  // Step 2: List accounts to find ETH
  console.log('\n2. Listing accounts...');
  const accountsRes = await makeRequest('GET', '/v2/accounts?limit=100');
  if (accountsRes.status !== 200) {
    console.log('Error listing accounts:', accountsRes.data);
    return;
  }

  const accounts = accountsRes.data.data || [];
  console.log(`   Found ${accounts.length} accounts\n`);

  // Find ETH accounts
  const ethAccounts = accounts.filter(a =>
    a.currency === 'ETH' ||
    a.currency?.code === 'ETH' ||
    a.balance?.currency === 'ETH'
  );

  console.log('ETH Accounts:');
  for (const acc of ethAccounts) {
    const balance = acc.balance?.amount || acc.native_balance?.amount || '0';
    const currency = acc.balance?.currency || acc.currency || 'ETH';
    console.log(`   - ${acc.name}: ${balance} ${currency} (ID: ${acc.id})`);
  }

  // Show all accounts with balances > 0
  console.log('\nAll accounts with balance:');
  for (const acc of accounts) {
    const balance = parseFloat(acc.balance?.amount || '0');
    if (balance > 0) {
      console.log(`   - ${acc.name}: ${acc.balance?.amount} ${acc.balance?.currency}`);
    }
  }

  // Step 3: Check if we have enough ETH
  const mainEth = ethAccounts.find(a => parseFloat(a.balance?.amount || '0') > 0);
  if (!mainEth) {
    console.log('\n❌ No ETH balance found in Coinbase account.');
    console.log('   You need to deposit or buy ETH first.');
    return;
  }

  const availableEth = parseFloat(mainEth.balance?.amount || '0');
  console.log(`\n3. Available ETH: ${availableEth}`);

  if (availableEth < parseFloat(AMOUNT_ETH)) {
    console.log(`   ❌ Insufficient balance. Need ${AMOUNT_ETH} ETH.`);
    console.log(`   Available: ${availableEth} ETH`);
    console.log(`   Shortfall: ${(parseFloat(AMOUNT_ETH) - availableEth).toFixed(6)} ETH`);
    return;
  }

  console.log(`   ✅ Sufficient balance for transfer`);

  // Step 4: Send ETH to OPS_WALLET
  console.log('\n4. Initiating transfer...');
  const sendBody = {
    type: 'send',
    to: OPS_WALLET,
    amount: AMOUNT_ETH,
    currency: 'ETH',
    network: 'base', // Base network
    description: 'Protocol Omega - OPS_WALLET funding'
  };

  const sendRes = await makeRequest('POST', `/v2/accounts/${mainEth.id}/transactions`, sendBody);

  if (sendRes.status === 201 || sendRes.status === 200) {
    console.log('   ✅ Transfer initiated!');
    console.log('   Transaction:', sendRes.data);
  } else {
    console.log('   Transfer response:', JSON.stringify(sendRes.data, null, 2));

    // Check if 2FA is required
    if (sendRes.data?.errors?.[0]?.id === 'two_factor_required') {
      console.log('\n⚠️  Two-factor authentication required.');
      console.log('   This API may require manual approval in Coinbase app.');
    }
  }
}

main().catch(console.error);
