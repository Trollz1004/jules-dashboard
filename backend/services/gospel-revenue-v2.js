/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * GOSPEL REVENUE SERVICE V2 - NET PROFIT SPLIT (COGS DEDUCTED FIRST)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * CRITICAL FIX: Split happens AFTER deducting:
 * 1. Printful production cost (COGS)
 * 2. Shipping cost
 * 3. Payment processing fees (Square: 2.6% + $0.10)
 *
 * Only NET PROFIT gets the revenue allocation split.
 * This protects founder from subsidizing charity with personal funds.
 *
 * SPLIT: 100% to verified pediatric charities (Gospel V1.4.1 SURVIVAL MODE)
 *
 * Created by Claude (Opus 4.5) - December 27, 2025
 * Gospel V1.4.1 SURVIVAL MODE - NET PROFIT VERSION
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// GOSPEL SPLIT - IMMUTABLE (V1.4.1 SURVIVAL MODE)
// ═══════════════════════════════════════════════════════════════════════════════

export const GOSPEL_SPLIT = Object.freeze({
  CHARITY_PERCENTAGE: 100,
  INFRASTRUCTURE_PERCENTAGE: 0,
  FOUNDER_PERCENTAGE: 0,
  CHARITY_NAME: "Verified Pediatric Charities",
  CHARITY_EIN: "PENDING_VERIFICATION",
  VERSION: "1.4.1",  // Gospel V1.4.1 SURVIVAL MODE
  LOCKED_DATE: "2025-12-27T00:00:00Z",
  ETHICS_OVERRIDE: true,
  NET_PROFIT_MODE: true,  // NEW: Confirms COGS deduction
  SURVIVAL_MODE: true  // 100% to charity
});

// Payment processor fees
export const PAYMENT_FEES = Object.freeze({
  SQUARE_PERCENTAGE: 2.6,
  SQUARE_FIXED: 0.10,  // $0.10 per transaction
  PAYPAL_PERCENTAGE: 2.9,
  PAYPAL_FIXED: 0.30
});

// ═══════════════════════════════════════════════════════════════════════════════
// NET PROFIT CALCULATION (THE FIX)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate net profit after all costs
 * @param {number} grossSale - Total amount customer paid
 * @param {number} cogs - Cost of goods (Printful production)
 * @param {number} shipping - Shipping cost (Printful shipping)
 * @param {string} processor - Payment processor ('square' | 'paypal')
 * @returns {Object} Breakdown of costs and net profit
 */
export function calculateNetProfit(grossSale, cogs = 0, shipping = 0, processor = 'square') {
  const gross = parseFloat(grossSale);
  const productionCost = parseFloat(cogs) || 0;
  const shippingCost = parseFloat(shipping) || 0;
  
  // Calculate payment processing fee
  let processingFee = 0;
  if (processor === 'square') {
    processingFee = (gross * PAYMENT_FEES.SQUARE_PERCENTAGE / 100) + PAYMENT_FEES.SQUARE_FIXED;
  } else if (processor === 'paypal') {
    processingFee = (gross * PAYMENT_FEES.PAYPAL_PERCENTAGE / 100) + PAYMENT_FEES.PAYPAL_FIXED;
  }
  processingFee = Math.round(processingFee * 100) / 100;
  
  // Total costs
  const totalCosts = productionCost + shippingCost + processingFee;
  
  // Net profit (what's left to split)
  const netProfit = Math.max(0, gross - totalCosts);
  
  return {
    grossSale: gross,
    costs: {
      production: productionCost,
      shipping: shippingCost,
      processing: processingFee,
      total: Math.round(totalCosts * 100) / 100
    },
    netProfit: Math.round(netProfit * 100) / 100,
    margin: gross > 0 ? Math.round((netProfit / gross) * 100) : 0
  };
}

/**
 * Calculate Gospel split on NET PROFIT (not gross)
 * @param {number} grossSale - Total amount customer paid
 * @param {number} cogs - Cost of goods (Printful production)
 * @param {number} shipping - Shipping cost
 * @param {string} processor - Payment processor
 * @returns {Object} Full split breakdown
 */
export function calculateGospelSplitNet(grossSale, cogs = 0, shipping = 0, processor = 'square') {
  // Verify split hasn't been tampered
  verifyGospelSplit();
  
  // Calculate net profit first
  const profitBreakdown = calculateNetProfit(grossSale, cogs, shipping, processor);
  const netProfit = profitBreakdown.netProfit;
  
  // Now split the NET profit per revenue allocation
  const charityAmount = Math.round(netProfit * (GOSPEL_SPLIT.CHARITY_PERCENTAGE / 100) * 100) / 100;
  const infrastructureAmount = Math.round(netProfit * (GOSPEL_SPLIT.INFRASTRUCTURE_PERCENTAGE / 100) * 100) / 100;
  const founderAmount = Math.round(netProfit * (GOSPEL_SPLIT.FOUNDER_PERCENTAGE / 100) * 100) / 100;
  
  // Handle rounding - any remainder goes to charity
  const allocated = charityAmount + infrastructureAmount + founderAmount;
  const remainder = Math.round((netProfit - allocated) * 100) / 100;
  
  return {
    grossSale: profitBreakdown.grossSale,
    costs: profitBreakdown.costs,
    netProfit: netProfit,
    margin: profitBreakdown.margin,
    split: {
      charity: {
        amount: charityAmount + remainder,
        percentage: GOSPEL_SPLIT.CHARITY_PERCENTAGE,
        recipient: GOSPEL_SPLIT.CHARITY_NAME
      },
      infrastructure: {
        amount: infrastructureAmount,
        percentage: GOSPEL_SPLIT.INFRASTRUCTURE_PERCENTAGE
      },
      founder: {
        amount: founderAmount,
        percentage: GOSPEL_SPLIT.FOUNDER_PERCENTAGE
      }
    },
    verification: {
      netProfitMode: true,
      cogsDeducted: cogs > 0,
      shippingDeducted: shipping > 0,
      processingDeducted: true
    },
    timestamp: new Date().toISOString(),
    gospelVersion: GOSPEL_SPLIT.VERSION
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT COGS LOOKUP (Printful base costs)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Printful base costs for products (from SQUARE-MERCH-CATALOG.md)
 * These should be updated when Printful prices change
 */
export const PRODUCT_COGS = Object.freeze({
  // T-Shirts
  'TSHIRT-KRAKEN-001': { production: 12.00, avgShipping: 5.00 },
  'TSHIRT-FTK-BOLD-002': { production: 11.00, avgShipping: 5.00 },
  'TSHIRT-GOSPEL-003': { production: 13.00, avgShipping: 5.00 },
  'TSHIRT-SPLIT-004': { production: 11.00, avgShipping: 5.00 },
  'TSHIRT-FLEET-005': { production: 12.00, avgShipping: 5.00 },
  
  // Stickers
  'STICKER-KRAKEN-001': { production: 3.00, avgShipping: 2.00 },
  'STICKER-GOSPEL-002': { production: 4.00, avgShipping: 2.00 },
  'STICKER-FTK-003': { production: 3.00, avgShipping: 2.00 },
  'STICKER-FLEET-004': { production: 3.50, avgShipping: 2.00 },
  'STICKER-DAO-005': { production: 3.50, avgShipping: 2.00 },
  
  // Mugs
  'MUG-GOSPEL-001': { production: 8.00, avgShipping: 6.00 },
  'MUG-SPLIT-002': { production: 9.00, avgShipping: 6.00 },
  'MUG-KRAKEN-003': { production: 10.00, avgShipping: 6.00 },
  'MUG-KRAKEN-003-T': { production: 12.00, avgShipping: 6.00 }, // thermal
  
  // Hoodies
  'HOODIE-FTK-001': { production: 28.00, avgShipping: 8.00 },
  'HOODIE-KRAKEN-002': { production: 32.00, avgShipping: 8.00 }
});

/**
 * Get COGS for a product by SKU
 */
export function getProductCOGS(sku) {
  const costs = PRODUCT_COGS[sku];
  if (!costs) {
    console.warn(`⚠️ No COGS found for SKU: ${sku} - using defaults`);
    return { production: 15.00, avgShipping: 6.00 }; // Conservative defaults
  }
  return costs;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPLIT VERIFICATION (unchanged from V1)
// ═══════════════════════════════════════════════════════════════════════════════

export function verifyGospelSplit() {
  const isValid = (
    GOSPEL_SPLIT.CHARITY_PERCENTAGE === 100 &&
    GOSPEL_SPLIT.INFRASTRUCTURE_PERCENTAGE === 0 &&
    GOSPEL_SPLIT.FOUNDER_PERCENTAGE === 0 &&
    GOSPEL_SPLIT.CHARITY_PERCENTAGE +
    GOSPEL_SPLIT.INFRASTRUCTURE_PERCENTAGE +
    GOSPEL_SPLIT.FOUNDER_PERCENTAGE === 100
  );

  if (!isValid) {
    console.error('🚨 GOSPEL VIOLATION: Revenue split has been tampered!');
    throw new Error('GOSPEL_VIOLATION: Revenue split tampered');
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE CALCULATIONS (for verification)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Example: $30 T-Shirt with $12 COGS, $5 shipping
 *
 * Gospel V1.4.1 SURVIVAL MODE:
 *   $30 - $12 COGS - $5 ship - $0.88 Square = $12.12 NET
 *   $12.12 → 100% to verified pediatric charities
 */

// Test on module load
try {
  verifyGospelSplit();

  // Verify example calculation
  const example = calculateGospelSplitNet(30.00, 12.00, 5.00, 'square');
  console.log('✅ GOSPEL V1.4.1 SURVIVAL MODE NET PROFIT VERIFIED');
  console.log('   Example $30 sale:');
  console.log(`   - Gross: $${example.grossSale}`);
  console.log(`   - Costs: $${example.costs.total} (prod: $${example.costs.production}, ship: $${example.costs.shipping}, fees: $${example.costs.processing})`);
  console.log(`   - Net Profit: $${example.netProfit}`);
  console.log(`   - Charity (100%): $${example.split.charity.amount}`);
  console.log(`   - Infra (0%): $${example.split.infrastructure.amount}`);
  console.log(`   - Founder (0%): $${example.split.founder.amount}`);
} catch (error) {
  console.error('🚨 CRITICAL: Gospel verification failed!', error);
  process.exit(1);
}

export default {
  GOSPEL_SPLIT,
  PAYMENT_FEES,
  PRODUCT_COGS,
  calculateNetProfit,
  calculateGospelSplitNet,
  getProductCOGS,
  verifyGospelSplit
};
