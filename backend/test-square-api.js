/**
 * 💙 TEST SQUARE API ACCESS - FOR THE KIDS
 * Quick test to verify Square API credentials work
 */

import 'dotenv/config';

const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID;
const SQUARE_ENVIRONMENT = process.env.SQUARE_ENVIRONMENT;

const BASE_URL = SQUARE_ENVIRONMENT === 'production'
  ? 'https://connect.squareup.com'
  : 'https://connect.squareupsandbox.com';

console.log('💙 FOR THE KIDS - Testing Square API\n');
console.log('Environment:', SQUARE_ENVIRONMENT);
console.log('Base URL:', BASE_URL);
console.log('Location ID:', SQUARE_LOCATION_ID);
console.log('\n---\n');

async function testLocationAccess() {
  console.log('📍 Testing location access...');

  const response = await fetch(`${BASE_URL}/v2/locations/${SQUARE_LOCATION_ID}`, {
    method: 'GET',
    headers: {
      'Square-Version': '2024-12-18',
      'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();

  if (response.ok) {
    console.log('✅ Location access verified!');
    console.log('   Name:', data.location.name);
    console.log('   Status:', data.location.status);
    console.log('   Country:', data.location.country);
  } else {
    console.error('❌ Location access failed:', data);
  }

  return response.ok;
}

async function listCatalogPlans() {
  console.log('\n📋 Listing existing subscription plans...');

  const response = await fetch(`${BASE_URL}/v2/catalog/list?types=SUBSCRIPTION_PLAN`, {
    method: 'GET',
    headers: {
      'Square-Version': '2024-12-18',
      'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();

  if (response.ok) {
    const plans = data.objects || [];
    console.log(`✅ Found ${plans.length} subscription plan(s)`);
    plans.forEach(plan => {
      const price = plan.subscription_plan_data?.phases?.[0]?.pricing?.price_money?.amount;
      console.log(`   - ${plan.subscription_plan_data?.name} (${plan.id}): $${price ? price / 100 : '??'}/mo`);
    });
    return plans;
  } else {
    console.error('❌ Failed to list catalog:', data);
    return [];
  }
}

async function createPremiumPlan() {
  console.log('\n💎 Creating Premium Plan ($19.99/mo)...');

  const idempotencyKey = `premium-plan-${Date.now()}`;

  const response = await fetch(`${BASE_URL}/v2/catalog/object`, {
    method: 'POST',
    headers: {
      'Square-Version': '2024-12-18',
      'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      idempotency_key: idempotencyKey,
      object: {
        type: 'SUBSCRIPTION_PLAN',
        id: '#premium-plan',
        subscription_plan_data: {
          name: 'YouAndINotAI Premium',
          phases: [{
            cadence: 'MONTHLY',
            periods: 1,
            ordinal: 0,
            pricing: {
              type: 'STATIC',
              price_money: {
                amount: 1999, // $19.99 in cents
                currency: 'USD'
              }
            }
          }]
        }
      }
    })
  });

  const data = await response.json();

  if (response.ok) {
    console.log('✅ Premium Plan created!');
    console.log('   ID:', data.catalog_object.id);
    return data.catalog_object.id;
  } else {
    console.error('❌ Failed to create Premium Plan:', data);
    return null;
  }
}

async function createVIPPlan() {
  console.log('\n👑 Creating VIP Plan ($49.99/mo)...');

  const idempotencyKey = `vip-plan-${Date.now()}`;

  const response = await fetch(`${BASE_URL}/v2/catalog/object`, {
    method: 'POST',
    headers: {
      'Square-Version': '2024-12-18',
      'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      idempotency_key: idempotencyKey,
      object: {
        type: 'SUBSCRIPTION_PLAN',
        id: '#vip-plan',
        subscription_plan_data: {
          name: 'YouAndINotAI VIP',
          phases: [{
            cadence: 'MONTHLY',
            periods: 1,
            ordinal: 0,
            pricing: {
              type: 'STATIC',
              price_money: {
                amount: 4999, // $49.99 in cents
                currency: 'USD'
              }
            }
          }]
        }
      }
    })
  });

  const data = await response.json();

  if (response.ok) {
    console.log('✅ VIP Plan created!');
    console.log('   ID:', data.catalog_object.id);
    return data.catalog_object.id;
  } else {
    console.error('❌ Failed to create VIP Plan:', data);
    return null;
  }
}

async function main() {
  try {
    // Test location access
    const locationOk = await testLocationAccess();
    if (!locationOk) {
      throw new Error('Location access failed - check your credentials');
    }

    // List existing plans
    const existingPlans = await listCatalogPlans();

    const hasPremium = existingPlans.some(p => p.subscription_plan_data?.name?.includes('Premium'));
    const hasVIP = existingPlans.some(p => p.subscription_plan_data?.name?.includes('VIP'));

    let premiumId, vipId;

    // Create plans if they don't exist
    if (!hasPremium) {
      premiumId = await createPremiumPlan();
    } else {
      premiumId = existingPlans.find(p => p.subscription_plan_data?.name?.includes('Premium')).id;
      console.log('\n✅ Premium Plan already exists:', premiumId);
    }

    if (!hasVIP) {
      vipId = await createVIPPlan();
    } else {
      vipId = existingPlans.find(p => p.subscription_plan_data?.name?.includes('VIP')).id;
      console.log('\n✅ VIP Plan already exists:', vipId);
    }

    console.log('\n---\n');
    console.log('🎉 SQUARE API TEST COMPLETE!\n');
    console.log('Plan IDs to add to .env:');
    console.log(`SQUARE_PREMIUM_PLAN_ID=${premiumId}`);
    console.log(`SQUARE_VIP_PLAN_ID=${vipId}`);
    console.log('\n💙 FOR THE KIDS!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();
