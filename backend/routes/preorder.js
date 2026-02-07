import express from 'express';
import { PreOrderService, daoService } from '../services/daoService.js';
import { prisma } from '../lib/prisma.js';

const router = express.Router();
const preOrderService = new PreOrderService(prisma);

/**
 * Pre-Order Routes for Royalty Deck of Hearts
 *
 * FOR THE KIDS! 💛
 */

/**
 * GET /api/preorder/stats
 * Get current pre-order statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await preOrderService.getPreOrderStats();
    const remainingCards = await daoService.getRemainingCards();

    res.json({
      success: true,
      data: {
        ...stats,
        availableCards: remainingCards,
        launchDate: '2026-02-14T00:00:00Z',
        daysUntilLaunch: Math.ceil(
          (new Date('2026-02-14') - new Date()) / (1000 * 60 * 60 * 24)
        )
      }
    });
  } catch (error) {
    console.error('Pre-order stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

/**
 * POST /api/preorder/early-bird
 * Create Early Bird pre-order ($4.99/mo for life)
 */
router.post('/early-bird', async (req, res) => {
  try {
    const { userId, squarePaymentId } = req.body;

    // Check if early bird slots available
    const stats = await preOrderService.getPreOrderStats();
    if (stats.earlyBirdRemaining <= 0) {
      return res.status(400).json({
        success: false,
        error: 'All 100 Early Bird slots have been claimed!'
      });
    }

    const preOrder = await preOrderService.createPreOrder(userId, 'EARLY_BIRD', {
      amount: 4.99,
      squarePaymentId
    });

    res.json({
      success: true,
      data: preOrder,
      message: '🎉 Welcome to the Early Bird family! $5 off FOR LIFE!',
      jokerEntry: preOrder.transactionId
    });
  } catch (error) {
    console.error('Early bird pre-order error:', error);
    res.status(500).json({ success: false, error: 'Pre-order failed' });
  }
});

/**
 * POST /api/preorder/royalty-card
 * Purchase a Royalty Founder Card ($1,000)
 */
router.post('/royalty-card', async (req, res) => {
  try {
    const { userId, cardType, squarePaymentId } = req.body;

    // Validate card type
    const validCards = ['ACE', 'KING', 'QUEEN', 'JACK'];
    if (!validCards.includes(cardType.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid card type. Choose: ACE, KING, QUEEN, or JACK'
      });
    }

    // Check card availability
    const remainingCards = await daoService.getRemainingCards();
    const cardKey = cardType.toLowerCase();
    if (!remainingCards[cardKey]) {
      return res.status(400).json({
        success: false,
        error: `The ${cardType} of Hearts has already been claimed!`
      });
    }

    const preOrder = await preOrderService.createPreOrder(userId, 'ROYALTY_CARD', {
      cardType: cardType.toUpperCase(),
      amount: 1000,
      squarePaymentId
    });

    res.json({
      success: true,
      data: preOrder,
      message: `👑 Congratulations! You are the ${cardType} of Hearts! Premium FREE FOR LIFE + Unlimited Super Likes!`,
      jokerEntry: preOrder.transactionId,
      benefits: [
        'Unique animated card border',
        'Semi-transparent rising hearts effect',
        'Broken heart shatter animation on swipe-left',
        '3 FREE Heart Shards on launch day',
        'Premium membership FREE FOR LIFE',
        'UNLIMITED Heart Shards forever',
        'DAO voting rights',
        'Founder badge on profile'
      ]
    });
  } catch (error) {
    console.error('Royalty card pre-order error:', error);
    res.status(500).json({ success: false, error: 'Pre-order failed' });
  }
});

/**
 * GET /api/preorder/joker-entries
 * Get total Joker drawing entries (public stats)
 */
router.get('/joker-entries', async (req, res) => {
  try {
    const stats = await preOrderService.getPreOrderStats();

    res.json({
      success: true,
      data: {
        totalEntries: stats.jokerEntries,
        drawingDate: '2026-02-14T00:00:00Z',
        prize: 'The Joker\'s Heart - Design your own 1-of-1 animated card with Opus AI'
      }
    });
  } catch (error) {
    console.error('Joker entries error:', error);
    res.status(500).json({ success: false, error: 'Failed to get entries' });
  }
});

/**
 * POST /api/preorder/joker-drawing
 * Perform the Joker drawing (admin only, Valentine's Day)
 */
router.post('/joker-drawing', async (req, res) => {
  try {
    // TODO: Add admin authentication
    const { adminSecret } = req.body;
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const winner = await preOrderService.performJokerDrawing();

    res.json({
      success: true,
      data: {
        winner,
        message: '🃏 The Joker\'s Heart has found its owner!',
        nextStep: 'Contact winner to design their custom animation with Opus AI'
      }
    });
  } catch (error) {
    console.error('Joker drawing error:', error);
    res.status(500).json({ success: false, error: 'Drawing failed' });
  }
});

/**
 * GET /api/preorder/revenue-split
 * Show the Gospel V1.4.1 SURVIVAL MODE revenue split
 */
router.get('/revenue-split', async (req, res) => {
  res.json({
    success: true,
    data: {
      split: {
        verifiedPediatricCharities: '100%',
        platformInfrastructure: '0%',
        founderSustainability: '0%'
      },
      mission: 'FOR THE KIDS!',
      governance: 'All allocations governed by HeartDAO',
      transparency: 'Every transaction on-chain and auditable',
      gospel: 'V1.4.1 SURVIVAL MODE'
    }
  });
});

export default router;
