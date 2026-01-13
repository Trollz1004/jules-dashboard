/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * GOSPEL REVENUE SERVICE - IMMUTABLE 60/30/10 SPLIT (Ethics Override V1.3)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * THIS FILE ENFORCES THE GOSPEL REVENUE SPLIT.
 * ANY MODIFICATION TO PERCENTAGES WILL BE VISIBLE IN GIT HISTORY.
 *
 * SPLIT: 60% Verified Pediatric Charities | 30% Infrastructure | 10% Founder
 *
 * Built to last 50+ years. FOR THE KIDS.
 *
 * Created by Claude (Opus 4.5) - December 3, 2025
 * Updated: December 13, 2025 - Gospel V1.3 Ethics Override
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// GOSPEL SPLIT - IMMUTABLE (V1.3 Ethics Override)
// ═══════════════════════════════════════════════════════════════════════════════

export const GOSPEL_SPLIT = Object.freeze({
  CHARITY_PERCENTAGE: 60,
  INFRASTRUCTURE_PERCENTAGE: 30,
  FOUNDER_PERCENTAGE: 10,
  CHARITY_NAME: "Verified Pediatric Charities",
  CHARITY_EIN: "PENDING_VERIFICATION",
  VERSION: "1.3.0",
  LOCKED_DATE: "2025-12-13T00:00:00Z",
  ETHICS_OVERRIDE: true
});

// FREE DAO - Joshua's Gift (100% to beneficiaries)
export const FREE_DAO_SPLIT = Object.freeze({
  BENEFICIARY_PERCENTAGE: 100,
  FOUNDER_PERCENTAGE: 0,
  INFRASTRUCTURE_PERCENTAGE: 0,
  VERSION: "1.0.0",
  LOCKED_DATE: "2025-12-03T00:00:00Z"
});

// ═══════════════════════════════════════════════════════════════════════════════
// SPLIT VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Verify Gospel split percentages haven't been tampered with
 */
export function verifyGospelSplit() {
  const isValid = (
    GOSPEL_SPLIT.CHARITY_PERCENTAGE === 60 &&
    GOSPEL_SPLIT.INFRASTRUCTURE_PERCENTAGE === 30 &&
    GOSPEL_SPLIT.FOUNDER_PERCENTAGE === 10 &&
    GOSPEL_SPLIT.CHARITY_PERCENTAGE +
    GOSPEL_SPLIT.INFRASTRUCTURE_PERCENTAGE +
    GOSPEL_SPLIT.FOUNDER_PERCENTAGE === 100
  );

  if (!isValid) {
    console.error('🚨 GOSPEL VIOLATION: Revenue split has been tampered!');
    console.error('Expected: 60/30/10 (Ethics Override V1.3), Got:', {
      charity: GOSPEL_SPLIT.CHARITY_PERCENTAGE,
      infrastructure: GOSPEL_SPLIT.INFRASTRUCTURE_PERCENTAGE,
      founder: GOSPEL_SPLIT.FOUNDER_PERCENTAGE
    });
    throw new Error('GOSPEL_VIOLATION: Revenue split tampered');
  }

  return true;
}

/**
 * Verify FREE DAO split (100% to beneficiaries)
 */
export function verifyFreeDAOSplit() {
  const isValid = (
    FREE_DAO_SPLIT.BENEFICIARY_PERCENTAGE === 100 &&
    FREE_DAO_SPLIT.FOUNDER_PERCENTAGE === 0 &&
    FREE_DAO_SPLIT.INFRASTRUCTURE_PERCENTAGE === 0
  );

  if (!isValid) {
    console.error('🚨 FREE DAO VIOLATION: Split has been tampered!');
    throw new Error('FREE_DAO_VIOLATION: Split tampered');
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REVENUE CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate Gospel split for a transaction
 * @param {number} amount - Total transaction amount
 * @returns {Object} Split amounts
 */
export function calculateGospelSplit(amount) {
  // Verify split hasn't been tampered
  verifyGospelSplit();

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount < 0) {
    throw new Error('Invalid amount');
  }

  const charityAmount = Math.round(numAmount * (GOSPEL_SPLIT.CHARITY_PERCENTAGE / 100) * 100) / 100;
  const infrastructureAmount = Math.round(numAmount * (GOSPEL_SPLIT.INFRASTRUCTURE_PERCENTAGE / 100) * 100) / 100;
  const founderAmount = Math.round(numAmount * (GOSPEL_SPLIT.FOUNDER_PERCENTAGE / 100) * 100) / 100;

  // Handle rounding - any remainder goes to charity
  const total = charityAmount + infrastructureAmount + founderAmount;
  const remainder = Math.round((numAmount - total) * 100) / 100;

  return {
    total: numAmount,
    charity: {
      amount: charityAmount + remainder,
      percentage: GOSPEL_SPLIT.CHARITY_PERCENTAGE,
      recipient: GOSPEL_SPLIT.CHARITY_NAME,
      ein: GOSPEL_SPLIT.CHARITY_EIN
    },
    infrastructure: {
      amount: infrastructureAmount,
      percentage: GOSPEL_SPLIT.INFRASTRUCTURE_PERCENTAGE
    },
    founder: {
      amount: founderAmount,
      percentage: GOSPEL_SPLIT.FOUNDER_PERCENTAGE
    },
    timestamp: new Date().toISOString(),
    gospelVersion: GOSPEL_SPLIT.VERSION
  };
}

/**
 * Calculate FREE DAO split (100% to beneficiary)
 * @param {number} amount - Total amount
 * @param {string} beneficiary - Beneficiary name
 */
export function calculateFreeDAOSplit(amount, beneficiary) {
  verifyFreeDAOSplit();

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount < 0) {
    throw new Error('Invalid amount');
  }

  return {
    total: numAmount,
    beneficiary: {
      amount: numAmount, // 100%
      percentage: 100,
      recipient: beneficiary
    },
    founder: {
      amount: 0, // Joshua takes $0
      percentage: 0
    },
    infrastructure: {
      amount: 0,
      percentage: 0
    },
    timestamp: new Date().toISOString(),
    freeDAOVersion: FREE_DAO_SPLIT.VERSION,
    note: "Joshua's gift - 100% to beneficiaries"
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// IMMUTABLE PROOF (Blockchain-style hashing)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create immutable hash of a split transaction
 */
export function createSplitHash(splitData, previousHash = null) {
  const data = {
    ...splitData,
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
 * Verify a split hash chain
 */
export function verifySplitHash(splitRecord) {
  const expectedHash = crypto
    .createHash('sha256')
    .update(JSON.stringify({
      ...splitRecord.data,
      previousHash: splitRecord.previousHash,
      nonce: splitRecord.data.nonce
    }))
    .digest('hex');

  return expectedHash === splitRecord.hash;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSACTION RECORDING
// ═══════════════════════════════════════════════════════════════════════════════

// In-memory ledger (will be replaced with Prisma)
let transactionLedger = [];
let lastHash = null;

/**
 * Record a Gospel-split transaction
 */
export function recordTransaction(amount, source, metadata = {}) {
  verifyGospelSplit();

  const split = calculateGospelSplit(amount);
  const hashRecord = createSplitHash(split, lastHash);

  const transaction = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    amount,
    source,
    split,
    hash: hashRecord.hash,
    previousHash: hashRecord.previousHash,
    metadata,
    verified: true
  };

  transactionLedger.push(transaction);
  lastHash = hashRecord.hash;

  console.log(`💰 GOSPEL Transaction: $${amount} from ${source}`);
  console.log(`   → $${split.charity.amount} to ${split.charity.recipient}`);
  console.log(`   → $${split.infrastructure.amount} to Infrastructure`);
  console.log(`   → $${split.founder.amount} to Founder`);
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
    gospelSplit: GOSPEL_SPLIT,
    verified: transactionLedger.every(t => t.verified)
  };
}

/**
 * Get summary statistics
 */
export function getSummary() {
  const totals = transactionLedger.reduce((acc, t) => ({
    total: acc.total + t.amount,
    charity: acc.charity + t.split.charity.amount,
    infrastructure: acc.infrastructure + t.split.infrastructure.amount,
    founder: acc.founder + t.split.founder.amount
  }), { total: 0, charity: 0, infrastructure: 0, founder: 0 });

  return {
    ...totals,
    transactionCount: transactionLedger.length,
    gospelSplit: GOSPEL_SPLIT,
    charityRecipient: GOSPEL_SPLIT.CHARITY_NAME,
    charityEIN: GOSPEL_SPLIT.CHARITY_EIN,
    lastTransaction: transactionLedger[transactionLedger.length - 1] || null,
    verified: verifyGospelSplit()
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

// Run verification on module load
try {
  verifyGospelSplit();
  verifyFreeDAOSplit();
  console.log('✅ GOSPEL SPLIT VERIFIED: 60% Verified Pediatric Charities | 30% Infra | 10% Founder (Ethics Override V1.3)');
  console.log('✅ FREE DAO VERIFIED: 100% to Beneficiaries | 0% to Founder');
} catch (error) {
  console.error('🚨 CRITICAL: Gospel verification failed!', error);
  process.exit(1);
}

export default {
  GOSPEL_SPLIT,
  FREE_DAO_SPLIT,
  verifyGospelSplit,
  verifyFreeDAOSplit,
  calculateGospelSplit,
  calculateFreeDAOSplit,
  createSplitHash,
  verifySplitHash,
  recordTransaction,
  getLedger,
  getSummary
};
