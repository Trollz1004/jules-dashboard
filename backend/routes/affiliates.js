/**
 * AFFILIATE PROGRAM API - FOR THE KIDS
 * Gospel V1.4.1 SURVIVAL MODE: 100% to verified pediatric charities
 *
 * Affiliate commissions are paid from the Infrastructure allocation
 * 100% to charity is NEVER touched - this is immutable Gospel law
 *
 * Features:
 * - Affiliate registration and approval
 * - Referral tracking with unique codes
 * - Automated commission calculation
 * - Monthly payout reports
 * - Square payment integration (when ready)
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  defaultCommissionRate: 10, // 10% of revenue
  minimumPayout: 50.00, // Minimum $50 to trigger payout
  payoutDay: 1, // Day of month for payouts (1st of month)
  cookieExpiration: 30 * 24 * 60 * 60 * 1000, // 30 days

  // Gospel V1.4.1 SURVIVAL MODE enforcement
  charityPercentage: 100,
  infrastructurePercentage: 0,
  founderPercentage: 0,
};

// ============================================
// AFFILIATE REGISTRATION
// ============================================

/**
 * POST /api/affiliates/register
 * Register new affiliate application
 */
router.post('/register', async (req, res) => {
  try {
    const { email, name, companyName, paymentEmail, source } = req.body;

    // Validation
    if (!email || !name) {
      return res.status(400).json({
        error: 'Email and name are required'
      });
    }

    // Check if email already exists
    const existing = await prisma.affiliate.findUnique({
      where: { email }
    });

    if (existing) {
      return res.status(400).json({
        error: 'An affiliate account with this email already exists'
      });
    }

    // Generate unique referral code
    const code = await generateUniqueCode(name);

    // Create affiliate (pending approval)
    const affiliate = await prisma.affiliate.create({
      data: {
        email,
        name,
        companyName: companyName || null,
        code,
        paymentEmail: paymentEmail || email,
        status: 'PENDING'
      }
    });

    res.json({
      success: true,
      message: 'Affiliate application submitted! You will receive approval notification via email.',
      affiliate: {
        id: affiliate.id,
        code: affiliate.code,
        email: affiliate.email,
        status: affiliate.status
      }
    });

  } catch (error) {
    console.error('Affiliate registration error:', error);
    res.status(500).json({
      error: 'Failed to register affiliate',
      message: error.message
    });
  }
});

/**
 * POST /api/affiliates/approve/:id
 * Approve pending affiliate (admin only)
 */
router.post('/approve/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { commissionRate } = req.body;

    // TODO: Add admin authentication check

    const affiliate = await prisma.affiliate.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        approvedAt: new Date(),
        approvedBy: 'admin', // TODO: Use actual admin ID
        commissionRate: commissionRate || CONFIG.defaultCommissionRate
      }
    });

    // TODO: Send approval email to affiliate

    res.json({
      success: true,
      message: 'Affiliate approved successfully',
      affiliate: {
        id: affiliate.id,
        code: affiliate.code,
        email: affiliate.email,
        status: affiliate.status,
        commissionRate: parseFloat(affiliate.commissionRate)
      }
    });

  } catch (error) {
    console.error('Affiliate approval error:', error);
    res.status(500).json({
      error: 'Failed to approve affiliate',
      message: error.message
    });
  }
});

// ============================================
// REFERRAL TRACKING
// ============================================

/**
 * GET /api/affiliates/track/:code
 * Track affiliate visit (returns tracking cookie)
 */
router.get('/track/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const { source, metadata } = req.query;

    // Find affiliate
    const affiliate = await prisma.affiliate.findUnique({
      where: { code }
    });

    if (!affiliate) {
      return res.status(404).json({
        error: 'Invalid affiliate code'
      });
    }

    if (affiliate.status !== 'ACTIVE') {
      return res.status(400).json({
        error: 'Affiliate account is not active'
      });
    }

    // Create referral tracking record
    const sessionId = crypto.randomUUID();

    const referral = await prisma.affiliateReferral.create({
      data: {
        affiliateId: affiliate.id,
        sessionId,
        source: source || 'direct',
        metadata: metadata ? JSON.parse(metadata) : null
      }
    });

    // Set tracking cookie (client-side will handle this)
    res.json({
      success: true,
      trackingId: referral.id,
      sessionId: referral.sessionId,
      affiliateCode: code,
      expiresIn: CONFIG.cookieExpiration,
      message: 'Referral tracked successfully'
    });

  } catch (error) {
    console.error('Referral tracking error:', error);
    res.status(500).json({
      error: 'Failed to track referral',
      message: error.message
    });
  }
});

/**
 * POST /api/affiliates/convert
 * Mark referral as converted (when purchase happens)
 */
router.post('/convert', async (req, res) => {
  try {
    const {
      sessionId,
      customerEmail,
      customerId,
      orderId,
      transactionId,
      subscriptionId,
      amount
    } = req.body;

    if (!sessionId || !amount) {
      return res.status(400).json({
        error: 'SessionId and amount are required'
      });
    }

    // Find referral
    const referral = await prisma.affiliateReferral.findFirst({
      where: { sessionId },
      include: { affiliate: true }
    });

    if (!referral) {
      return res.status(404).json({
        error: 'Referral session not found'
      });
    }

    // Calculate commission (Gospel V1.4.1 SURVIVAL MODE compliant)
    const revenueAmount = parseFloat(amount);
    const charityAmount = revenueAmount * (CONFIG.charityPercentage / 100);
    const infrastructureAmount = revenueAmount * (CONFIG.infrastructurePercentage / 100);
    const commissionRate = parseFloat(referral.affiliate.commissionRate);

    // Commission comes from infrastructure allocation (not charity!)
    const commissionAmount = infrastructureAmount * (commissionRate / 100);

    // Update referral
    await prisma.affiliateReferral.update({
      where: { id: referral.id },
      data: {
        isConverted: true,
        convertedAt: new Date(),
        customerEmail: customerEmail || null,
        customerId: customerId || null,
        totalRevenue: { increment: revenueAmount },
        orderCount: { increment: 1 }
      }
    });

    // Create commission record
    const commission = await prisma.affiliateCommission.create({
      data: {
        affiliateId: referral.affiliateId,
        referralId: referral.id,
        orderId: orderId || null,
        transactionId: transactionId || null,
        subscriptionId: subscriptionId || null,
        revenueAmount,
        commissionRate,
        commissionAmount,
        charityImpact: charityAmount // Track charity impact (Gospel V1.4.1 SURVIVAL MODE)
      }
    });

    // Update affiliate totals
    await prisma.affiliate.update({
      where: { id: referral.affiliateId },
      data: {
        totalReferrals: { increment: 1 },
        totalRevenue: { increment: revenueAmount },
        totalCommission: { increment: commissionAmount }
      }
    });

    res.json({
      success: true,
      message: 'Referral converted successfully',
      commission: {
        id: commission.id,
        amount: parseFloat(commission.commissionAmount),
        charityImpact: parseFloat(commission.charityImpact)
      }
    });

  } catch (error) {
    console.error('Conversion tracking error:', error);
    res.status(500).json({
      error: 'Failed to track conversion',
      message: error.message
    });
  }
});

// ============================================
// AFFILIATE DASHBOARD
// ============================================

/**
 * GET /api/affiliates/dashboard/:code
 * Get affiliate dashboard data
 */
router.get('/dashboard/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const affiliate = await prisma.affiliate.findUnique({
      where: { code },
      include: {
        referrals: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        commissions: {
          where: { isPaid: false },
          orderBy: { createdAt: 'desc' }
        },
        payouts: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!affiliate) {
      return res.status(404).json({
        error: 'Affiliate not found'
      });
    }

    // Calculate pending commission
    const pendingCommission = affiliate.commissions.reduce(
      (sum, c) => sum + parseFloat(c.commissionAmount),
      0
    );

    // Calculate this month's stats
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const thisMonthCommissions = await prisma.affiliateCommission.findMany({
      where: {
        affiliateId: affiliate.id,
        createdAt: { gte: thisMonthStart }
      }
    });

    const thisMonthRevenue = thisMonthCommissions.reduce(
      (sum, c) => sum + parseFloat(c.revenueAmount),
      0
    );

    const thisMonthCommission = thisMonthCommissions.reduce(
      (sum, c) => sum + parseFloat(c.commissionAmount),
      0
    );

    res.json({
      success: true,
      affiliate: {
        code: affiliate.code,
        name: affiliate.name,
        email: affiliate.email,
        status: affiliate.status,
        commissionRate: parseFloat(affiliate.commissionRate),

        // All-time stats
        totalReferrals: affiliate.totalReferrals,
        totalRevenue: parseFloat(affiliate.totalRevenue),
        totalCommission: parseFloat(affiliate.totalCommission),
        totalPaid: parseFloat(affiliate.totalPaid),

        // Current period
        pendingCommission,

        // This month
        thisMonth: {
          revenue: thisMonthRevenue,
          commission: thisMonthCommission,
          referrals: thisMonthCommissions.length
        },

        // Recent activity
        recentReferrals: affiliate.referrals.map(r => ({
          id: r.id,
          createdAt: r.createdAt,
          isConverted: r.isConverted,
          revenue: parseFloat(r.totalRevenue),
          orders: r.orderCount
        })),

        recentPayouts: affiliate.payouts.map(p => ({
          id: p.id,
          amount: parseFloat(p.payoutAmount),
          status: p.status,
          createdAt: p.createdAt,
          completedAt: p.completedAt
        }))
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      error: 'Failed to load dashboard',
      message: error.message
    });
  }
});

// ============================================
// PAYOUT MANAGEMENT
// ============================================

/**
 * GET /api/affiliates/payouts/generate
 * Generate monthly payout reports (admin only)
 */
router.get('/payouts/generate', async (req, res) => {
  try {
    // TODO: Add admin authentication

    const { month, year } = req.query;

    // Default to last month
    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth();
    const targetYear = year ? parseInt(year) : now.getFullYear();

    const periodStart = new Date(targetYear, targetMonth - 1, 1);
    const periodEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    console.log(`Generating payouts for ${periodStart.toLocaleDateString()} to ${periodEnd.toLocaleDateString()}`);

    // Get all active affiliates
    const affiliates = await prisma.affiliate.findMany({
      where: { status: 'ACTIVE' },
      include: {
        commissions: {
          where: {
            isPaid: false,
            createdAt: {
              gte: periodStart,
              lte: periodEnd
            }
          }
        }
      }
    });

    const payoutReports = [];

    for (const affiliate of affiliates) {
      const totalCommission = affiliate.commissions.reduce(
        (sum, c) => sum + parseFloat(c.commissionAmount),
        0
      );

      // Only create payout if meets minimum threshold
      if (totalCommission >= CONFIG.minimumPayout) {
        const payout = await prisma.affiliatePayout.create({
          data: {
            affiliateId: affiliate.id,
            periodStart,
            periodEnd,
            totalCommission,
            payoutAmount: totalCommission, // No fees for now
            fees: 0,
            paymentMethod: affiliate.paymentMethod,
            paymentEmail: affiliate.paymentEmail,
            status: 'PENDING'
          }
        });

        // Link commissions to payout
        await prisma.affiliateCommission.updateMany({
          where: {
            id: { in: affiliate.commissions.map(c => c.id) }
          },
          data: {
            payoutId: payout.id
          }
        });

        payoutReports.push({
          affiliate: affiliate.name,
          email: affiliate.email,
          commissionCount: affiliate.commissions.length,
          amount: totalCommission,
          payoutId: payout.id
        });
      }
    }

    res.json({
      success: true,
      period: {
        start: periodStart,
        end: periodEnd
      },
      payouts: payoutReports,
      totalPayouts: payoutReports.length,
      totalAmount: payoutReports.reduce((sum, p) => sum + p.amount, 0)
    });

  } catch (error) {
    console.error('Payout generation error:', error);
    res.status(500).json({
      error: 'Failed to generate payouts',
      message: error.message
    });
  }
});

/**
 * GET /api/affiliates/payouts/pending
 * Get all pending payouts (admin only)
 */
router.get('/payouts/pending', async (req, res) => {
  try {
    // TODO: Add admin authentication

    const payouts = await prisma.affiliatePayout.findMany({
      where: { status: 'PENDING' },
      include: {
        affiliate: true,
        commissions: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = payouts.map(p => ({
      id: p.id,
      affiliate: {
        name: p.affiliate.name,
        email: p.affiliate.email,
        code: p.affiliate.code
      },
      period: {
        start: p.periodStart,
        end: p.periodEnd
      },
      amount: parseFloat(p.payoutAmount),
      paymentMethod: p.paymentMethod,
      paymentEmail: p.paymentEmail,
      commissionsCount: p.commissions.length,
      createdAt: p.createdAt
    }));

    res.json({
      success: true,
      payouts: formatted,
      totalPending: formatted.length,
      totalAmount: formatted.reduce((sum, p) => sum + p.amount, 0)
    });

  } catch (error) {
    console.error('Pending payouts error:', error);
    res.status(500).json({
      error: 'Failed to load pending payouts',
      message: error.message
    });
  }
});

/**
 * POST /api/affiliates/payouts/process/:id
 * Process payout via Square (admin only)
 */
router.post('/payouts/process/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentId, receiptUrl, notes } = req.body;

    // TODO: Add admin authentication
    // TODO: Integrate with Square Payouts API

    const payout = await prisma.affiliatePayout.update({
      where: { id },
      data: {
        status: 'PROCESSING',
        processedAt: new Date(),
        processedBy: 'admin', // TODO: Use actual admin ID
        notes: notes || null
      },
      include: {
        affiliate: true,
        commissions: true
      }
    });

    // If payment successful, mark as completed
    if (paymentId) {
      await prisma.affiliatePayout.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          paymentId,
          receiptUrl: receiptUrl || null
        }
      });

      // Mark all commissions as paid
      await prisma.affiliateCommission.updateMany({
        where: { payoutId: id },
        data: {
          isPaid: true,
          paidAt: new Date()
        }
      });

      // Update affiliate total paid
      await prisma.affiliate.update({
        where: { id: payout.affiliateId },
        data: {
          totalPaid: { increment: parseFloat(payout.payoutAmount) }
        }
      });

      // TODO: Send payout confirmation email to affiliate
    }

    res.json({
      success: true,
      message: paymentId ? 'Payout completed successfully' : 'Payout processing started',
      payout: {
        id: payout.id,
        amount: parseFloat(payout.payoutAmount),
        status: paymentId ? 'COMPLETED' : 'PROCESSING',
        affiliate: payout.affiliate.name
      }
    });

  } catch (error) {
    console.error('Payout processing error:', error);

    // Mark payout as failed
    if (req.params.id) {
      await prisma.affiliatePayout.update({
        where: { id: req.params.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
          attemptCount: { increment: 1 },
          lastAttemptAt: new Date()
        }
      }).catch(err => console.error('Failed to update payout status:', err));
    }

    res.status(500).json({
      error: 'Failed to process payout',
      message: error.message
    });
  }
});

/**
 * GET /api/affiliates/payouts/:id
 * Get payout details
 */
router.get('/payouts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const payout = await prisma.affiliatePayout.findUnique({
      where: { id },
      include: {
        affiliate: true,
        commissions: {
          include: {
            referral: true
          }
        }
      }
    });

    if (!payout) {
      return res.status(404).json({
        error: 'Payout not found'
      });
    }

    res.json({
      success: true,
      payout: {
        id: payout.id,
        affiliate: {
          name: payout.affiliate.name,
          email: payout.affiliate.email,
          code: payout.affiliate.code
        },
        period: {
          start: payout.periodStart,
          end: payout.periodEnd
        },
        amount: parseFloat(payout.payoutAmount),
        fees: parseFloat(payout.fees),
        status: payout.status,
        paymentMethod: payout.paymentMethod,
        paymentEmail: payout.paymentEmail,
        paymentId: payout.paymentId,
        receiptUrl: payout.receiptUrl,
        commissions: payout.commissions.map(c => ({
          id: c.id,
          amount: parseFloat(c.commissionAmount),
          revenue: parseFloat(c.revenueAmount),
          charityImpact: parseFloat(c.charityImpact),
          createdAt: c.createdAt
        })),
        createdAt: payout.createdAt,
        processedAt: payout.processedAt,
        completedAt: payout.completedAt
      }
    });

  } catch (error) {
    console.error('Payout details error:', error);
    res.status(500).json({
      error: 'Failed to load payout details',
      message: error.message
    });
  }
});

// ============================================
// ADMIN ENDPOINTS
// ============================================

/**
 * GET /api/affiliates/admin/list
 * List all affiliates (admin only)
 */
router.get('/admin/list', async (req, res) => {
  try {
    // TODO: Add admin authentication

    const { status } = req.query;

    const affiliates = await prisma.affiliate.findMany({
      where: status ? { status } : undefined,
      include: {
        _count: {
          select: {
            referrals: true,
            commissions: true,
            payouts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      affiliates: affiliates.map(a => ({
        id: a.id,
        code: a.code,
        name: a.name,
        email: a.email,
        status: a.status,
        commissionRate: parseFloat(a.commissionRate),
        totalRevenue: parseFloat(a.totalRevenue),
        totalCommission: parseFloat(a.totalCommission),
        totalPaid: parseFloat(a.totalPaid),
        referralsCount: a._count.referrals,
        commissionsCount: a._count.commissions,
        payoutsCount: a._count.payouts,
        createdAt: a.createdAt,
        approvedAt: a.approvedAt
      }))
    });

  } catch (error) {
    console.error('Admin list error:', error);
    res.status(500).json({
      error: 'Failed to load affiliates',
      message: error.message
    });
  }
});

/**
 * GET /api/affiliates/admin/stats
 * Get affiliate program statistics (admin only)
 */
router.get('/admin/stats', async (req, res) => {
  try {
    // TODO: Add admin authentication

    const [
      totalAffiliates,
      activeAffiliates,
      pendingAffiliates,
      totalCommissions,
      unpaidCommissions,
      pendingPayouts
    ] = await Promise.all([
      prisma.affiliate.count(),
      prisma.affiliate.count({ where: { status: 'ACTIVE' } }),
      prisma.affiliate.count({ where: { status: 'PENDING' } }),
      prisma.affiliateCommission.findMany(),
      prisma.affiliateCommission.findMany({ where: { isPaid: false } }),
      prisma.affiliatePayout.findMany({ where: { status: 'PENDING' } })
    ]);

    const totalRevenue = totalCommissions.reduce(
      (sum, c) => sum + parseFloat(c.revenueAmount),
      0
    );

    const totalCommissionAmount = totalCommissions.reduce(
      (sum, c) => sum + parseFloat(c.commissionAmount),
      0
    );

    const unpaidAmount = unpaidCommissions.reduce(
      (sum, c) => sum + parseFloat(c.commissionAmount),
      0
    );

    const pendingPayoutAmount = pendingPayouts.reduce(
      (sum, p) => sum + parseFloat(p.payoutAmount),
      0
    );

    const totalCharityImpact = totalCommissions.reduce(
      (sum, c) => sum + parseFloat(c.charityImpact),
      0
    );

    res.json({
      success: true,
      stats: {
        affiliates: {
          total: totalAffiliates,
          active: activeAffiliates,
          pending: pendingAffiliates
        },
        revenue: {
          total: totalRevenue,
          commissionsPaid: totalCommissionAmount,
          unpaid: unpaidAmount,
          charityImpact: totalCharityImpact // Gospel V1.4.1 SURVIVAL MODE - 100% to verified pediatric charities
        },
        payouts: {
          pending: pendingPayouts.length,
          pendingAmount: pendingPayoutAmount
        },
        gospel: {
          version: 'V1.4.1 SURVIVAL MODE',
          charityPercentage: CONFIG.charityPercentage,
          infrastructurePercentage: CONFIG.infrastructurePercentage,
          founderPercentage: CONFIG.founderPercentage,
          note: '100% to verified pediatric charities - charity allocation is never touched'
        }
      }
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      error: 'Failed to load statistics',
      message: error.message
    });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate unique affiliate code
 */
async function generateUniqueCode(name) {
  // Create base code from name
  const baseName = name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8);
  const random = Math.floor(Math.random() * 1000);
  let code = `${baseName}${random}`;

  // Ensure uniqueness
  let attempts = 0;
  while (attempts < 10) {
    const existing = await prisma.affiliate.findUnique({
      where: { code }
    });

    if (!existing) {
      return code;
    }

    attempts++;
    code = `${baseName}${Math.floor(Math.random() * 10000)}`;
  }

  // Fallback to UUID-based code
  return crypto.randomUUID().substring(0, 12).toUpperCase().replace(/-/g, '');
}

export default router;
