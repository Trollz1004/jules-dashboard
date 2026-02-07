/**
 * 🛡️ MISSION SHIELD - DATING PAYMENT DISABLED
 * 
 * REASON: MCC 7273 (Dating Services) = High-Risk = Square TOS Violation Risk
 * ACTION: Dating checkout disabled until PaymentCloud integration complete
 * 
 * WHAT'S PROTECTED:
 * ✅ Merch payments (ai-solutions.store) - ACTIVE
 * ✅ Stripe payments - ACTIVE  
 * ✅ Webhook processing - ACTIVE (for existing transactions)
 * ❌ Dating checkout - DISABLED
 * 
 * DAO Treasury
 * Created: ${new Date().toISOString()}
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { calculateRevenueAllocation, recordTransaction, DAO_REVENUE_CONFIG } from '../services/dao-revenue.js';

const router = express.Router();
const prisma = new PrismaClient();

// Verify Gospel split on route load
// DAO revenue model - no verification needed;

// Square API configuration - GETTER FUNCTIONS
const getSquareBaseUrl = () => process.env.SQUARE_ENVIRONMENT === 'production'
  ? 'https://connect.squareup.com'
  : 'https://connect.squareupsandbox.com';

const getSquareHeaders = () => ({
  'Square-Version': '2024-12-18',
  'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
  'Content-Type': 'application/json'
});

/**
 * 🛡️ MISSION SHIELD: DATING CHECKOUT DISABLED
 * POST /api/subscriptions/create-checkout
 */
router.post('/create-checkout', async (req, res) => {
  console.log('🛡️ MISSION SHIELD: Dating checkout blocked for TOS compliance');
  
  return res.status(503).json({
    success: false,
    status: 'COMPLIANCE_REVIEW',
    message: 'Dating subscriptions temporarily paused for payment compliance review.',
    details: {
      reason: 'Securing compliant high-risk processor (PaymentCloud)',
      eta: '2-3 weeks',
      alternative: 'Visit ai-solutions.store for AI tools and merchandise',
      mission: '100% DAO Treasury
    },
    support: 'support@youandinotai.com',
    daoRevenue: true
  });
});

/**
 * GET /api/subscriptions/status
 * Check subscription status - STILL ACTIVE for existing users
 */
router.get('/status', async (req, res) => {
  const userId = req.query.userId;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  try {
    // Check for existing subscription in database
    const subscription = await prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    if (subscription) {
      return res.json({
        success: true,
        subscription: {
          tier: subscription.tier,
          status: subscription.status,
          expiresAt: subscription.expiresAt,
          daoRevenue: DAO_REVENUE_CONFIG
        }
      });
    }

    return res.json({
      success: true,
      subscription: null,
      message: 'No active subscription found'
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    return res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});


/**
 * POST /api/subscriptions/webhook
 * Square webhook handler - STILL ACTIVE for existing transactions
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  console.log('📥 Square webhook received (Mission Shield active)');
  
  try {
    const signature = req.headers['x-square-hmacsha256-signature'];
    const body = req.body.toString();
    
    // Verify webhook signature if secret is configured
    if (process.env.SQUARE_WEBHOOK_SECRET && signature) {
      const crypto = await import('crypto');
      const expectedSig = crypto
        .createHmac('sha256', process.env.SQUARE_WEBHOOK_SECRET)
        .update(body)
        .digest('base64');
      
      if (signature !== expectedSig) {
        console.warn('⚠️ Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }
    
    const event = JSON.parse(body);
    console.log('📋 Webhook event type:', event.type);
    
    // Process payment completed events
    if (event.type === 'payment.completed') {
      const payment = event.data.object.payment;
      const amountCents = payment.amount_money.amount;
      
      // Calculate Gospel Split
      const split = calculateRevenueAllocation(amountCents);
      
      // Record transaction
      await recordTransaction({
        source: 'SQUARE_DATING_LEGACY',
        paymentId: payment.id,
        amountCents,
        split,
        metadata: {
          missionShield: true,
          note: 'Legacy transaction processed under Mission Shield'
        }
      });
      
      console.log('✅ Legacy payment processed:', {
        paymentId: payment.id,
        total: amountCents,
        charity: allocation.treasury.amount
      });
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * GET /api/subscriptions/plans
 * List available plans - Shows compliance message
 */
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    missionShield: true,
    message: 'Dating subscriptions under compliance review',
    plans: [
      { tier: 'free', price: 0, status: 'AVAILABLE', features: ['Basic profile', 'Limited matches'] },
      { tier: 'premium', price: 1999, status: 'PAUSED', features: ['Unlimited matches', 'Priority support'] },
      { tier: 'vip', price: 4999, status: 'PAUSED', features: ['All Premium features', 'VIP badge', 'Video calls'] }
    ],
    eta: '2-3 weeks for PaymentCloud integration',
    alternative: 'https://ai-solutions.store'
  });
});

/**
 * GET /api/subscriptions/health
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'MISSION_SHIELD_ACTIVE',
    dating: 'DISABLED',
    merch: 'ACTIVE',
    stripe: 'ACTIVE',
    daoRevenue: DAO_REVENUE_CONFIG,
    daoRevenue: true
  });
});

export default router;
