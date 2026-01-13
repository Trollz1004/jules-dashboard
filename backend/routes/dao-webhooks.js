/**
 * DAO WEBHOOKS - Payment Integration for Triple DAO Launch
 * ═══════════════════════════════════════════════════════════════
 *
 * Handles payment webhooks for:
 * 1. YouAndINotAI Dating DAO (LOVE token, Square payments)
 * 2. Ai-Solutions.Store Marketplace DAO (AIMARKET token)
 * 3. Self-Host Marketplace DAO (Stripe subscriptions)
 *
 * DAO Revenue Model: 100% DAO Treasury
 * DAO Treasury
 */

import express from 'express';
import crypto from 'crypto';
import { recordTransaction, DAO_REVENUE_CONFIG, calculateRevenueAllocation } from '../services/dao-revenue.js';
import sgMail from '@sendgrid/mail';

const router = express.Router();

// Initialize SendGrid for product delivery emails
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// AI Solutions Store Product Catalog (price in cents -> product info)
const AI_STORE_PRODUCTS = {
  29900: { id: 'claude-droid', name: 'Claude Droid', type: 'software', repo: 'claude-droid' },
  49900: { id: 'income-droid', name: 'Income Droid', type: 'software', repo: 'income-droid' },
  19900: { id: 'marketing-engine', name: 'Marketing Engine', type: 'software', repo: 'marketing-engine' },
  39900: { id: 'jules-ai', name: 'Jules AI', type: 'software', repo: 'jules-ai' },
  59900: { id: 'affiliate-system', name: 'Affiliate System', type: 'software', repo: 'affiliate-system' },
  249900: { id: 'dating-platform', name: 'YouAndINotAI Dating Platform', type: 'software', repo: 'dating-platform' },
  9900: { id: 'consultation', name: 'AI Consultation - 30 min', type: 'consultation' },
  // Merch handled by Printful automatically
  2999: { id: 'anti-ai-tee', name: 'Anti-AI T-Shirt', type: 'merch' },
  5499: { id: 'anti-ai-hoodie', name: 'Anti-AI Hoodie', type: 'merch' },
  2499: { id: 'kid-ai-tee', name: 'Kid AI Creator T-Shirt', type: 'merch' },
  1999: { id: 'anti-ai-mug', name: 'Human Verified Coffee Mug', type: 'merch' },
  999: { id: 'sticker-pack', name: 'Anti-AI Sticker Pack', type: 'merch' },
  8999: { id: 'merch-bundle', name: 'Ultimate Merch Bundle', type: 'merch' },
};

// DAO Service URLs
const DAO_SERVICES = {
  governance: 'http://192.168.0.103:4002', // 9020 node
  dating: 'http://localhost:4003',
  marketplace: 'http://localhost:4004'
};

// ═══════════════════════════════════════════════════════════════════════════════
// SQUARE WEBHOOK - Dating DAO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /webhook/square-dating
 * Handle Square payments for YouAndINotAI Dating platform
 */
router.post('/square-dating', async (req, res) => {
  const signature = req.headers['x-square-hmacsha256-signature'];
  const webhookSecret = process.env.SQUARE_WEBHOOK_SECRET;

  // Verify webhook signature
  if (!verifySquareSignature(req.body, signature, webhookSecret)) {
    console.warn('[DATING-WEBHOOK] Invalid signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { type, data } = req.body;

  try {
    switch (type) {
      case 'payment.completed':
        await handleDatingPayment(data.object.payment);
        break;

      case 'subscription.created':
        await handleDatingSubscription(data.object.subscription, 'created');
        break;

      case 'subscription.updated':
        await handleDatingSubscription(data.object.subscription, 'updated');
        break;

      case 'invoice.payment_made':
        await handleDatingInvoice(data.object.invoice);
        break;

      default:
        console.log(`[DATING-WEBHOOK] Unhandled event: ${type}`);
    }

    res.status(200).json({ received: true, type });
  } catch (error) {
    console.error('[DATING-WEBHOOK] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function handleDatingPayment(payment) {
  const amountCents = payment.amount_money?.amount;
  const amount = amountCents / 100; // cents to dollars

  // Check if this is an AI Store product
  const aiStoreProduct = AI_STORE_PRODUCTS[amountCents];
  if (aiStoreProduct) {
    console.log(`[AI-STORE] Product purchased: ${aiStoreProduct.name} - $${amount}`);
    await sendAIStoreDeliveryEmail(payment, aiStoreProduct);
  }

  // Record revenue to DAO Treasury
  const allocation = calculateRevenueAllocation(amount);

  console.log(`[PAYMENT] Payment received: ${amount}`);
  console.log(`  - DAO Treasury: ${allocation.treasury.amount}`);

  // Forward to Dating DAO service
  try {
    await fetch(`${DAO_SERVICES.dating}/revenue/subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        source: 'square',
        userId: payment.buyer_email_address,
        tier: payment.note || 'premium'
      })
    });
  } catch (err) {
    console.error('[DATING-WEBHOOK] Failed to notify Dating DAO:', err);
  }

  // Record to main treasury
  await recordTransaction({
    amount,
    source: 'dating-subscription',
    platform: 'youandinotai',
    paymentId: payment.id
  });
}

async function handleDatingSubscription(subscription, action) {
  console.log(`[DATING] Subscription ${action}: ${subscription.id}`);

  // Update member status in Dating DAO
  if (action === 'created') {
    try {
      await fetch(`${DAO_SERVICES.dating}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: subscription.customer_id,
          userId: subscription.customer_id,
          tier: subscription.plan_id.includes('vip') ? 'vip' : 'premium'
        })
      });
    } catch (err) {
      console.error('[DATING-WEBHOOK] Failed to create subscription:', err);
    }
  }
}

async function handleDatingInvoice(invoice) {
  const amount = invoice.total_money?.amount / 100;
  console.log(`[DATING] Invoice paid: $${amount}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SQUARE WEBHOOK - AI Marketplace (Merch)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /webhook/square-merch
 * Handle Square payments for AI Solutions Store marketplace
 */
router.post('/square-merch', async (req, res) => {
  const signature = req.headers['x-square-hmacsha256-signature'];
  const webhookSecret = process.env.SQUARE_MERCH_WEBHOOK_SECRET;

  if (!verifySquareSignature(req.body, signature, webhookSecret)) {
    console.warn('[MARKETPLACE-WEBHOOK] Invalid signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { type, data } = req.body;

  try {
    switch (type) {
      case 'payment.completed':
        await handleMarketplacePayment(data.object.payment);
        break;

      case 'order.created':
        await handleMarketplaceOrder(data.object.order);
        break;

      default:
        console.log(`[MARKETPLACE-WEBHOOK] Unhandled event: ${type}`);
    }

    res.status(200).json({ received: true, type });
  } catch (error) {
    console.error('[MARKETPLACE-WEBHOOK] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function handleMarketplacePayment(payment) {
  const amount = payment.amount_money?.amount / 100;

  console.log(`[MARKETPLACE] Payment received: $${amount}`);

  // Forward to Marketplace DAO
  try {
    await fetch(`${DAO_SERVICES.marketplace}/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: payment.buyer_email_address,
        productId: payment.note || 'unknown',
        tier: 'standard',
        paymentMethod: 'square'
      })
    });
  } catch (err) {
    console.error('[MARKETPLACE-WEBHOOK] Failed to notify Marketplace DAO:', err);
  }

  await recordTransaction({
    amount,
    source: 'marketplace-sale',
    platform: 'ai-solutions-store',
    paymentId: payment.id
  });
}

async function handleMarketplaceOrder(order) {
  console.log(`[MARKETPLACE] Order created: ${order.id}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRIPE WEBHOOK - Self-Host Marketplace
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /webhook/stripe
 * Handle Stripe subscriptions for Self-Host AI Marketplace
 */
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Stripe signature verification would happen here with Stripe SDK
    // For now, parse the raw body
    event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (err) {
    console.error('[STRIPE-WEBHOOK] Parse error:', err);
    return res.status(400).json({ error: 'Invalid payload' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleStripeCheckout(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleStripeSubscription(event.data.object, 'created');
        break;

      case 'customer.subscription.updated':
        await handleStripeSubscription(event.data.object, 'updated');
        break;

      case 'customer.subscription.deleted':
        await handleStripeSubscription(event.data.object, 'cancelled');
        break;

      case 'invoice.paid':
        await handleStripeInvoice(event.data.object);
        break;

      default:
        console.log(`[STRIPE-WEBHOOK] Unhandled event: ${event.type}`);
    }

    res.status(200).json({ received: true, type: event.type });
  } catch (error) {
    console.error('[STRIPE-WEBHOOK] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function handleStripeCheckout(session) {
  const amount = session.amount_total / 100;

  console.log(`[SELF-HOST] Checkout completed: $${amount}`);

  // Trigger Docker deployment for managed hosting
  if (session.metadata?.modelId) {
    console.log(`[SELF-HOST] Triggering deployment for model: ${session.metadata.modelId}`);
    // Would call deployment API here
  }

  await recordTransaction({
    amount,
    source: 'self-host-subscription',
    platform: 'self-host-marketplace',
    paymentId: session.id
  });
}

async function handleStripeSubscription(subscription, action) {
  console.log(`[SELF-HOST] Subscription ${action}: ${subscription.id}`);

  // Handle subscription lifecycle
  if (action === 'cancelled') {
    console.log(`[SELF-HOST] Stopping deployment for cancelled subscription`);
    // Would trigger Docker container shutdown
  }
}

async function handleStripeInvoice(invoice) {
  const amount = invoice.amount_paid / 100;

  console.log(`[SELF-HOST] Invoice paid: $${amount}`);

  const allocation = calculateRevenueAllocation(amount);
  console.log(`  - DAO Treasury: ${allocation.treasury.amount}`);

  await recordTransaction({
    amount,
    source: 'self-host-renewal',
    platform: 'self-host-marketplace',
    paymentId: invoice.id
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI SOLUTIONS STORE - DELIVERY EMAIL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function sendAIStoreDeliveryEmail(payment, product) {
  const customerEmail = payment.buyer_email_address || payment.receipt_email;
  if (!customerEmail) {
    console.error('[AI-STORE] No customer email found for delivery');
    return;
  }

  const amount = (payment.amount_money.amount / 100).toFixed(2);
  const orderId = payment.id;
  const date = new Date().toLocaleDateString();

  let subject, html;

  if (product.type === 'merch') {
    // Merch handled by Printful - just send confirmation
    subject = `Order Confirmed: ${product.name} - AI Solutions Store`;
    html = `
<!DOCTYPE html>
<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #078EFA;">Order Confirmed!</h1>
  <p>Thank you for purchasing <strong>${product.name}</strong>!</p>
  <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h2 style="color: #CC785C;">What Happens Next</h2>
    <ol>
      <li><strong>Production:</strong> Your order is being printed (1-3 business days)</li>
      <li><strong>Shipping:</strong> You'll receive tracking info via email</li>
      <li><strong>Delivery:</strong> Standard shipping 5-10 business days</li>
    </ol>
  </div>
  <p>Product: ${product.name}<br>Amount: $${amount}<br>Order ID: ${orderId}</p>
  <hr><p style="font-size: 12px; color: #666;"><em>100% DAO Treasury
</body></html>`;

  } else if (product.type === 'consultation') {
    subject = `Book Your Consultation - AI Solutions Store`;
    html = `
<!DOCTYPE html>
<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #078EFA;">Your Consultation is Ready!</h1>
  <div style="background: #078EFA; color: white; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
    <h2 style="margin: 0;">Book Your 30-Minute Session Now</h2>
    <p style="font-size: 18px;"><a href="https://calendly.com/your-booking-link" style="color: white;">https://calendly.com/your-booking-link</a></p>
  </div>
  <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h2 style="color: #CC785C;">Before Your Call</h2>
    <ul>
      <li>Your current business/project overview</li>
      <li>Specific challenges you want to address</li>
      <li>What AI automation outcomes you're hoping for</li>
    </ul>
  </div>
  <p>Order ID: ${orderId} | Amount: $${amount}</p>
  <hr><p style="font-size: 12px; color: #666;"><em>100% DAO Treasury
</body></html>`;

  } else {
    // Software products - GitHub access + setup instructions
    const githubUrl = `https://github.com/Ai-Solutions-Store/${product.repo}`;
    subject = `Access Your ${product.name} - AI Solutions Store`;
    html = `
<!DOCTYPE html>
<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #078EFA;">Your ${product.name} is Ready!</h1>
  <p>Thank you for your purchase! Here's everything you need:</p>

  <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h2 style="color: #CC785C;">Step 1: Get GitHub Access</h2>
    <p><strong>Repository:</strong> <a href="${githubUrl}">${githubUrl}</a></p>
    <p>A GitHub invitation will be sent to <strong>${customerEmail}</strong> within 24 hours.</p>
    <p>If you don't receive it, email support@youandinotai.com with your GitHub username.</p>
  </div>

  <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h2 style="color: #CC785C;">Step 2: Clone & Install</h2>
    <pre style="background: #141413; color: #00ff00; padding: 15px; border-radius: 5px; overflow-x: auto;">
git clone ${githubUrl}.git
cd ${product.repo}
npm install
cp .env.example .env</pre>
  </div>

  <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h2 style="color: #CC785C;">Step 3: Configure API Keys</h2>
    <p>Edit your .env file with keys from:</p>
    <ul>
      <li><a href="https://platform.openai.com/api-keys">OpenAI API Key</a></li>
      <li><a href="https://aistudio.google.com/app/apikey">Gemini API Key</a></li>
      <li><a href="https://replicate.com/account/api-tokens">Replicate Token</a></li>
    </ul>
  </div>

  <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h2 style="color: #CC785C;">Step 4: Run</h2>
    <pre style="background: #141413; color: #00ff00; padding: 15px; border-radius: 5px;">npm start</pre>
    <p>Full documentation in README.md</p>
  </div>

  <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h2 style="color: #CC785C;">Need Help?</h2>
    <p>Email: <a href="mailto:support@youandinotai.com">support@youandinotai.com</a></p>
    <p>GitHub Issues: <a href="${githubUrl}/issues">${githubUrl}/issues</a></p>
  </div>

  <hr style="margin: 30px 0;">
  <p style="font-size: 12px; color: #666;">Order: ${product.name} | $${amount} | ${orderId} | ${date}</p>
  <p style="font-size: 12px; color: #666;"><em>100% DAO Treasury
</body></html>`;
  }

  // Send via SendGrid if configured
  if (process.env.SENDGRID_API_KEY) {
    try {
      await sgMail.send({
        to: customerEmail,
        from: { email: process.env.SENDGRID_FROM_EMAIL || 'noreply@aidoesitall.website', name: process.env.SENDGRID_FROM_NAME || 'AI Solutions Store' },
        subject: subject,
        html: html
      });
      console.log(`[AI-STORE] Delivery email sent to ${customerEmail} for ${product.name}`);
    } catch (err) {
      console.error('[AI-STORE] Failed to send delivery email:', err);
      await notifyOwnerViaTwilio(customerEmail, product, orderId);
    }
  } else {
    // Fallback: SMS notification to owner for manual delivery
    await notifyOwnerViaTwilio(customerEmail, product, orderId);
  }
}

// SMS notification to owner when email fails or isn't configured
async function notifyOwnerViaTwilio(customerEmail, product, orderId) {
  const message = `AI STORE SALE: ${product.name} - Customer: ${customerEmail} - Order: ${orderId} - MANUAL DELIVERY NEEDED`;
  console.log(`[AI-STORE] ${message}`);

  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');

      await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          From: process.env.TWILIO_PHONE_NUMBER || '+18889584883',
          To: process.env.JOSHUA_PHONE || '+13529735909',
          Body: message.substring(0, 160)
        })
      });
      console.log('[AI-STORE] Owner notified via SMS');
    } catch (err) {
      console.error('[AI-STORE] Failed to send SMS notification:', err);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Using imported calculateRevenueAllocation from dao-revenue.js

function verifySquareSignature(body, signature, secret) {
  if (!signature || !secret) return true; // Skip in dev

  const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(bodyString);
  const expectedSignature = hmac.digest('base64');

  return signature === expectedSignature;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/health', (req, res) => {
  res.json({
    status: 'OPERATIONAL',
    service: 'DAO Webhooks',
    endpoints: [
      'POST /webhook/square-dating',
      'POST /webhook/square-merch',
      'POST /webhook/stripe'
    ],
    daoRevenue: {
      model: '100% DAO Treasury',
      version: 'V2.0'
    },
    daoRevenue: true
  });
});

export default router;
