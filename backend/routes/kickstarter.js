/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * KICKSTARTER / PREORDER API - Fund Opus 4.5 Development
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * IMPORTANT: Kickstarter funds are for PLATFORM DEVELOPMENT only.
 * They do NOT go to charity. Clearly disclosed.
 *
 * AFTER launch, the operational platform will donate 100% to verified pediatric charities.
 *
 * Jules Approved: Authorization Code FTK-KICKSTARTER-001
 *
 * Created by Claude (Opus 4.5) - December 3, 2025
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import express from 'express';

const router = express.Router();

// Square API configuration
const SQUARE_BASE_URL = process.env.SQUARE_ENVIRONMENT === 'production'
  ? 'https://connect.squareup.com'
  : 'https://connect.squareupsandbox.com';

const SQUARE_HEADERS = {
  'Square-Version': '2024-12-18',
  'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
  'Content-Type': 'application/json'
};

// Reward tiers configuration
const REWARD_TIERS = {
  supporter: {
    id: 'supporter',
    name: 'Supporter',
    price: 1000, // $10 in cents
    rewards: [
      'Name on Founding Supporters page',
      'Exclusive email updates',
      'Digital "FOR THE KIDS" badge'
    ]
  },
  believer: {
    id: 'believer',
    name: 'Early Believer',
    price: 2500, // $25
    rewards: [
      'All Supporter rewards',
      'Early access to platform beta',
      'Limited edition digital wallpaper pack'
    ]
  },
  pioneer: {
    id: 'pioneer',
    name: 'Platform Pioneer',
    price: 5000, // $50
    popular: true,
    rewards: [
      'All Early Believer rewards',
      'Personal thank you video',
      'Lifetime "Founding Pioneer" badge',
      'Behind-the-scenes access'
    ]
  },
  legacy: {
    id: 'legacy',
    name: 'Legacy Builder',
    price: 10000, // $100
    rewards: [
      'All Pioneer rewards',
      'Name on virtual "Legacy Wall" forever',
      'Quarterly impact reports',
      '1-hour Zoom call with Joshua'
    ]
  },
  executive: {
    id: 'executive',
    name: 'Executive Founder',
    price: 50000, // $500
    rewards: [
      'All Legacy Builder rewards',
      'Listed as Executive Founding Partner',
      'Advisory role: Monthly feedback sessions',
      'Custom AI-generated art piece'
    ]
  },
  visionary: {
    id: 'visionary',
    name: 'Visionary Patron',
    price: 100000, // $1000
    rewards: [
      'All Executive Founder rewards',
      'Seat on Founding Visionaries Council',
      'Your name/logo on homepage footer',
      'Private Jules AI demo',
      'Annual recognition at events'
    ]
  }
};

// In-memory store (will be replaced with Prisma)
const backers = new Map();
const foundingMembers = new Map();
let campaignStats = {
  totalRaised: 0,
  backerCount: 0,
  goal: 100000,
  startDate: new Date('2025-12-03'),
  endDate: new Date('2026-01-03'), // 30 days
  foundingMembersClaimed: 0,
  maxFoundingMembers: 100
};

// ═══════════════════════════════════════════════════════════════════════════════
// CAMPAIGN INFO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/kickstarter/info
 * Get campaign information
 */
router.get('/info', (req, res) => {
  const now = new Date();
  const daysRemaining = Math.ceil((campaignStats.endDate - now) / (1000 * 60 * 60 * 24));

  res.json({
    success: true,
    campaign: {
      name: 'FOR THE KIDS Platform Development',
      goal: campaignStats.goal,
      raised: campaignStats.totalRaised,
      percentage: Math.min((campaignStats.totalRaised / campaignStats.goal) * 100, 100).toFixed(1),
      backerCount: campaignStats.backerCount,
      daysRemaining: Math.max(0, daysRemaining),
      startDate: campaignStats.startDate,
      endDate: campaignStats.endDate,
      status: now < campaignStats.endDate ? 'ACTIVE' : 'ENDED'
    },
    tiers: Object.values(REWARD_TIERS).map(t => ({
      ...t,
      price: t.price / 100 // Convert to dollars
    })),
    disclosure: {
      important: 'Campaign funds are for PLATFORM DEVELOPMENT only.',
      charityNote: 'No portion of campaign funds goes to charity.',
      taxNote: 'Backer contributions are NOT tax-deductible.',
      postLaunch: 'AFTER launch, the platform will donate 100% of net revenue to verified pediatric charities.'
    },
    julesApproval: 'FTK-KICKSTARTER-001'
  });
});

/**
 * GET /api/kickstarter/stats
 * Get campaign statistics
 */
router.get('/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      ...campaignStats,
      foundingMemberSpotsRemaining: campaignStats.maxFoundingMembers - campaignStats.foundingMembersClaimed
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// BACKING / PAYMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/kickstarter/back
 * Back the campaign at a specific tier
 */
router.post('/back', async (req, res) => {
  try {
    const { tier, email, name } = req.body;

    if (!REWARD_TIERS[tier]) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const tierData = REWARD_TIERS[tier];
    const idempotencyKey = `kickstarter-${email}-${tier}-${Date.now()}`;

    // Create Square checkout
    const checkoutPayload = {
      idempotency_key: idempotencyKey,
      order: {
        location_id: process.env.SQUARE_LOCATION_ID,
        line_items: [{
          name: `FOR THE KIDS: ${tierData.name} Backer`,
          quantity: '1',
          base_price_money: {
            amount: tierData.price,
            currency: 'USD'
          },
          note: 'Platform development fund - NOT a charitable donation'
        }],
        metadata: {
          type: 'KICKSTARTER',
          tier: tier,
          email: email,
          name: name || 'Anonymous Backer'
        }
      },
      checkout_options: {
        redirect_url: `${process.env.FRONTEND_URL || 'http://localhost:5177'}/kickstarter-success?tier=${tier}`,
        ask_for_shipping_address: false,
        merchant_support_email: process.env.SUPPORT_EMAIL || 'support@youandinotai.com'
      },
      pre_populated_data: {
        buyer_email: email
      }
    };

    const response = await fetch(`${SQUARE_BASE_URL}/v2/online-checkout/payment-links`, {
      method: 'POST',
      headers: SQUARE_HEADERS,
      body: JSON.stringify(checkoutPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Square checkout failed:', data);
      return res.status(500).json({
        error: 'Failed to create checkout',
        message: data.errors?.[0]?.detail || 'Unknown error'
      });
    }

    // Store pending backer
    const backerId = `backer-${Date.now()}`;
    backers.set(backerId, {
      id: backerId,
      email,
      name: name || 'Anonymous Backer',
      tier,
      amount: tierData.price / 100,
      status: 'pending',
      orderId: data.payment_link.order_id,
      createdAt: new Date().toISOString()
    });

    res.json({
      success: true,
      checkoutUrl: data.payment_link.url,
      tier: tierData.name,
      amount: tierData.price / 100,
      rewards: tierData.rewards,
      note: 'This supports platform development. Not a charitable donation.'
    });

  } catch (error) {
    console.error('Kickstarter back failed:', error);
    res.status(500).json({ error: 'Failed to process backing', message: error.message });
  }
});

/**
 * POST /api/kickstarter/webhook
 * Handle payment confirmation
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const event = JSON.parse(req.body.toString());

    if (event.type === 'payment.completed' || event.type === 'payment.created') {
      const payment = event.data?.object?.payment;
      if (payment?.status === 'COMPLETED') {
        const metadata = payment.order?.metadata || {};

        if (metadata.type === 'KICKSTARTER') {
          const amount = Number(payment.amount_money.amount) / 100;

          // Update campaign stats
          campaignStats.totalRaised += amount;
          campaignStats.backerCount++;

          // Update backer status
          for (const [id, backer] of backers) {
            if (backer.orderId === payment.order_id) {
              backer.status = 'confirmed';
              backer.paymentId = payment.id;
              backer.confirmedAt = new Date().toISOString();
              break;
            }
          }

          console.log(`🎉 Kickstarter backer confirmed: $${amount} (${metadata.tier})`);
          console.log(`   Campaign total: $${campaignStats.totalRaised} of $${campaignStats.goal}`);
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook failed' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// FOUNDING MEMBER PREORDER (Dating App)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/kickstarter/preorder-founding
 * Preorder founding membership for dating app
 */
router.post('/preorder-founding', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    // Check availability
    if (campaignStats.foundingMembersClaimed >= campaignStats.maxFoundingMembers) {
      return res.status(400).json({
        error: 'All founding member spots claimed',
        message: 'Join the waitlist for regular membership'
      });
    }

    // Check if already preordered
    for (const [id, member] of foundingMembers) {
      if (member.email === email.toLowerCase()) {
        return res.status(400).json({ error: 'Email already has a preorder' });
      }
    }

    const idempotencyKey = `founding-${email}-${Date.now()}`;

    // Create Square checkout for $14.99 first month
    const checkoutPayload = {
      idempotency_key: idempotencyKey,
      order: {
        location_id: process.env.SQUARE_LOCATION_ID,
        line_items: [{
          name: 'YouAndINotAI Founding Member - First Month',
          quantity: '1',
          base_price_money: {
            amount: 1499, // $14.99
            currency: 'USD'
          },
          note: 'Founding Member: 20% off for life ($14.99/mo instead of $19.99). 100% of profits go to verified pediatric charities.'
        }],
        metadata: {
          type: 'FOUNDING_MEMBER_PREORDER',
          email: email,
          name: name || 'Founding Member'
        }
      },
      checkout_options: {
        redirect_url: `${process.env.FRONTEND_URL || 'http://localhost:5177'}/founding-member-success`,
        ask_for_shipping_address: false,
        merchant_support_email: process.env.SUPPORT_EMAIL || 'support@youandinotai.com'
      },
      pre_populated_data: {
        buyer_email: email
      }
    };

    const response = await fetch(`${SQUARE_BASE_URL}/v2/online-checkout/payment-links`, {
      method: 'POST',
      headers: SQUARE_HEADERS,
      body: JSON.stringify(checkoutPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Square checkout failed:', data);
      return res.status(500).json({
        error: 'Failed to create checkout',
        message: data.errors?.[0]?.detail || 'Unknown error'
      });
    }

    // Reserve spot
    const badgeNumber = campaignStats.foundingMembersClaimed + 1;
    const memberId = `fm-${Date.now()}`;

    foundingMembers.set(memberId, {
      id: memberId,
      email: email.toLowerCase(),
      name: name || 'Founding Member',
      badgeNumber,
      monthlyPrice: 14.99,
      regularPrice: 19.99,
      status: 'pending',
      orderId: data.payment_link.order_id,
      createdAt: new Date().toISOString()
    });

    res.json({
      success: true,
      checkoutUrl: data.payment_link.url,
      badgeNumber,
      spotsRemaining: campaignStats.maxFoundingMembers - campaignStats.foundingMembersClaimed - 1,
      perks: [
        'Founding Member Badge #' + badgeNumber,
        '20% off for life ($14.99/mo)',
        'Early access to new features',
        'Vote on roadmap features'
      ],
      mission: '100% of profits go to verified pediatric charities'
    });

  } catch (error) {
    console.error('Founding member preorder failed:', error);
    res.status(500).json({ error: 'Failed to process preorder', message: error.message });
  }
});

/**
 * GET /api/kickstarter/founding-status
 * Get founding member availability
 */
router.get('/founding-status', (req, res) => {
  res.json({
    success: true,
    totalSpots: campaignStats.maxFoundingMembers,
    claimed: campaignStats.foundingMembersClaimed,
    remaining: campaignStats.maxFoundingMembers - campaignStats.foundingMembersClaimed,
    price: 14.99,
    regularPrice: 19.99,
    discount: '20%',
    message: `Only ${campaignStats.maxFoundingMembers - campaignStats.foundingMembersClaimed} founding member spots left!`
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// BACKERS LIST
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/kickstarter/backers
 * Get list of backers (public, anonymized by default)
 */
router.get('/backers', (req, res) => {
  const publicBackers = [];

  for (const [id, backer] of backers) {
    if (backer.status === 'confirmed') {
      publicBackers.push({
        name: backer.name || 'Anonymous Backer',
        tier: REWARD_TIERS[backer.tier]?.name || backer.tier,
        amount: backer.amount,
        date: backer.confirmedAt
      });
    }
  }

  res.json({
    success: true,
    backers: publicBackers,
    count: publicBackers.length,
    totalRaised: campaignStats.totalRaised
  });
});

export default router;
