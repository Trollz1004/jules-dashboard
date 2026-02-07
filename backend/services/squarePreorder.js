import { Client, Environment } from 'square';
import crypto from 'crypto';

/**
 * Square Payment Integration for Pre-Orders
 *
 * Products:
 * - Early Bird Premium: $4.99/mo (first charge, then subscription)
 * - Royalty Cards: $1,000 one-time (Ace, King, Queen, Jack)
 *
 * Production Mode - Live Preorders
 * Launch: Valentine's Day 2026
 */

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === 'sandbox'
    ? Environment.Sandbox
    : Environment.Production // Default to production
});

const { paymentsApi, subscriptionsApi, customersApi } = squareClient;

// Product catalog IDs (set these in Square Dashboard)
const CATALOG_IDS = {
  EARLY_BIRD_PLAN: process.env.SQUARE_EARLY_BIRD_PLAN_ID,
  ROYALTY_ACE: process.env.SQUARE_ROYALTY_ACE_ID,
  ROYALTY_KING: process.env.SQUARE_ROYALTY_KING_ID,
  ROYALTY_QUEEN: process.env.SQUARE_ROYALTY_QUEEN_ID,
  ROYALTY_JACK: process.env.SQUARE_ROYALTY_JACK_ID
};

/**
 * Create or get Square customer
 */
export async function getOrCreateCustomer(email, name) {
  try {
    // Search for existing customer
    const searchResponse = await customersApi.searchCustomers({
      query: {
        filter: {
          emailAddress: { exact: email }
        }
      }
    });

    if (searchResponse.result.customers?.length > 0) {
      return searchResponse.result.customers[0];
    }

    // Create new customer
    const createResponse = await customersApi.createCustomer({
      emailAddress: email,
      givenName: name.split(' ')[0],
      familyName: name.split(' ').slice(1).join(' ') || '',
      referenceId: `dating-${Date.now()}`,
      note: 'Pre-order customer - YouAndINotAI DAO'
    });

    return createResponse.result.customer;
  } catch (error) {
    console.error('Square customer error:', error);
    throw error;
  }
}

/**
 * Process Early Bird subscription pre-order
 * $4.99/mo locked for life
 */
export async function processEarlyBirdPreorder(customerId, cardNonce) {
  try {
    const idempotencyKey = crypto.randomUUID();

    // Create subscription
    const response = await subscriptionsApi.createSubscription({
      idempotencyKey,
      locationId: process.env.SQUARE_LOCATION_ID,
      planId: CATALOG_IDS.EARLY_BIRD_PLAN,
      customerId,
      cardId: cardNonce, // From Square Web Payments SDK
      startDate: '2026-02-14', // Valentine's Day launch
      timezone: 'America/New_York',
      source: {
        name: 'Pre-Order Portal'
      }
    });

    return {
      success: true,
      subscriptionId: response.result.subscription.id,
      transactionId: generateTransactionId(),
      startDate: '2026-02-14',
      monthlyAmount: 4.99,
      savings: 'FOR LIFE'
    };
  } catch (error) {
    console.error('Early bird subscription error:', error);
    throw error;
  }
}

/**
 * Process Royalty Card purchase
 * $1,000 one-time payment
 */
export async function processRoyaltyCardPurchase(customerId, cardType, cardNonce) {
  try {
    const idempotencyKey = crypto.randomUUID();

    // Map card type to catalog ID
    const catalogId = CATALOG_IDS[`ROYALTY_${cardType.toUpperCase()}`];
    if (!catalogId) {
      throw new Error(`Invalid card type: ${cardType}`);
    }

    // Process $1,000 payment
    const response = await paymentsApi.createPayment({
      idempotencyKey,
      sourceId: cardNonce,
      amountMoney: {
        amount: 100000, // $1,000.00 in cents
        currency: 'USD'
      },
      customerId,
      locationId: process.env.SQUARE_LOCATION_ID,
      referenceId: `ROYALTY-${cardType.toUpperCase()}-${Date.now()}`,
      note: `Royalty ${cardType} of Hearts - Founder Card - YouAndINotAI DAO`,
      statementDescriptionIdentifier: 'HEARTDAO'
    });

    const payment = response.result.payment;

    return {
      success: true,
      paymentId: payment.id,
      transactionId: generateTransactionId(),
      cardType: cardType.toUpperCase(),
      amount: 1000,
      receiptUrl: payment.receiptUrl,
      status: payment.status
    };
  } catch (error) {
    console.error('Royalty card payment error:', error);
    throw error;
  }
}

/**
 * Generate transaction ID for Joker drawing
 */
function generateTransactionId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `HEART-${timestamp}-${random}`;
}

/**
 * Verify webhook signature from Square
 */
export function verifyWebhookSignature(body, signature) {
  const hmac = crypto.createHmac('sha256', process.env.SQUARE_WEBHOOK_SECRET);
  hmac.update(process.env.SQUARE_WEBHOOK_URL + body);
  const expectedSignature = 'sha256=' + hmac.digest('base64');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Get pre-order checkout page data
 */
export async function getCheckoutData(type, cardType = null) {
  const baseData = {
    applicationId: process.env.SQUARE_APPLICATION_ID,
    locationId: process.env.SQUARE_LOCATION_ID,
    environment: process.env.SQUARE_ENVIRONMENT === 'sandbox' ? 'sandbox' : 'production'
  };

  if (type === 'EARLY_BIRD') {
    return {
      ...baseData,
      productName: 'Early Bird Premium',
      amount: 4.99,
      description: '$5 OFF FOR LIFE - Premium membership',
      benefits: [
        'Locked-in $4.99/mo forever',
        'Premium features on launch',
        'Entry into Joker drawing',
        'Early access badge'
      ]
    };
  }

  if (type === 'ROYALTY') {
    return {
      ...baseData,
      productName: `${cardType} of Hearts`,
      amount: 1000,
      description: 'Royalty Founder Card - 1 of 5 ever',
      benefits: [
        'Unique animated card border',
        'Premium FREE FOR LIFE',
        'Unlimited Super Likes',
        'DAO voting rights',
        'Entry into Joker drawing'
      ]
    };
  }

  throw new Error('Invalid checkout type');
}
