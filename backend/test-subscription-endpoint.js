/**
 * 💙 TEST SUBSCRIPTION ENDPOINT - FOR THE KIDS
 * Tests the /api/subscriptions/create-checkout endpoint
 */

import 'dotenv/config';

const API_BASE = 'http://localhost:3000';

async function testPremiumCheckout() {
  console.log('💎 Testing Premium checkout creation...\n');

  const payload = {
    tier: 'premium',
    userId: 'test-user-123',
    email: 'test@example.com'
  };

  try {
    const response = await fetch(`${API_BASE}/api/subscriptions/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Premium checkout created successfully!');
      console.log('   Checkout URL:', data.checkoutUrl);
      console.log('   Order ID:', data.orderId);
      return true;
    } else {
      console.error('❌ Failed to create checkout:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    console.log('\n⚠️  Make sure the API server is running: npm start');
    return false;
  }
}

async function testVIPCheckout() {
  console.log('\n👑 Testing VIP checkout creation...\n');

  const payload = {
    tier: 'vip',
    userId: 'test-user-456',
    email: 'vip@example.com'
  };

  try {
    const response = await fetch(`${API_BASE}/api/subscriptions/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ VIP checkout created successfully!');
      console.log('   Checkout URL:', data.checkoutUrl);
      console.log('   Order ID:', data.orderId);
      return true;
    } else {
      console.error('❌ Failed to create checkout:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return false;
  }
}

async function testSubscriptionStatus() {
  console.log('\n📊 Testing subscription status endpoint...\n');

  try {
    const response = await fetch(`${API_BASE}/api/subscriptions/status/test-user-123`);
    const data = await response.json();

    if (response.ok) {
      console.log('✅ Status check successful!');
      console.log('   Tier:', data.tier);
      console.log('   Active:', data.active);
      console.log('   Features:', data.features?.join(', '));
      return true;
    } else {
      console.error('❌ Status check failed:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('💙 FOR THE KIDS - Testing Subscription Endpoints\n');
  console.log('---\n');

  const premiumOk = await testPremiumCheckout();
  const vipOk = await testVIPCheckout();
  const statusOk = await testSubscriptionStatus();

  console.log('\n---\n');
  console.log('🎯 TEST RESULTS:');
  console.log(`   Premium Checkout: ${premiumOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   VIP Checkout: ${vipOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Status Check: ${statusOk ? '✅ PASS' : '❌ FAIL'}`);

  if (premiumOk && vipOk && statusOk) {
    console.log('\n🎉 ALL TESTS PASSED! Payment system ready for launch!\n');
    console.log('💙 FOR THE KIDS!\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Check the API server logs.\n');
    process.exit(1);
  }
}

main();
