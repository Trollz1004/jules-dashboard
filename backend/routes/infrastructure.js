/**
 * 🔱 GEMINI OMEGA GOSPEL - 30% INFRASTRUCTURE PUBLIC LEDGER
 *
 * Jules (Gemini AI) approves/rejects infrastructure expenses
 * 100% public transparency - every dollar tracked
 * FOR THE KIDS - FOR LIFE - FOR AFTER
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize Gemini (Jules) with new SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const JULES_MODEL = process.env.GEMINI_MODEL_NAME || 'gemini-3-pro-preview';

/**
 * POST /api/infra/propose
 * Propose a new infrastructure expense for Jules to evaluate
 */
router.post('/propose', async (req, res) => {
  try {
    const { description, category, amount, vendor, dueDate } = req.body;

    // Validate input
    if (!description || !category || !amount || !vendor) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['description', 'category', 'amount', 'vendor']
      });
    }

    // Get current infrastructure fund balance
    const currentMonth = new Date().toISOString().slice(0, 7); // "2025-12"
    const monthlyInfra = await calculateMonthlyInfrastructureFund(currentMonth);
    const existingExpenses = await prisma.infrastructureExpense.findMany({
      where: {
        allocatedFromMonth: currentMonth,
        status: { in: ['APPROVED', 'PAID', 'VERIFIED'] }
      }
    });

    const totalAllocated = existingExpenses.reduce((sum, exp) =>
      sum + parseFloat(exp.amount), 0
    );
    const availableBalance = monthlyInfra - totalAllocated;

    // Check if we have enough funds
    if (parseFloat(amount) > availableBalance) {
      return res.status(400).json({
        error: 'Insufficient infrastructure funds',
        requested: parseFloat(amount),
        available: availableBalance,
        monthlyAllocation: monthlyInfra,
        alreadyAllocated: totalAllocated
      });
    }

    // Ask Jules (Gemini) to evaluate the expense
    const julesPrompt = `
You are Jules, the AI infrastructure expense approver for "AiCollabForTheKids" platform.

MISSION: FOR THE KIDS - 100% of ALL revenue goes to verified pediatric charities.
Your job: Ensure infrastructure expenses are legitimate and support the mission.

EXPENSE PROPOSAL:
- Description: ${description}
- Category: ${category}
- Amount: $${amount}
- Vendor: ${vendor}
- Due Date: ${dueDate || 'Not specified'}

CONTEXT:
- Monthly Infrastructure Fund (30%): $${monthlyInfra.toFixed(2)}
- Already Allocated: $${totalAllocated.toFixed(2)}
- Available Balance: $${availableBalance.toFixed(2)}

Evaluate this expense and respond in JSON format:
{
  "approved": true/false,
  "reasoning": "Detailed explanation of your decision",
  "confidence": 0-100,
  "suggestions": "Optional: Alternative approaches or cost-saving ideas"
}

APPROVAL CRITERIA:
✅ Approve if:
- Necessary for platform operation
- Reasonable market price
- Supports the mission
- Vendor is legitimate

❌ Reject if:
- Frivolous or unnecessary
- Overpriced compared to alternatives
- Vendor seems suspicious
- Better free alternatives exist
`;

    let julesResponse;
    try {
      const result = await ai.models.generateContent({
        model: JULES_MODEL,
        contents: julesPrompt,
        config: {
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      const responseText = result.text;

      // Extract JSON from response (handling markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        julesResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON response from Jules');
      }
    } catch (error) {
      console.error('Jules evaluation failed:', error);
      // Fallback: auto-reject if Jules can't evaluate
      julesResponse = {
        approved: false,
        reasoning: `Jules AI evaluation failed: ${error.message}. Rejecting by default for safety.`,
        confidence: 0,
        suggestions: 'Please try again or contact administrator'
      };
    }

    // Calculate hash for immutability
    const previousExpense = await prisma.infrastructureExpense.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    const expenseData = {
      description,
      category,
      amount: parseFloat(amount),
      vendor,
      status: julesResponse.approved ? 'APPROVED' : 'REJECTED',
      timestamp: new Date().toISOString()
    };

    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(expenseData))
      .digest('hex');

    // Create expense record
    const expense = await prisma.infrastructureExpense.create({
      data: {
        description,
        category,
        amount: parseFloat(amount),
        vendor,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: julesResponse.approved ? 'APPROVED' : 'REJECTED',
        julesApprovedAt: julesResponse.approved ? new Date() : null,
        julesReasoning: julesResponse.reasoning,
        julesConfidence: julesResponse.confidence,
        allocatedFromMonth: currentMonth,
        remainingBalance: julesResponse.approved
          ? availableBalance - parseFloat(amount)
          : availableBalance,
        hash,
        previousHash: previousExpense?.hash || null
      }
    });

    res.json({
      success: true,
      expense,
      julesEvaluation: julesResponse,
      fundStatus: {
        monthlyAllocation: monthlyInfra,
        totalAllocated: julesResponse.approved
          ? totalAllocated + parseFloat(amount)
          : totalAllocated,
        remainingBalance: julesResponse.approved
          ? availableBalance - parseFloat(amount)
          : availableBalance
      }
    });

  } catch (error) {
    console.error('Failed to propose expense:', error);
    res.status(500).json({ error: 'Failed to propose expense', message: error.message });
  }
});

/**
 * GET /api/infra/ledger
 * Public ledger of all infrastructure expenses
 */
router.get('/ledger', async (req, res) => {
  try {
    const { month, status, category, limit = 100, offset = 0 } = req.query;

    const where = {};

    if (month) {
      where.allocatedFromMonth = month;
    }

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    const expenses = await prisma.infrastructureExpense.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const totalCount = await prisma.infrastructureExpense.count({ where });

    // Calculate summary stats
    const summary = {
      totalExpenses: totalCount,
      totalApproved: 0,
      totalRejected: 0,
      totalPaid: 0,
      totalVerified: 0,
      amountApproved: 0,
      amountPaid: 0,
      amountVerified: 0
    };

    expenses.forEach(exp => {
      const amount = parseFloat(exp.amount);

      if (exp.status === 'APPROVED') {
        summary.totalApproved++;
        summary.amountApproved += amount;
      } else if (exp.status === 'REJECTED') {
        summary.totalRejected++;
      } else if (exp.status === 'PAID') {
        summary.totalPaid++;
        summary.amountPaid += amount;
      } else if (exp.status === 'VERIFIED') {
        summary.totalVerified++;
        summary.amountVerified += amount;
      }
    });

    res.json({
      expenses,
      summary,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: totalCount > (parseInt(offset) + parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Failed to load ledger:', error);
    res.status(500).json({ error: 'Failed to load ledger', message: error.message });
  }
});

/**
 * GET /api/infra/stats
 * Infrastructure fund statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyInfra = await calculateMonthlyInfrastructureFund(currentMonth);

    const thisMonthExpenses = await prisma.infrastructureExpense.findMany({
      where: { allocatedFromMonth: currentMonth }
    });

    const approved = thisMonthExpenses.filter(e =>
      ['APPROVED', 'PAID', 'VERIFIED'].includes(e.status)
    );
    const rejected = thisMonthExpenses.filter(e => e.status === 'REJECTED');
    const proposed = thisMonthExpenses.filter(e => e.status === 'PROPOSED');

    const totalApprovedAmount = approved.reduce((sum, e) =>
      sum + parseFloat(e.amount), 0
    );

    res.json({
      currentMonth,
      monthlyAllocation: monthlyInfra,
      totalProposed: thisMonthExpenses.length,
      totalApproved: approved.length,
      totalRejected: rejected.length,
      totalPending: proposed.length,
      amountAllocated: totalApprovedAmount,
      amountRemaining: monthlyInfra - totalApprovedAmount,
      percentageUsed: ((totalApprovedAmount / monthlyInfra) * 100).toFixed(2),
      julesApprovalRate: thisMonthExpenses.length > 0
        ? ((approved.length / thisMonthExpenses.length) * 100).toFixed(2)
        : 0
    });

  } catch (error) {
    console.error('Failed to load stats:', error);
    res.status(500).json({ error: 'Failed to load stats', message: error.message });
  }
});

/**
 * POST /api/infra/upload-receipt
 * Upload receipt for verified expense (admin only)
 * TODO: Integrate with AWS S3 Object Lock
 */
router.post('/upload-receipt', async (req, res) => {
  try {
    const { expenseId, receiptUrl } = req.body;

    if (!expenseId || !receiptUrl) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['expenseId', 'receiptUrl']
      });
    }

    const expense = await prisma.infrastructureExpense.findUnique({
      where: { id: expenseId }
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (expense.status !== 'PAID') {
      return res.status(400).json({
        error: 'Can only upload receipts for paid expenses',
        currentStatus: expense.status
      });
    }

    // Update expense with receipt
    // TODO: Upload to S3 with Object Lock instead of external URL
    const updated = await prisma.infrastructureExpense.update({
      where: { id: expenseId },
      data: {
        status: 'VERIFIED',
        receiptS3Url: receiptUrl,
        receiptUploadedAt: new Date()
      }
    });

    res.json({
      success: true,
      expense: updated,
      message: 'Receipt uploaded and expense verified'
    });

  } catch (error) {
    console.error('Failed to upload receipt:', error);
    res.status(500).json({ error: 'Failed to upload receipt', message: error.message });
  }
});

/**
 * Helper: Calculate monthly infrastructure fund (30% of revenue)
 */
async function calculateMonthlyInfrastructureFund(month) {
  const [year, monthNum] = month.split('-');
  const startDate = new Date(year, parseInt(monthNum) - 1, 1);
  const endDate = new Date(year, parseInt(monthNum), 0, 23, 59, 59);

  const transactions = await prisma.transaction.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  const totalInfra = transactions.reduce((sum, tx) =>
    sum + parseFloat(tx.opsAmount), 0
  );

  return totalInfra;
}

export default router;
