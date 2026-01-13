/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MERCH STORE API ROUTES - DAO Treasury
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Anti-AI Merchandise Store with Gospel-Compliant Revenue Split
 *
 * 100% DAO Treasury
 * 30% → Infrastructure & Operations
 * 10% → Founder
 *
 * SQUARE-ONLY Integration (Stripe removed Dec 2025)
 * Webhook Processing for Order Fulfillment
 *
 * Created by Claude (Haiku 4.5) - December 7, 2025
 * Updated: December 22, 2025 - Stripe removed, Square-only
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import express from 'express';
import crypto from 'crypto';
import prisma from '../prisma/client.js';
import { calculateRevenueAllocation, DAO_REVENUE_CONFIG, recordTransaction } from '../services/dao-revenue.js';

const router = express.Router();

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/merch/products - List all active products with variants
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      include: {
        variants: {
          where: { stockQuantity: { gt: 0 } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform for API response
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      imageUrl: product.imageUrl,
      category: product.category,
      sku: product.sku,
      inStock: product.variants.some(v => v.stockQuantity > 0),
      variants: product.variants.map(variant => ({
        id: variant.id,
        size: variant.size,
        color: variant.color,
        sku: variant.sku,
        price: variant.price ? variant.price.toString() : product.price.toString(),
        stockQuantity: variant.stockQuantity,
        inStock: variant.stockQuantity > 0
      }))
    }));

    res.json({
      success: true,
      count: formattedProducts.length,
      products: formattedProducts,
      daoModel: '100% DAO Treasury',
      daoRevenue: {
        treasury: DAO_REVENUE_CONFIG.TREASURY_PERCENTAGE,
        platformName: DAO_REVENUE_CONFIG.PLATFORM_NAME
      }
    });

  } catch (error) {
    console.error('❌ PRODUCTS LIST ERROR:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      message: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/merch/products/:id - Get single product with variants
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          where: { stockQuantity: { gt: 0 } }
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const response = {
      success: true,
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        imageUrl: product.imageUrl,
        category: product.category,
        sku: product.sku,
        active: product.active,
        inStock: product.variants.some(v => v.stockQuantity > 0),
        variants: product.variants.map(variant => ({
          id: variant.id,
          size: variant.size,
          color: variant.color,
          sku: variant.sku,
          price: variant.price ? variant.price.toString() : product.price.toString(),
          stockQuantity: variant.stockQuantity,
          inStock: variant.stockQuantity > 0
        }))
      },
      daoModel: '100% DAO Treasury'
    };

    res.json(response);

  } catch (error) {
    console.error('❌ PRODUCT DETAILS ERROR:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product',
      message: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/merch/checkout - DEPRECATED - Use Square checkout links directly
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/checkout', async (req, res) => {
  // Stripe checkout is deprecated - use Square links directly from ai-solutions.store
  res.status(410).json({
    success: false,
    error: 'Stripe checkout deprecated - Migrated to Square (December 2025)',
    message: 'Please use Square checkout links directly from ai-solutions.store',
    alternative: '/api/merch/square-checkout',
    daoModel: '100% DAO Treasury'
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/merch/webhook - DEPRECATED - Use /api/ai-store-webhook for Square
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/webhook', async (req, res) => {
  // Stripe webhook deprecated - Square webhooks go to /api/ai-store-webhook
  res.status(410).json({
    success: false,
    error: 'Stripe webhook deprecated - Migrated to Square (December 2025)',
    alternative: '/api/ai-store-webhook',
    daoModel: '100% DAO Treasury'
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/merch/order/:orderId - Get order details
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { visibleId: orderId },
      include: {
        items: {
          include: {
            product: true,
            variant: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      order: {
        id: order.visibleId,
        email: order.email,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items.map(item => ({
          product: item.product.name,
          variant: item.variant ? `${item.variant.color || ''}${item.variant.color && item.variant.size ? ' ' : ''}${item.variant.size || ''}`.trim() : null,
          quantity: item.quantity,
          priceEach: item.priceEach
        }))
      }
    });

  } catch (error) {
    console.error('❌ ORDER DETAILS ERROR:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order',
      message: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/merch/session/:sessionId - DEPRECATED - Stripe removed
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/session/:sessionId', async (req, res) => {
  res.status(410).json({
    success: false,
    error: 'Stripe session lookup deprecated - Migrated to Square (December 2025)',
    message: 'Square payments use direct checkout links, no session lookup needed',
    daoModel: '100% DAO Treasury'
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/merch/config - Get Square configuration for frontend
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/config', (req, res) => {
  res.json({
    success: true,
    square: {
      applicationId: process.env.SQUARE_MERCH_APPLICATION_ID || process.env.SQUARE_APPLICATION_ID,
      locationId: process.env.SQUARE_MERCH_LOCATION_ID,
      environment: 'production'
    },
    daoRevenue: {
      treasuryPercentage: 100
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/merch/square-checkout - Create Square payment for merch (LIVE REVENUE)
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/square-checkout', async (req, res) => {
  try {
    const { sourceId, amount, currency, productName, customer } = req.body;

    // Validate input
    if (!sourceId || !amount || !customer?.email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sourceId, amount, customer.email'
      });
    }

    // Import Square SDK
    const { Client, Environment } = await import('square');

    // Initialize Square client with MERCH credentials
    const client = new Client({
      accessToken: process.env.SQUARE_MERCH_ACCESS_TOKEN,
      environment: Environment.Production
    });

    const { paymentsApi } = client;

    // Generate idempotency key
    const idempotencyKey = `merch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create payment
    const paymentResponse = await paymentsApi.createPayment({
      sourceId,
      idempotencyKey,
      amountMoney: {
        amount: BigInt(amount),
        currency: currency || 'USD'
      },
      locationId: process.env.SQUARE_MERCH_LOCATION_ID,
      note: `Merch: ${productName}`,
      buyerEmailAddress: customer.email,
      referenceId: `MERCH-${Date.now()}`
    });

    if (paymentResponse.result.payment) {
      const payment = paymentResponse.result.payment;
      const totalAmount = Number(payment.amountMoney.amount) / 100;

      // Calculate Gospel split
      const allocation = calculateRevenueAllocation(totalAmount);

      // Record transaction
      const transaction = await prisma.transaction.create({
        data: {
          amount: totalAmount.toString(),
          source: 'SQUARE_MERCH',
          projectType: 'EXISTING',
          description: `Merch Purchase: ${productName}`,
          treasuryAmount: allocation.treasury.amount.toString(),
          opsAmount: allocation.treasury.amount.toString(),
          founderAmount: allocation.treasury.amount.toString(),
          metadata: {
            paymentId: payment.id,
            productName,
            customerEmail: customer.email,
            customerName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
            squareReceiptUrl: payment.receiptUrl
          }
        }
      });

      console.log('💰 SQUARE MERCH PAYMENT SUCCESS:', {
        paymentId: payment.id,
        product: productName,
        total: `$${totalAmount.toFixed(2)}`,
        charity: `$${allocation.treasury.amount}`,
        email: customer.email,
        transactionId: transaction.id,
        daoModel: '100% DAO Treasury'
      });

      res.json({
        success: true,
        paymentId: payment.id,
        receiptUrl: payment.receiptUrl,
        total: totalAmount.toFixed(2),
        daoRevenue: {
          charity: allocation.treasury.amount.toString(),
          treasuryPercentage: allocation.treasury.percentage,
          infrastructure: allocation.treasury.amount.toString(),
          founder: allocation.treasury.amount.toString()
        },
        transactionId: transaction.id,
        message: `Thank you! $${allocation.treasury.amount} going to kids!`
      });

    } else {
      throw new Error('Payment creation failed - no payment returned');
    }

  } catch (error) {
    console.error('❌ SQUARE MERCH PAYMENT ERROR:', error);

    // Extract Square API error details
    let errorMessage = 'Payment processing failed';
    if (error.result?.errors) {
      errorMessage = error.result.errors.map(e => e.detail || e.code).join(', ');
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.result?.errors || []
    });
  }
});

export default router;
