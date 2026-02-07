/**
 * 💙 SQUARE SUBSCRIPTION SETUP AUTOMATION - FOR THE KIDS
 *
 * This script automatically:
 * 1. Creates Premium ($19.99/mo) and VIP ($49.99/mo) subscription plans in Square
 * 2. Configures webhook endpoints for payment events
 * 3. Updates .env files with the plan IDs
 * 4. Verifies the setup
 *
 * Run: node api/setup-square-subscriptions.js
 */

import pkg from 'square';
const { Client, Environment } = pkg;
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Square client
const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === 'production'
    ? Environment.Production
    : Environment.Sandbox
});

console.log('💙 FOR THE KIDS - Square Subscription Setup\n');
console.log('Environment:', process.env.SQUARE_ENVIRONMENT);
console.log('Location ID:', process.env.SQUARE_LOCATION_ID);
console.log('\n---\n');

async function createSubscriptionPlans() {
  console.log('📋 Creating subscription plans in Square...\n');

  try {
    // Create Premium Plan ($19.99/month)
    console.log('Creating Premium Plan ($19.99/month)...');
    const premiumPlan = await squareClient.catalogApi.upsertCatalogObject({
      idempotencyKey: `premium-plan-${Date.now()}`,
      object: {
        type: 'SUBSCRIPTION_PLAN',
        id: '#premium-plan',
        subscriptionPlanData: {
          name: 'YouAndINotAI Premium',
          phases: [{
            cadence: 'MONTHLY',
            recurringPriceMoney: {
              amount: 1999n, // $19.99 in cents
              currency: 'USD'
            },
            ordinal: 0n
          }]
        }
      }
    });

    const premiumPlanId = premiumPlan.result.catalogObject.id;
    console.log('✅ Premium Plan created:', premiumPlanId);

    // Create VIP Plan ($49.99/month)
    console.log('\nCreating VIP Plan ($49.99/month)...');
    const vipPlan = await squareClient.catalogApi.upsertCatalogObject({
      idempotencyKey: `vip-plan-${Date.now()}`,
      object: {
        type: 'SUBSCRIPTION_PLAN',
        id: '#vip-plan',
        subscriptionPlanData: {
          name: 'YouAndINotAI VIP',
          phases: [{
            cadence: 'MONTHLY',
            recurringPriceMoney: {
              amount: 4999n, // $49.99 in cents
              currency: 'USD'
            },
            ordinal: 0n
          }]
        }
      }
    });

    const vipPlanId = vipPlan.result.catalogObject.id;
    console.log('✅ VIP Plan created:', vipPlanId);

    console.log('\n---\n');
    return { premiumPlanId, vipPlanId };

  } catch (error) {
    console.error('❌ Failed to create subscription plans:', error);

    // Check if plans already exist
    console.log('\n🔍 Checking for existing plans...');
    try {
      const catalog = await squareClient.catalogApi.listCatalog(undefined, 'SUBSCRIPTION_PLAN');
      const existingPlans = catalog.result.objects || [];

      const premiumPlan = existingPlans.find(p => p.subscriptionPlanData?.name?.includes('Premium'));
      const vipPlan = existingPlans.find(p => p.subscriptionPlanData?.name?.includes('VIP'));

      if (premiumPlan && vipPlan) {
        console.log('✅ Found existing plans:');
        console.log('   Premium:', premiumPlan.id);
        console.log('   VIP:', vipPlan.id);
        return {
          premiumPlanId: premiumPlan.id,
          vipPlanId: vipPlan.id
        };
      } else {
        throw new Error('Could not create or find subscription plans');
      }
    } catch (catalogError) {
      console.error('❌ Failed to list existing plans:', catalogError);
      throw catalogError;
    }
  }
}

async function configureWebhooks(apiBaseUrl) {
  console.log('🔔 Configuring Square webhooks...\n');

  const webhookUrl = `${apiBaseUrl}/api/subscriptions/webhook`;
  console.log('Webhook URL:', webhookUrl);

  try {
    // List existing webhooks
    const existingWebhooks = await squareClient.webhookSubscriptionsApi.listWebhookSubscriptions();

    const existingSubscription = existingWebhooks.result.subscriptions?.find(
      sub => sub.notificationUrl === webhookUrl
    );

    if (existingSubscription) {
      console.log('✅ Webhook already configured:', existingSubscription.id);
      console.log('   Events:', existingSubscription.eventTypes?.join(', '));
      return existingSubscription;
    }

    // Create new webhook subscription
    const webhook = await squareClient.webhookSubscriptionsApi.createWebhookSubscription({
      subscription: {
        name: 'YouAndINotAI Payment Events',
        notificationUrl: webhookUrl,
        eventTypes: [
          'payment.created',
          'payment.updated',
          'invoice.payment_made',
          'subscription.created',
          'subscription.updated'
        ],
        enabled: true
      }
    });

    console.log('✅ Webhook created:', webhook.result.subscription.id);
    console.log('   Signature Key:', webhook.result.subscription.signatureKey);
    console.log('\n⚠️  IMPORTANT: Save this signature key to your .env as SQUARE_WEBHOOK_SECRET');

    return webhook.result.subscription;

  } catch (error) {
    console.error('❌ Failed to configure webhooks:', error);
    console.log('\n📝 Manual webhook setup required:');
    console.log('   1. Go to: https://developer.squareup.com/dashboard');
    console.log('   2. Navigate to: Webhooks');
    console.log(`   3. Create webhook with URL: ${webhookUrl}`);
    console.log('   4. Subscribe to: payment.created, payment.updated, invoice.payment_made, subscription.created, subscription.updated');
    return null;
  }
}

function updateEnvFile(planIds, webhookSecret) {
  console.log('\n📝 Updating .env files...\n');

  const envPaths = [
    path.join(__dirname, '.env'),
    path.join(__dirname, '..', '.env')
  ];

  for (const envPath of envPaths) {
    if (!fs.existsSync(envPath)) {
      console.log(`⏭️  Skipping ${envPath} (does not exist)`);
      continue;
    }

    let envContent = fs.readFileSync(envPath, 'utf8');

    // Add or update subscription plan IDs
    const planIdLines = `
# Square Subscription Plans (Generated: ${new Date().toISOString()})
SQUARE_PREMIUM_PLAN_ID=${planIds.premiumPlanId}
SQUARE_VIP_PLAN_ID=${planIds.vipPlanId}`;

    if (envContent.includes('SQUARE_PREMIUM_PLAN_ID')) {
      // Update existing
      envContent = envContent.replace(
        /SQUARE_PREMIUM_PLAN_ID=.*/,
        `SQUARE_PREMIUM_PLAN_ID=${planIds.premiumPlanId}`
      );
      envContent = envContent.replace(
        /SQUARE_VIP_PLAN_ID=.*/,
        `SQUARE_VIP_PLAN_ID=${planIds.vipPlanId}`
      );
    } else {
      // Add new
      envContent += planIdLines;
    }

    // Add webhook secret if provided
    if (webhookSecret) {
      if (envContent.includes('SQUARE_WEBHOOK_SECRET')) {
        envContent = envContent.replace(
          /SQUARE_WEBHOOK_SECRET=.*/,
          `SQUARE_WEBHOOK_SECRET=${webhookSecret}`
        );
      } else {
        envContent += `\nSQUARE_WEBHOOK_SECRET=${webhookSecret}`;
      }
    }

    // Add frontend URL if not present
    if (!envContent.includes('FRONTEND_URL')) {
      envContent += `\nFRONTEND_URL=https://youandinotai.com`;
    }

    // Add support email if not present
    if (!envContent.includes('SUPPORT_EMAIL')) {
      envContent += `\nSUPPORT_EMAIL=support@youandinotai.com`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Updated ${envPath}`);
  }

  console.log('\n---\n');
}

async function verifySetup() {
  console.log('🔍 Verifying Square setup...\n');

  try {
    // Verify location
    const location = await squareClient.locationsApi.retrieveLocation(process.env.SQUARE_LOCATION_ID);
    console.log('✅ Location verified:', location.result.location.name);

    // List catalog items to verify plans exist
    const catalog = await squareClient.catalogApi.listCatalog(undefined, 'SUBSCRIPTION_PLAN');
    const plans = catalog.result.objects || [];
    console.log(`✅ Subscription plans in catalog: ${plans.length}`);

    plans.forEach(plan => {
      const price = plan.subscriptionPlanData?.phases?.[0]?.recurringPriceMoney?.amount;
      console.log(`   - ${plan.subscriptionPlanData?.name} ($${Number(price) / 100}/mo)`);
    });

    // List webhooks
    const webhooks = await squareClient.webhookSubscriptionsApi.listWebhookSubscriptions();
    console.log(`\n✅ Active webhooks: ${webhooks.result.subscriptions?.length || 0}`);

    webhooks.result.subscriptions?.forEach(webhook => {
      console.log(`   - ${webhook.name} (${webhook.enabled ? 'enabled' : 'disabled'})`);
    });

    console.log('\n✅ Square setup verified!\n');
    return true;

  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  }
}

async function main() {
  try {
    // Step 1: Create subscription plans
    const planIds = await createSubscriptionPlans();

    // Step 2: Configure webhooks
    const apiBaseUrl = process.env.FRONTEND_URL || 'https://youandinotai.com';
    const webhook = await configureWebhooks(apiBaseUrl);

    // Step 3: Update .env files
    updateEnvFile(planIds, webhook?.signatureKey);

    // Step 4: Verify setup
    await verifySetup();

    console.log('🎉 SQUARE SETUP COMPLETE!\n');
    console.log('Next steps:');
    console.log('1. Run database migration: cd api && npx prisma migrate dev --name add_subscriptions');
    console.log('2. Restart your API server to load new .env variables');
    console.log('3. Test checkout creation: curl -X POST http://localhost:3000/api/subscriptions/create-checkout -H "Content-Type: application/json" -d \'{"tier":"premium","userId":"test-123","email":"test@example.com"}\'');
    console.log('\n💙 FOR THE KIDS!\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    console.log('\nPlease check:');
    console.log('1. SQUARE_ACCESS_TOKEN is valid and has subscription permissions');
    console.log('2. SQUARE_LOCATION_ID is correct');
    console.log('3. You are running in the correct environment (sandbox vs production)');
    process.exit(1);
  }
}

// Run the setup
main();
