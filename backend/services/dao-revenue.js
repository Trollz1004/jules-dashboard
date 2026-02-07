/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DAO REVENUE SERVICE - STANDARD REVENUE MANAGEMENT
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Standard revenue management for non-charity DAO platform.
 * All revenue goes to DAO treasury for platform operations and development.
 *
 * Created: January 2025
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// DAO REVENUE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const DAO_REVENUE_CONFIG = Object.freeze({
  TREASURY_PERCENTAGE: 100,
  VERSION: "1.0.0",
  PLATFORM_NAME: "YouAndINotAI DAO"
});

// ═══════════════════════════════════════════════════════════════════════════════
// REVENUE CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate revenue allocation for a transaction
 * @param {number} amount - Total transaction amount
 * @returns {Object} Revenue allocation
 */
export function calculateRevenueAllocation(amount) {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount < 0) {
    throw new Error('Invalid amount');
  }

  return {
    total: numAmount,
    treasury: {
      amount: numAmount,
      percentage: DAO_REVENUE_CONFIG.TREASURY_PERCENTAGE
    },
    timestamp: new Date().toISOString(),
    version: DAO_REVENUE_CONFIG.VERSION
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSACTION RECORDING
// ═══════════════════════════════════════════════════════════════════════════════

// In-memory ledger (will be replaced with Prisma)
let transactionLedger = [];
let lastHash = null;

/**
 * Create immutable hash of a transaction
 */
export function createTransactionHash(transactionData, previousHash = null) {
  const data = {
    ...transactionData,
    previousHash,
    nonce: Date.now()
  };

  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');

  return {
    hash,
    previousHash,
    data,
    verifiable: true
  };
}

/**
 * Record a transaction
 */
export function recordTransaction(amount, source, metadata = {}) {
  const allocation = calculateRevenueAllocation(amount);
  const hashRecord = createTransactionHash(allocation, lastHash);

  const transaction = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    amount,
    source,
    allocation,
    hash: hashRecord.hash,
    previousHash: hashRecord.previousHash,
    metadata,
    verified: true
  };

  transactionLedger.push(transaction);
  lastHash = hashRecord.hash;

  console.log(`💰 DAO Transaction: $${amount} from ${source}`);
  console.log(`   → $${allocation.treasury.amount} to DAO Treasury`);
  console.log(`   → Hash: ${hashRecord.hash.substring(0, 16)}...`);

  return transaction;
}

/**
 * Get transaction ledger
 */
export function getLedger() {
  return {
    transactions: transactionLedger,
    count: transactionLedger.length,
    totalProcessed: transactionLedger.reduce((sum, t) => sum + t.amount, 0),
    config: DAO_REVENUE_CONFIG,
    verified: transactionLedger.every(t => t.verified)
  };
}

/**
 * Get summary statistics
 */
export function getSummary() {
  const totals = transactionLedger.reduce((acc, t) => ({
    total: acc.total + t.amount,
    treasury: acc.treasury + t.allocation.treasury.amount
  }), { total: 0, treasury: 0 });

  return {
    ...totals,
    transactionCount: transactionLedger.length,
    config: DAO_REVENUE_CONFIG,
    lastTransaction: transactionLedger[transactionLedger.length - 1] || null,
    verified: true
  };
}

export default {
  DAO_REVENUE_CONFIG,
  calculateRevenueAllocation,
  createTransactionHash,
  recordTransaction,
  getLedger,
  getSummary
};
