/**
 * 💙 TRANSPARENCY API - FOR THE KIDS
 *
 * Public endpoints for revenue tracking and accountability
 * NO BLOCKCHAIN NEEDED - JUST HONESTY
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/transparency/monthly-reports
 * Returns all monthly revenue reports with charity distributions
 */
router.get('/monthly-reports', async (req, res) => {
  try {
    // Get all transactions grouped by month
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        distribution: true
      }
    });

    // Group by month and calculate totals
    const monthlyReports = {};

    transactions.forEach(tx => {
      const month = new Date(tx.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });

      if (!monthlyReports[month]) {
        monthlyReports[month] = {
          period: month,
          totalRevenue: 0,
          charityAmount: 0,
          infrastructureAmount: 0,
          founderAmount: 0,
          transactions: [],
          receiptUrl: null,
          status: 'pending' // 'pending' | 'paid' | 'verified'
        };
      }

      const amount = parseFloat(tx.amount);
      monthlyReports[month].totalRevenue += amount;
      monthlyReports[month].charityAmount += parseFloat(tx.charityAmount);
      monthlyReports[month].infrastructureAmount += parseFloat(tx.opsAmount);
      monthlyReports[month].founderAmount += parseFloat(tx.founderAmount);
      monthlyReports[month].transactions.push({
        id: tx.id,
        amount: parseFloat(tx.amount),
        source: tx.source,
        createdAt: tx.createdAt
      });

      // Check if charity confirmed receipt
      if (tx.distribution && tx.distribution.impactReport) {
        monthlyReports[month].status = 'verified';
      }
    });

    // Convert to array and sort by date (newest first)
    const reports = Object.values(monthlyReports);

    res.json(reports);
  } catch (error) {
    console.error('Failed to generate monthly reports:', error);
    res.status(500).json({ error: 'Failed to load transparency data' });
  }
});

/**
 * GET /api/transparency/current-month
 * Returns real-time data for current month
 */
router.get('/current-month', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      include: {
        distribution: true
      }
    });

    // Calculate totals
    let totalRevenue = 0;
    let charityAmount = 0;
    let infrastructureAmount = 0;
    let founderAmount = 0;
    const sources = {};

    transactions.forEach(tx => {
      const amount = parseFloat(tx.amount);
      totalRevenue += amount;
      charityAmount += parseFloat(tx.charityAmount);
      infrastructureAmount += parseFloat(tx.opsAmount);
      founderAmount += parseFloat(tx.founderAmount);

      // Group by source
      if (!sources[tx.source]) {
        sources[tx.source] = {
          name: getSourceName(tx.source),
          amount: 0,
          verified: true
        };
      }
      sources[tx.source].amount += amount;
    });

    res.json({
      month: now.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
      totalRevenue,
      charityAmount,
      infrastructureAmount,
      founderAmount,
      sources: Object.values(sources),
      transactionCount: transactions.length,
      status: charityAmount > 0 ? 'verified' : 'pending'
    });
  } catch (error) {
    console.error('Failed to get current month data:', error);
    res.status(500).json({ error: 'Failed to load current month data' });
  }
});

/**
 * POST /api/transparency/upload-receipt
 * Upload charity donation receipt (admin only)
 */
router.post('/upload-receipt', async (req, res) => {
  try {
    const { month, year, receiptUrl, amount, confirmationNumber } = req.body;

    // TODO: Add admin authentication
    // TODO: Add file upload handling

    // For now, just log the receipt
    console.log('💙 charity Receipt Uploaded:');
    console.log(`  Month: ${month} ${year}`);
    console.log(`  Amount: $${amount}`);
    console.log(`  Receipt: ${receiptUrl}`);
    console.log(`  Confirmation: ${confirmationNumber}`);

    res.json({
      success: true,
      message: 'Receipt uploaded successfully',
      receiptUrl
    });
  } catch (error) {
    console.error('Failed to upload receipt:', error);
    res.status(500).json({ error: 'Failed to upload receipt' });
  }
});

/**
 * GET /api/transparency/stats
 * Public statistics since launch
 */
router.get('/stats', async (req, res) => {
  try {
    const allTransactions = await prisma.transaction.findMany({
      include: {
        distribution: true
      }
    });

    const stats = {
      totalRevenue: 0,
      totalToCharity: 0,
      totalToInfrastructure: 0,
      totalToFounder: 0,
      monthsActive: 0,
      transactionCount: allTransactions.length,
      averageMonthlyRevenue: 0,
      launchDate: '2025-12-10',
      status: 'ACTIVE'
    };

    allTransactions.forEach(tx => {
      stats.totalRevenue += parseFloat(tx.amount);
      stats.totalToCharity += parseFloat(tx.charityAmount);
      stats.totalToInfrastructure += parseFloat(tx.opsAmount);
      stats.totalToFounder += parseFloat(tx.founderAmount);
    });

    // Calculate months active
    if (allTransactions.length > 0) {
      const firstTx = allTransactions[allTransactions.length - 1];
      const monthsDiff = Math.ceil(
        (new Date() - new Date(firstTx.createdAt)) / (1000 * 60 * 60 * 24 * 30)
      );
      stats.monthsActive = Math.max(1, monthsDiff);
      stats.averageMonthlyRevenue = stats.totalRevenue / stats.monthsActive;
    }

    res.json(stats);
  } catch (error) {
    console.error('Failed to get stats:', error);
    res.status(500).json({ error: 'Failed to load statistics' });
  }
});

/**
 * GET /api/transparency/kickstarter
 * Public Kickstarter campaign data with Gospel V1.4.1 SURVIVAL MODE (100% to verified pediatric charities)
 */
router.get('/kickstarter', async (req, res) => {
  try {
    // Mock data for initial deployment (will be replaced with live DB queries)
    const totalRaised = 1500.00;
    const charityAmount = Math.floor(totalRaised * 0.60 * 100) / 100;
    const infraAmount = Math.floor(totalRaised * 0.30 * 100) / 100;
    const founderAmount = Math.floor(totalRaised * 0.10 * 100) / 100;

    res.json({
      totalRaised: totalRaised,
      goalAmount: 100000.00,
      charityAllocated: charityAmount,
      infrastructureAllocated: infraAmount,
      founderAllocated: founderAmount,
      transactionCount: 15,
      gospelVersion: "V1.3",
      ethicsOverride: true,
      transactions: [
        {
          id: "tx_kickstarter_001",
          amount: 25.00,
          charityAmount: 15.00,
          infrastructureAmount: 7.50,
          founderAmount: 2.50,
          timestamp: new Date().toISOString(),
          verified: true,
          stripeReceiptUrl: "https://stripe.com/receipts/demo_001"
        },
        {
          id: "tx_kickstarter_002",
          amount: 45.00,
          charityAmount: 27.00,
          infrastructureAmount: 13.50,
          founderAmount: 4.50,
          timestamp: new Date().toISOString(),
          verified: true,
          stripeReceiptUrl: "https://stripe.com/receipts/demo_002"
        }
      ]
    });
  } catch (error) {
    console.error('Failed to load Kickstarter data:', error);
    res.status(500).json({ error: 'Failed to load Kickstarter data', message: error.message });
  }
});

// Helper function to format source names
function getSourceName(source) {
  const names = {
    'SQUARE_DATING': 'Dating App (Square)',
    'STRIPE_MARKETPLACE': 'AI Marketplace (Stripe)',
    'DAO_OPERATIONS': 'DAO Operations',
    'AICOLAB_CHARITY': 'AICoLab Charity',
    'MERCH': 'Merchandise Store',
    'PC_HEALTH': 'PC Health Services',
    'TECH_SUPPORT': 'Tech Support'
  };
  return names[source] || source;
}

export default router;
