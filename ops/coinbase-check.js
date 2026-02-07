// Credentials loaded from environment variables - see C:\Keys\MASTER-PLATFORM-ENV.env
/**
 * Check Coinbase Account Balance - All API Versions
 * Gospel V1.4.1 SURVIVAL MODE
 */

const crypto = require('crypto');
const https = require('https');

const API_KEY = process.env.CDP_API_KEY_NAME;
const API_SECRET = process.env.CDP_API_KEY_SECRET;

if (!API_KEY || !API_SECRET) {
  throw new Error("Missing CDP credentials - set CDP_API_KEY_NAME and CDP_API_KEY_SECRET env vars");
}
const OPS_WALLET = '0xc043F5D516ee024d1dB812cb81fB64302b0Fe2B4';

function makeRequest(host, path, headers) {
  return new Promise((resolve) => {
    const options = {
      hostname: host,
      port: 443,
      path: path,
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...headers },
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });

    req.on('error', (e) => resolve({ status: 0, data: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, data: 'timeout' }); });
    req.end();
  });
}

async function tryLegacyApi() {
  console.log('\n--- Coinbase Legacy API (v2) ---');
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const path = '/v2/accounts';
  const message = timestamp + 'GET' + path;
  const signature = crypto.createHmac('sha256', API_SECRET).update(message).digest('hex');

  const result = await makeRequest('api.coinbase.com', path, {
    'CB-ACCESS-KEY': API_KEY,
    'CB-ACCESS-SIGN': signature,
    'CB-ACCESS-TIMESTAMP': timestamp,
    'CB-VERSION': '2021-06-23'
  });

  console.log(`Status: ${result.status}`);
  if (result.status === 200 && result.data?.data) {
    const accounts = result.data.data.filter(a => parseFloat(a.balance?.amount || '0') > 0);
    console.log('Accounts with balance:');
    accounts.forEach(a => console.log(`  ${a.name}: ${a.balance.amount} ${a.balance.currency}`));
    return { success: true, accounts };
  }
  console.log('Response:', JSON.stringify(result.data).substring(0, 300));
  return { success: false };
}

async function tryAdvancedTradeApi() {
  console.log('\n--- Advanced Trade API (v3) ---');
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const path = '/api/v3/brokerage/accounts';
  const message = timestamp + 'GET' + path;
  const signature = crypto.createHmac('sha256', API_SECRET).update(message).digest('hex');

  const result = await makeRequest('api.coinbase.com', path, {
    'CB-ACCESS-KEY': API_KEY,
    'CB-ACCESS-SIGN': signature,
    'CB-ACCESS-TIMESTAMP': timestamp,
  });

  console.log(`Status: ${result.status}`);
  if (result.status === 200 && result.data?.accounts) {
    const accounts = result.data.accounts.filter(a => parseFloat(a.available_balance?.value || '0') > 0);
    console.log('Accounts with balance:');
    accounts.forEach(a => console.log(`  ${a.name}: ${a.available_balance.value} ${a.available_balance.currency}`));
    return { success: true, accounts };
  }
  console.log('Response:', JSON.stringify(result.data).substring(0, 300));
  return { success: false };
}

async function main() {
  console.log('='.repeat(55));
  console.log('Coinbase API Balance Check');
  console.log('Gospel V1.4.1 SURVIVAL MODE');
  console.log('='.repeat(55));
  console.log(`\nTarget: ${OPS_WALLET}`);
  console.log(`Need: 0.02 ETH on Base Mainnet\n`);

  const legacy = await tryLegacyApi();
  const advanced = await tryAdvancedTradeApi();

  console.log('\n' + '='.repeat(55));
  if (!legacy.success && !advanced.success) {
    console.log('❌ API key appears to be invalid or expired.');
    console.log('\nThe key format suggests it may be a CDP (Developer Platform) key.');
    console.log('CDP keys require the @coinbase/coinbase-sdk which needs Node < 24.');
    console.log('\nAlternative: Fund the wallet manually:');
    console.log(`  Address: ${OPS_WALLET}`);
    console.log('  Network: Base Mainnet');
    console.log('  Amount: 0.02 ETH (~$6 USD)');
  }
  console.log('='.repeat(55));
}

main().catch(console.error);
