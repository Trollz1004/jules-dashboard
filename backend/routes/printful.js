/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PRINTFUL WEBHOOK HANDLER - DAO Treasury
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Handles Printful order fulfillment events and integrates with Gospel split
 *
 * Events Handled:
 * - package_shipped → Update order status to SHIPPED
 * - package_returned → Handle returns
 * - order_put_hold → Log alert
 * - stock_updated → Log inventory change
 *
 * DAO Revenue Model: 100% DAO Treasury
 * - 100% DAO Treasury
 * - 30% → Infrastructure & Operations
 * - 10% → Founder
 *
 * Created by Claude (Haiku 4.5) - December 7, 2025
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import express from 'express';
import crypto from 'crypto';
import prisma from '../prisma/client.js';
import { calculateRevenueAllocation, recordTransaction } from '../services/dao-revenue.js';

const router = express.Router();

// ═══════════════════════════════════════════════════════════════════════════════
// PRINTFUL WEBHOOK SIGNATURE VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Verify Printful webhook signature
 * Printful uses HMAC-SHA256 with the API token
 * https://developers.printful.com/docs/#/webhooks/validate
 */
function verifyPrintfulWebhookSignature(body, signature, apiToken) {
  if (!signature || !apiToken) {
    return false;
  }

  try {
    const hmac = crypto.createHmac('sha256', apiToken);
    hmac.update(body);
    const expectedSignature = hmac.digest('base64');
    return expectedSignature === signature;
  } catch (error) {
    console.error('❌ SIGNATURE VERIFICATION ERROR:', error);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Handle package_shipped event
 * Updates order status to SHIPPED and records transaction
 */
async function handlePackageShipped(event) {
  try {
    const { order_id, tracking_number, carrier, package_id } = event.data;

    console.log('📦 PACKAGE SHIPPED EVENT:', {
      orderId: order_id,
      packageId: package_id,
      carrier: carrier,
      trackingNumber: tracking_number
    });

    // Find order by Printful order ID
    const order = await prisma.order.findUnique({
      where: { printfulOrderId: order_id.toString() },
      include: { items: true }
    });

    if (!order) {
      console.warn('⚠️ ORDER NOT FOUND for Printful order:', order_id);
      return;
    }

    // Update order status to SHIPPED
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'SHIPPED',
        shippingDetails: {
          trackingNumber: tracking_number,
          carrier: carrier,
          packageId: package_id,
          shippedAt: new Date().toISOString()
        },
        updatedAt: new Date()
      }
    });

    console.log('✅ ORDER STATUS UPDATED TO SHIPPED:', {
      orderId: order.visibleId,
      printfulOrderId: order_id,
      carrier: carrier,
      trackingNumber: tracking_number,
      mission: 'DAO Treasury'
    });

    return updatedOrder;

  } catch (error) {
    console.error('❌ ERROR HANDLING PACKAGE SHIPPED:', error);
    throw error;
  }
}

/**
 * Handle package_returned event
 * Logs returns and updates order status
 */
async function handlePackageReturned(event) {
  try {
    const { order_id, tracking_number, package_id } = event.data;

    console.log('📬 PACKAGE RETURNED EVENT:', {
      orderId: order_id,
      packageId: package_id,
      trackingNumber: tracking_number
    });

    // Find order by Printful order ID
    const order = await prisma.order.findUnique({
      where: { printfulOrderId: order_id.toString() },
      include: { items: true }
    });

    if (!order) {
      console.warn('⚠️ ORDER NOT FOUND for Printful order:', order_id);
      return;
    }

    // Update order status to RETURNED
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'RETURNED',
        shippingDetails: {
          ...order.shippingDetails,
          returnedAt: new Date().toISOString(),
          returnTrackingNumber: tracking_number,
          returnPackageId: package_id
        },
        updatedAt: new Date()
      }
    });

    console.log('⚠️ RETURN PROCESSED:', {
      orderId: order.visibleId,
      printfulOrderId: order_id,
      trackingNumber: tracking_number,
      status: 'RETURNED'
    });

    return updatedOrder;

  } catch (error) {
    console.error('❌ ERROR HANDLING PACKAGE RETURNED:', error);
    throw error;
  }
}

/**
 * Handle order_put_hold event
 * Logs alert when order is placed on hold
 */
async function handleOrderPutOnHold(event) {
  try {
    const { order_id, reason, hold_reason } = event.data;

    console.log('⏸️ ORDER PUT ON HOLD:', {
      orderId: order_id,
      reason: reason || hold_reason,
      timestamp: new Date().toISOString()
    });

    // Find order by Printful order ID
    const order = await prisma.order.findUnique({
      where: { printfulOrderId: order_id.toString() }
    });

    if (order) {
      // Update order with hold status
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'ON_HOLD',
          metadata: {
            ...order.metadata,
            holdReason: reason || hold_reason,
            holdedAt: new Date().toISOString()
          }
        }
      });

      console.log('✅ ORDER HOLD RECORDED:', {
        orderId: order.visibleId,
        printfulOrderId: order_id,
        reason: reason || hold_reason
      });
    }

  } catch (error) {
    console.error('❌ ERROR HANDLING ORDER HOLD:', error);
    // Don't throw - this is informational
  }
}

/**
 * Handle stock_updated event
 * Logs inventory changes from Printful
 */
async function handleStockUpdated(event) {
  try {
    const { product_id, variant_id, available, warehouse, location } = event.data;

    console.log('📊 STOCK UPDATED:', {
      productId: product_id,
      variantId: variant_id,
      available: available,
      warehouse: warehouse,
      location: location,
      timestamp: new Date().toISOString()
    });

    // Find product by Printful ID
    const product = await prisma.product.findFirst({
      where: {
        metadata: {
          path: ['printfulProductId'],
          equals: product_id.toString()
        }
      }
    });

    if (product && variant_id) {
      // Find or create variant
      const variant = await prisma.variant.findFirst({
        where: {
          productId: product.id,
          metadata: {
            path: ['printfulVariantId'],
            equals: variant_id.toString()
          }
        }
      });

      if (variant) {
        // Update stock quantity
        await prisma.variant.update({
          where: { id: variant.id },
          data: {
            stockQuantity: available,
            metadata: {
              ...variant.metadata,
              lastStockUpdate: new Date().toISOString(),
              warehouse: warehouse,
              location: location
            }
          }
        });

        console.log('✅ STOCK UPDATED IN DATABASE:', {
          productId: product.id,
          variantId: variant.id,
          newQuantity: available
        });
      }
    }

  } catch (error) {
    console.error('❌ ERROR HANDLING STOCK UPDATE:', error);
    // Don't throw - this is informational
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/webhook/printful - Main webhook handler
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/', express.json(), async (req, res) => {
  try {
    const signature = req.headers['x-printful-signature'];
    const apiToken = process.env.PRINTFUL_API_TOKEN;

    // Verify webhook signature
    if (apiToken && !verifyPrintfulWebhookSignature(JSON.stringify(req.body), signature, apiToken)) {
      console.error('❌ INVALID PRINTFUL WEBHOOK SIGNATURE');
      return res.status(403).json({ error: 'Invalid signature' });
    }

    const { type, data } = req.body;

    if (!type) {
      console.warn('⚠️ WEBHOOK RECEIVED WITH NO TYPE:', req.body);
      return res.status(400).json({ error: 'Missing event type' });
    }

    console.log('📥 PRINTFUL WEBHOOK RECEIVED:', type);

    // Route to appropriate handler
    switch (type) {
      case 'package_shipped': {
        await handlePackageShipped({ type, data });
        break;
      }

      case 'package_returned': {
        await handlePackageReturned({ type, data });
        break;
      }

      case 'order_put_hold': {
        await handleOrderPutOnHold({ type, data });
        break;
      }

      case 'stock_updated': {
        await handleStockUpdated({ type, data });
        break;
      }

      case 'order_remove_hold': {
        console.log('✅ ORDER HOLD REMOVED:', data.order_id);
        // Find and update order
        const order = await prisma.order.findUnique({
          where: { printfulOrderId: data.order_id.toString() }
        });
        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: 'PROCESSING',
              metadata: {
                ...order.metadata,
                holdRemoved: true,
                holdRemovedAt: new Date().toISOString()
              }
            }
          });
        }
        break;
      }

      case 'product_updated': {
        console.log('📦 PRODUCT UPDATED:', {
          productId: data.product_id,
          syncProductId: data.sync_product_id,
          timestamp: new Date().toISOString()
        });
        break;
      }

      default: {
        console.log('ℹ️ UNHANDLED PRINTFUL EVENT:', type);
      }
    }

    // Always return 200 OK to acknowledge receipt
    res.json({
      received: true,
      event: type,
      mission: 'DAO Treasury'
    });

  } catch (error) {
    console.error('❌ PRINTFUL WEBHOOK ERROR:', error);
    // Return 200 OK even on error to prevent Printful retries
    // Log the error for manual investigation
    res.status(200).json({
      received: true,
      error: error.message,
      note: 'Error logged for manual review'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/webhook/printful/fulfillment-fee - Record fulfillment fee transaction
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * When an order is fulfilled, Printful charges a fulfillment fee.
 * This endpoint records that fee and applies Gospel split to it.
 *
 * Called by internal processes when an order reaches "fulfilled" status
 */
router.post('/fulfillment-fee', express.json(), async (req, res) => {
  try {
    const { orderId, fulfillmentFee } = req.body;

    if (!orderId || !fulfillmentFee) {
      return res.status(400).json({
        error: 'orderId and fulfillmentFee are required'
      });
    }

    const fee = parseFloat(fulfillmentFee);

    if (isNaN(fee) || fee < 0) {
      return res.status(400).json({
        error: 'fulfillmentFee must be a positive number'
      });
    }

    // Find order
    const order = await prisma.order.findUnique({
      where: { visibleId: orderId }
    });

    if (!order) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }

    // Calculate Gospel split for fulfillment fee
    const allocation = calculateRevenueAllocation(fee);

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        amount: fee.toString(),
        source: 'PRINTFUL_FULFILLMENT',
        projectType: 'EXISTING',
        description: `Printful Fulfillment Fee for Order ${orderId}`,
        treasuryAmount: allocation.treasury.amount.toString(),
        opsAmount: allocation.treasury.amount.toString(),
        founderAmount: allocation.treasury.amount.toString(),
        metadata: {
          orderId: order.id,
          orderVisibleId: order.visibleId,
          printfulOrderId: order.printfulOrderId,
          fulfillmentFee: fee.toString()
        }
      }
    });

    // Record in DAO ledger
    recordTransaction(
      fee,
      'PRINTFUL_FULFILLMENT',
      {
        orderId: order.visibleId,
        printfulOrderId: order.printfulOrderId
      }
    );

    console.log('💰 FULFILLMENT FEE RECORDED:', {
      orderId: order.visibleId,
      fee: `$${fee.toFixed(2)}`,
      treasuryAmount: `$${allocation.treasury.amount}`,
      treasuryName: allocation.treasury.recipient,
      transactionId: transaction.id,
      mission: 'DAO Treasury'
    });

    res.json({
      success: true,
      transactionId: transaction.id,
      orderId: order.visibleId,
      fee: fee.toFixed(2),
      daoRevenue: {
        charity: allocation.treasury.amount.toString(),
        treasuryName: allocation.treasury.recipient,
        infrastructure: allocation.treasury.amount.toString(),
        founder: allocation.treasury.amount.toString()
      },
      mission: 'DAO Treasury'
    });

  } catch (error) {
    console.error('❌ FULFILLMENT FEE RECORDING ERROR:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/webhook/printful/test - Health check (DISABLED IN PRODUCTION)
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/test', async (req, res) => {
  // Production: Test endpoint disabled - no fake transactions
  res.status(403).json({
    success: false,
    message: 'Test endpoint disabled. Use /health instead.',
    policy: 'ZERO TOLERANCE FOR FAKE DATA'
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/webhook/printful/health - Health check endpoint
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      service: 'printful-webhook',
      timestamp: new Date().toISOString(),
      daoRevenue: {
        model: '100% DAO Treasury'
      }
    });

  } catch (error) {
    console.error('HEALTH CHECK FAILED:', error);
    res.status(500).json({
      status: 'error',
      service: 'printful-webhook',
      error: error.message
    });
  }
});

export default router;
