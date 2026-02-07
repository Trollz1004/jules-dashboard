/**
 * AI SOLUTIONS STORE - SQUARE WEBHOOK HANDLER
 * Processes payment.completed webhooks from Square and sends product-specific delivery emails
 *
 * PRODUCTS:
 * - claude-droid ($299): GitHub repo access + setup guide
 * - income-droid ($499): GitHub repo access + video tutorial link
 * - marketing-engine ($199): GitHub repo access + API keys setup guide
 * - jules-ai ($399): GitHub repo access + GCP/AWS integration guide
 * - affiliate-system ($599): GitHub repo access + white-label setup guide
 * - dating-platform ($2499): Full source code zip + deployment guide
 * - custom-consult ($99): Calendar booking link for 30-min call
 * - Merch (tee, hoodie, mug, stickers, bundle): Printful auto-fulfillment
 *
 * FOR THE KIDS - 100% to verified pediatric charities (Gospel V1.4.1 SURVIVAL MODE)
 * Created: 2025-12-21
 */

import express from 'express';
import crypto from 'crypto';
import Square from 'square';
import sgMail from '@sendgrid/mail';
const { SquareClient, SquareEnvironment } = Square;

const router = express.Router();

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

// ═══════════════════════════════════════════════════════════════════════════════
// IDEMPOTENCY - Prevent duplicate email delivery from webhook retries
// Square retries webhooks if response is slow - this prevents double emails
// ═══════════════════════════════════════════════════════════════════════════════
const processedPayments = new Map(); // paymentId -> timestamp
const DEDUP_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function hasBeenProcessed(paymentId) {
  const timestamp = processedPayments.get(paymentId);
  if (timestamp) {
    // Check if still within TTL
    if (Date.now() - timestamp < DEDUP_TTL_MS) {
      return true;
    }
    // Expired, remove and allow reprocessing
    processedPayments.delete(paymentId);
  }
  return false;
}

function markAsProcessed(paymentId) {
  processedPayments.set(paymentId, Date.now());

  // Cleanup old entries (prevent memory leak)
  if (processedPayments.size > 1000) {
    const now = Date.now();
    for (const [id, ts] of processedPayments.entries()) {
      if (now - ts > DEDUP_TTL_MS) {
        processedPayments.delete(id);
      }
    }
  }
}

// Initialize Square client
const squareClient = new SquareClient({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === 'production'
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox
});

// Product catalog configuration
const PRODUCT_CATALOG = {
  'claude-droid': {
    name: 'Claude Droid',
    price: 299,
    type: 'github-repo',
    repo: 'https://github.com/Ai-Solutions-Store/claude-droid',
    deliveryType: 'github-access'
  },
  'income-droid': {
    name: 'Income Droid',
    price: 499,
    type: 'github-repo',
    repo: 'https://github.com/Ai-Solutions-Store/income-droid',
    videoUrl: 'https://www.youtube.com/playlist?list=INCOME-DROID-TUTORIALS',
    deliveryType: 'github-access-video'
  },
  'marketing-engine': {
    name: 'Marketing Engine',
    price: 199,
    type: 'github-repo',
    repo: 'https://github.com/Ai-Solutions-Store/marketing-engine',
    deliveryType: 'github-access-api'
  },
  'jules-ai': {
    name: 'Jules AI',
    price: 399,
    type: 'github-repo',
    repo: 'https://github.com/Ai-Solutions-Store/jules-ai',
    deliveryType: 'github-access-cloud'
  },
  'affiliate-system': {
    name: 'Affiliate System',
    price: 599,
    type: 'github-repo',
    repo: 'https://github.com/Ai-Solutions-Store/affiliate-system',
    deliveryType: 'github-access-whitelabel'
  },
  'dating-platform': {
    name: 'Anti-AI Dating Platform',
    price: 2499,
    type: 'full-source',
    repo: 'https://github.com/Ai-Solutions-Store/dating-platform',
    deliveryType: 'full-source-zip'
  },
  'custom-consult': {
    name: '30-Min Strategy Consultation',
    price: 99,
    type: 'consultation',
    bookingUrl: 'https://calendly.com/your-booking-link',
    deliveryType: 'booking-link'
  },
  // Merch items (handled by Printful)
  'tee': { name: 'FOR THE KIDS T-Shirt', price: 25, type: 'merch', deliveryType: 'printful' },
  'hoodie': { name: 'FOR THE KIDS Hoodie', price: 45, type: 'merch', deliveryType: 'printful' },
  'mug': { name: 'FOR THE KIDS Mug', price: 15, type: 'merch', deliveryType: 'printful' },
  'stickers': { name: 'FOR THE KIDS Sticker Pack', price: 5, type: 'merch', deliveryType: 'printful' },
  'bundle': { name: 'FOR THE KIDS Merch Bundle', price: 75, type: 'merch', deliveryType: 'printful' }
};

/**
 * Verify Square webhook signature
 * https://developer.squareup.com/docs/webhooks/step3validate
 */
function verifyWebhookSignature(body, signature, signatureKey) {
  const hmac = crypto.createHmac('sha256', signatureKey);
  hmac.update(body);
  const hash = hmac.digest('base64');
  return hash === signature;
}

/**
 * Identify product from Square order/catalog item
 * Returns product config or null if not found
 */
async function identifyProduct(payment) {
  try {
    // If order_id is present, fetch order details
    if (payment.order_id) {
      const orderResponse = await squareClient.ordersApi.retrieveOrder(payment.order_id);
      const order = orderResponse.result.order;

      // Check line items for catalog item IDs or names
      if (order.line_items && order.line_items.length > 0) {
        const firstItem = order.line_items[0];
        const itemName = firstItem.name?.toLowerCase() || '';

        // Try to match by name or variation name
        for (const [productKey, productConfig] of Object.entries(PRODUCT_CATALOG)) {
          if (itemName.includes(productKey.replace('-', ' ')) ||
              itemName.includes(productConfig.name.toLowerCase())) {
            return { productKey, ...productConfig };
          }
        }
      }
    }

    // Fallback: Try to match by payment amount
    const amountDollars = parseFloat(payment.amount_money.amount) / 100;
    for (const [productKey, productConfig] of Object.entries(PRODUCT_CATALOG)) {
      if (Math.abs(amountDollars - productConfig.price) < 0.01) {
        return { productKey, ...productConfig };
      }
    }

    return null;
  } catch (error) {
    console.error('Error identifying product:', error);
    return null;
  }
}

/**
 * Send product delivery email using SendGrid
 */
async function sendDeliveryEmail(customerEmail, product, payment) {
  let emailContent = '';
  let subject = '';

  switch (product.deliveryType) {
    case 'github-access':
      subject = `Access Your ${product.name} - AI Solutions Store`;
      emailContent = `
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #078EFA;">Thank You for Your Purchase!</h1>

    <p>Your ${product.name} is ready for deployment. Here's how to get started:</p>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">Step 1: Access Your Repository</h2>
      <p>GitHub Repository: <a href="${product.repo}" style="color: #078EFA;">${product.repo}</a></p>
      <p><strong>Note:</strong> You will receive a GitHub invitation to <code>${customerEmail}</code> within 24 hours. Check your email and accept the invitation.</p>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">Step 2: Clone the Repository</h2>
      <pre style="background: #141413; color: #fff; padding: 10px; border-radius: 3px; overflow-x: auto;">git clone ${product.repo}.git
cd ${product.productKey}
npm install</pre>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">Step 3: Configure & Deploy</h2>
      <p>Follow the setup instructions in the <code>README.md</code> file:</p>
      <ol>
        <li>Copy <code>.env.example</code> to <code>.env</code></li>
        <li>Add your API keys and configuration</li>
        <li>Run <code>npm start</code> to launch</li>
      </ol>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">Need Help?</h2>
      <p>Email us at: <a href="mailto:${process.env.SUPPORT_EMAIL}" style="color: #078EFA;">${process.env.SUPPORT_EMAIL}</a></p>
      <p>GitHub Issues: <a href="${product.repo}/issues" style="color: #078EFA;">Report a bug or request a feature</a></p>
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 12px; color: #666;">
      <strong>Order Details:</strong><br>
      Product: ${product.name}<br>
      Amount: $${(parseFloat(payment.amount_money.amount) / 100).toFixed(2)}<br>
      Transaction ID: ${payment.id}<br>
      Date: ${new Date().toLocaleDateString()}
    </p>

    <p style="font-size: 12px; color: #666; margin-top: 20px;">
      <em>100% of this purchase supports verified pediatric charities. Thank you for making a difference!</em>
    </p>
  </div>
</body>
</html>
      `;
      break;

    case 'github-access-video':
      subject = `Access Your ${product.name} - AI Solutions Store`;
      emailContent = `
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #078EFA;">Thank You for Your Purchase!</h1>

    <p>Your ${product.name} is ready! Here's everything you need:</p>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">🎥 Watch the Video Tutorial</h2>
      <p><a href="${product.videoUrl}" style="color: #078EFA; font-size: 18px; font-weight: bold;">${product.videoUrl}</a></p>
      <p>Complete step-by-step video guide covering installation, configuration, and monetization strategies.</p>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">📦 Access Your Repository</h2>
      <p>GitHub Repository: <a href="${product.repo}" style="color: #078EFA;">${product.repo}</a></p>
      <p><strong>Note:</strong> You will receive a GitHub invitation to <code>${customerEmail}</code> within 24 hours.</p>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">🚀 Quick Start</h2>
      <ol>
        <li>Watch the video tutorial (recommended)</li>
        <li>Accept your GitHub invitation</li>
        <li>Clone the repository</li>
        <li>Follow the setup guide in README.md</li>
        <li>Start generating income!</li>
      </ol>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">Need Help?</h2>
      <p>Email: <a href="mailto:${process.env.SUPPORT_EMAIL}" style="color: #078EFA;">${process.env.SUPPORT_EMAIL}</a></p>
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 12px; color: #666;">
      <strong>Order Details:</strong><br>
      Product: ${product.name}<br>
      Amount: $${(parseFloat(payment.amount_money.amount) / 100).toFixed(2)}<br>
      Transaction ID: ${payment.id}
    </p>

    <p style="font-size: 12px; color: #666; margin-top: 20px;">
      <em>100% of this purchase supports verified pediatric charities. FOR THE KIDS!</em>
    </p>
  </div>
</body>
</html>
      `;
      break;

    case 'github-access-api':
      subject = `Access Your ${product.name} - AI Solutions Store`;
      emailContent = `
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #078EFA;">Your Marketing Engine is Ready!</h1>

    <p>Start automating your marketing campaigns today. Here's how to set up:</p>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">Step 1: GitHub Access</h2>
      <p>Repository: <a href="${product.repo}" style="color: #078EFA;">${product.repo}</a></p>
      <p>GitHub invitation sent to: <code>${customerEmail}</code></p>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">Step 2: Get Your API Keys</h2>
      <p>You'll need API keys from these services:</p>
      <ul>
        <li><strong>Twitter/X API:</strong> <a href="https://developer.twitter.com" style="color: #078EFA;">developer.twitter.com</a></li>
        <li><strong>OpenAI API:</strong> <a href="https://platform.openai.com/api-keys" style="color: #078EFA;">platform.openai.com</a></li>
        <li><strong>SendGrid (Email):</strong> <a href="https://sendgrid.com/signup" style="color: #078EFA;">sendgrid.com</a></li>
        <li><strong>Google Analytics:</strong> <a href="https://analytics.google.com" style="color: #078EFA;">analytics.google.com</a></li>
      </ul>
      <p><em>Note: Most offer free tiers to get started!</em></p>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">Step 3: Configure & Launch</h2>
      <pre style="background: #141413; color: #fff; padding: 10px; border-radius: 3px; overflow-x: auto;">git clone ${product.repo}.git
cd marketing-engine
npm install
cp .env.example .env
# Add your API keys to .env
npm start</pre>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">Features Included</h2>
      <ul>
        <li>Automated social media posting (Twitter, LinkedIn, Reddit)</li>
        <li>AI-powered content generation</li>
        <li>Email campaign automation</li>
        <li>Analytics dashboard</li>
        <li>A/B testing tools</li>
      </ul>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">Support</h2>
      <p>Email: <a href="mailto:${process.env.SUPPORT_EMAIL}" style="color: #078EFA;">${process.env.SUPPORT_EMAIL}</a></p>
      <p>Documentation: <a href="${product.repo}/wiki" style="color: #078EFA;">GitHub Wiki</a></p>
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 12px; color: #666;">
      Order: ${product.name} | $${(parseFloat(payment.amount_money.amount) / 100).toFixed(2)} | ${payment.id}
    </p>

    <p style="font-size: 12px; color: #666; margin-top: 20px;">
      <em>100% of this purchase supports verified pediatric charities. Thank you!</em>
    </p>
  </div>
</body>
</html>
      `;
      break;

    case 'github-access-cloud':
      subject = `Access Your ${product.name} - AI Solutions Store`;
      emailContent = `
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #078EFA;">Your Jules AI System is Ready!</h1>

    <p>Deploy your personal AI assistant to GCP or AWS. Here's how:</p>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">Step 1: GitHub Access</h2>
      <p>Repository: <a href="${product.repo}" style="color: #078EFA;">${product.repo}</a></p>
      <p>Invitation sent to: <code>${customerEmail}</code> (check your email within 24 hours)</p>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">Step 2: Choose Your Cloud Provider</h2>

      <h3>Option A: Google Cloud Platform (Recommended)</h3>
      <ul>
        <li>Sign up: <a href="https://cloud.google.com/free" style="color: #078EFA;">cloud.google.com/free</a> ($300 free credit)</li>
        <li>Enable Gemini API</li>
        <li>Create service account and download credentials JSON</li>
      </ul>

      <h3>Option B: Amazon Web Services</h3>
      <ul>
        <li>Sign up: <a href="https://aws.amazon.com/free" style="color: #078EFA;">aws.amazon.com/free</a></li>
        <li>Create IAM user with admin access</li>
        <li>Download access keys</li>
      </ul>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">Step 3: Deploy Jules AI</h2>
      <pre style="background: #141413; color: #fff; padding: 10px; border-radius: 3px; overflow-x: auto;">git clone ${product.repo}.git
cd jules-ai
npm install
cp .env.example .env
# Add your cloud credentials to .env
npm run deploy</pre>
      <p><em>Full deployment guide available in the README.md</em></p>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">What You Get</h2>
      <ul>
        <li>Multi-model AI orchestration (Gemini, GPT-4, Claude)</li>
        <li>Voice synthesis and TTS capabilities</li>
        <li>Web automation and scraping</li>
        <li>Custom tool integration framework</li>
        <li>Production-ready dashboard</li>
      </ul>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">Support & Documentation</h2>
      <p>Email: <a href="mailto:${process.env.SUPPORT_EMAIL}" style="color: #078EFA;">${process.env.SUPPORT_EMAIL}</a></p>
      <p>Docs: <a href="${product.repo}/wiki" style="color: #078EFA;">GitHub Wiki</a></p>
      <p>Issues: <a href="${product.repo}/issues" style="color: #078EFA;">GitHub Issues</a></p>
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 12px; color: #666;">
      Order: ${product.name} | $${(parseFloat(payment.amount_money.amount) / 100).toFixed(2)} | ${payment.id}
    </p>

    <p style="font-size: 12px; color: #666; margin-top: 20px;">
      <em>100% of this purchase supports verified pediatric charities. FOR THE KIDS!</em>
    </p>
  </div>
</body>
</html>
      `;
      break;

    case 'github-access-whitelabel':
      subject = `Access Your ${product.name} - AI Solutions Store`;
      emailContent = `
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #078EFA;">Your Affiliate System is Ready!</h1>

    <p>Start building your white-label affiliate program today.</p>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">Step 1: Access Your Repository</h2>
      <p>GitHub Repository: <a href="${product.repo}" style="color: #078EFA;">${product.repo}</a></p>
      <p>Invitation sent to: <code>${customerEmail}</code></p>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">Step 2: White-Label Configuration</h2>
      <p>Customize the system with your branding:</p>
      <ul>
        <li>Update <code>config/branding.json</code> with your logo, colors, and company name</li>
        <li>Configure commission structures in <code>config/commissions.json</code></li>
        <li>Set up payment processor (Stripe or Square)</li>
        <li>Add your domain and SSL certificate</li>
      </ul>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">Step 3: Deploy</h2>
      <pre style="background: #141413; color: #fff; padding: 10px; border-radius: 3px; overflow-x: auto;">git clone ${product.repo}.git
cd affiliate-system
npm install
cp .env.example .env
# Configure your settings
npm run build
npm run deploy</pre>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">Features</h2>
      <ul>
        <li>Multi-tier commission tracking</li>
        <li>Automated payouts</li>
        <li>Real-time analytics dashboard</li>
        <li>Custom link generation</li>
        <li>Email notification system</li>
        <li>Fraud detection</li>
        <li>Mobile-responsive admin panel</li>
      </ul>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">Need Help?</h2>
      <p>Email: <a href="mailto:${process.env.SUPPORT_EMAIL}" style="color: #078EFA;">${process.env.SUPPORT_EMAIL}</a></p>
      <p>Setup Guide: <a href="${product.repo}/blob/main/SETUP.md" style="color: #078EFA;">SETUP.md</a></p>
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 12px; color: #666;">
      Order: ${product.name} | $${(parseFloat(payment.amount_money.amount) / 100).toFixed(2)} | ${payment.id}
    </p>

    <p style="font-size: 12px; color: #666; margin-top: 20px;">
      <em>100% of this purchase supports verified pediatric charities. Thank you!</em>
    </p>
  </div>
</body>
</html>
      `;
      break;

    case 'full-source-zip':
      subject = `Your ${product.name} Source Code - AI Solutions Store`;
      emailContent = `
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #078EFA;">Your Anti-AI Dating Platform Source Code!</h1>

    <p>Congratulations on your purchase! This is a complete, production-ready dating platform.</p>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">📦 Step 1: Download Full Source Code</h2>
      <p>GitHub Repository: <a href="${product.repo}" style="color: #078EFA;">${product.repo}</a></p>
      <p>GitHub invitation sent to: <code>${customerEmail}</code></p>
      <p><strong>You will receive:</strong></p>
      <ul>
        <li>Complete frontend (React/Vue)</li>
        <li>Backend API (Node.js/Express)</li>
        <li>Database schemas (PostgreSQL)</li>
        <li>Admin dashboard</li>
        <li>Mobile-responsive design</li>
        <li>Payment integration (Square/Stripe)</li>
      </ul>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">🚀 Step 2: Deployment Guide</h2>
      <p>We've included comprehensive deployment documentation:</p>
      <ul>
        <li><strong>DEPLOYMENT.md</strong> - Step-by-step deployment to AWS, GCP, or Azure</li>
        <li><strong>DATABASE-SETUP.md</strong> - PostgreSQL configuration and migrations</li>
        <li><strong>PAYMENT-SETUP.md</strong> - Square and Stripe integration guide</li>
        <li><strong>SECURITY.md</strong> - Security best practices and compliance (MCC 7273)</li>
        <li><strong>CUSTOMIZATION.md</strong> - Branding and feature customization</li>
      </ul>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">⚠️ Important: High-Risk Merchant Account</h2>
      <p>Dating services are classified as MCC 7273 (high-risk). You'll need:</p>
      <ul>
        <li>High-risk merchant account (PaymentCloud, Durango, etc.)</li>
        <li>Age verification system (included in code)</li>
        <li>Terms of Service and Privacy Policy (templates included)</li>
        <li>Content moderation system (included)</li>
      </ul>
      <p><em>See COMPLIANCE.md for complete requirements</em></p>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">📋 What's Included</h2>
      <ul>
        <li>Full source code (frontend + backend)</li>
        <li>Admin dashboard</li>
        <li>User authentication & profiles</li>
        <li>Matching algorithm</li>
        <li>Real-time messaging</li>
        <li>Photo upload & moderation</li>
        <li>Subscription/payment system</li>
        <li>Analytics & reporting</li>
        <li>Mobile-responsive design</li>
        <li>Docker deployment configs</li>
      </ul>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">🛠️ Technical Stack</h2>
      <ul>
        <li>Frontend: React + TypeScript + Tailwind CSS</li>
        <li>Backend: Node.js + Express + Prisma</li>
        <li>Database: PostgreSQL</li>
        <li>Real-time: Socket.io</li>
        <li>Payments: Square + Stripe</li>
        <li>Hosting: AWS/GCP/Azure ready</li>
      </ul>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">Premium Support Included</h2>
      <p>You have <strong>30 days of email support</strong> for deployment assistance.</p>
      <p>Email: <a href="mailto:${process.env.SUPPORT_EMAIL}" style="color: #078EFA;">${process.env.SUPPORT_EMAIL}</a></p>
      <p>Response time: 24-48 hours</p>
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 12px; color: #666;">
      <strong>Order Details:</strong><br>
      Product: ${product.name}<br>
      Amount: $${(parseFloat(payment.amount_money.amount) / 100).toFixed(2)}<br>
      Transaction ID: ${payment.id}<br>
      License: Single commercial use (you can deploy and profit from this code)
    </p>

    <p style="font-size: 12px; color: #666; margin-top: 20px;">
      <em>100% of this purchase ($${(parseFloat(payment.amount_money.amount) / 100).toFixed(2)}) supports verified pediatric charities. FOR THE KIDS!</em>
    </p>
  </div>
</body>
</html>
      `;
      break;

    case 'booking-link':
      subject = `Your 30-Min Strategy Consultation - AI Solutions Store`;
      emailContent = `
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #078EFA;">Your Consultation is Confirmed!</h1>

    <p>Thank you for booking a 30-minute strategy consultation with Josh Coleman.</p>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">📅 Schedule Your Call</h2>
      <p><a href="${product.bookingUrl}" style="background: #078EFA; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Click Here to Book Your Time</a></p>
      <p style="margin-top: 15px;">Booking URL: <a href="${product.bookingUrl}" style="color: #078EFA;">${product.bookingUrl}</a></p>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">What to Expect</h2>
      <p>During our 30-minute call, we'll discuss:</p>
      <ul>
        <li>Your current business challenges and goals</li>
        <li>AI automation opportunities for your workflow</li>
        <li>Custom solution recommendations</li>
        <li>Implementation roadmap and timeline</li>
        <li>Pricing and next steps</li>
      </ul>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">Before the Call</h2>
      <p>To make the most of our time together, please:</p>
      <ol>
        <li>Write down your top 3 business challenges</li>
        <li>Think about your ideal outcome</li>
        <li>Have any relevant data/metrics ready</li>
        <li>Prepare any specific questions</li>
      </ol>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">Meeting Details</h2>
      <p><strong>Duration:</strong> 30 minutes<br>
      <strong>Format:</strong> Google Meet (link sent after booking)<br>
      <strong>Who:</strong> Josh Coleman (Founder, AI Solutions Store)<br>
      <strong>Contact:</strong> <a href="mailto:${process.env.OWNER_EMAIL}" style="color: #078EFA;">${process.env.OWNER_EMAIL}</a></p>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">Need to Reschedule?</h2>
      <p>No problem! Use the Calendly link to cancel or reschedule up to 24 hours before your appointment.</p>
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 12px; color: #666;">
      Order: ${product.name}<br>
      Amount: $${(parseFloat(payment.amount_money.amount) / 100).toFixed(2)}<br>
      Transaction ID: ${payment.id}
    </p>

    <p style="font-size: 12px; color: #666; margin-top: 20px;">
      <em>100% of this purchase supports verified pediatric charities. Thank you!</em>
    </p>
  </div>
</body>
</html>
      `;
      break;

    case 'printful':
      subject = `Order Confirmation - ${product.name}`;
      emailContent = `
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #078EFA;">Thank You for Your Order!</h1>

    <p>Your ${product.name} order has been confirmed and sent to our fulfillment partner.</p>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">📦 Order Status</h2>
      <p><strong>Status:</strong> Processing<br>
      <strong>Expected Ship Date:</strong> 2-3 business days<br>
      <strong>Expected Delivery:</strong> 5-7 business days</p>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">🚚 Tracking Information</h2>
      <p>You'll receive a shipping confirmation email with tracking number once your order ships.</p>
      <p>This email will come from our fulfillment partner, Printful.</p>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">Questions or Concerns?</h2>
      <p>Email us at: <a href="mailto:${process.env.SUPPORT_EMAIL}" style="color: #078EFA;">${process.env.SUPPORT_EMAIL}</a></p>
      <p>We typically respond within 24 hours.</p>
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 12px; color: #666;">
      <strong>Order Details:</strong><br>
      Product: ${product.name}<br>
      Amount: $${(parseFloat(payment.amount_money.amount) / 100).toFixed(2)}<br>
      Order ID: ${payment.id}
    </p>

    <p style="font-size: 12px; color: #666; margin-top: 20px;">
      <em>100% of this purchase supports verified pediatric charities. FOR THE KIDS!</em>
    </p>
  </div>
</body>
</html>
      `;
      break;

    default:
      // Generic confirmation for unknown products
      subject = `Order Confirmation - AI Solutions Store`;
      emailContent = `
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #078EFA;">Thank You for Your Purchase!</h1>

    <p>Your order has been confirmed. We'll send you delivery instructions within 24 hours.</p>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">Order Details</h2>
      <p>Product: ${product.name}<br>
      Amount: $${(parseFloat(payment.amount_money.amount) / 100).toFixed(2)}<br>
      Transaction ID: ${payment.id}</p>
    </div>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h2 style="color: #CC785C;">Need Help?</h2>
      <p>Email: <a href="mailto:${process.env.SUPPORT_EMAIL}" style="color: #078EFA;">${process.env.SUPPORT_EMAIL}</a></p>
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 12px; color: #666; margin-top: 20px;">
      <em>100% of this purchase supports verified pediatric charities. FOR THE KIDS!</em>
    </p>
  </div>
</body>
</html>
      `;
  }

  // Send email via SendGrid
  const msg = {
    to: customerEmail,
    from: process.env.SUPPORT_EMAIL || 'support@youandinotai.com',
    subject: subject,
    html: emailContent
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Delivery email sent to ${customerEmail} for ${product.name}`);
    return true;
  } catch (error) {
    console.error('❌ SendGrid email error:', error);

    // Fallback: Log to console for manual processing
    console.error('MANUAL DELIVERY REQUIRED:', {
      customerEmail,
      product: product.name,
      paymentId: payment.id,
      error: error.message
    });

    return false;
  }
}

/**
 * POST /api/ai-store-webhook
 * Receives Square payment webhooks for AI Solutions Store
 */
router.post('/', express.json(), async (req, res) => {
  try {
    const signature = req.headers['x-square-hmacsha256-signature'];
    const webhookSecret = process.env.SQUARE_WEBHOOK_SECRET;

    // Verify webhook signature
    if (!webhookSecret) {
      console.error('❌ SQUARE WEBHOOK SECRET NOT CONFIGURED');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Webhook secret not configured'
      });
    }

    if (!signature) {
      console.error('❌ MISSING WEBHOOK SIGNATURE', {
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Webhook signature required'
      });
    }

    if (!verifyWebhookSignature(JSON.stringify(req.body), signature, webhookSecret)) {
      console.error('❌ INVALID SQUARE WEBHOOK SIGNATURE', {
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid webhook signature'
      });
    }

    const { type, data } = req.body;
    console.log('📥 AI STORE WEBHOOK RECEIVED:', type);

    // Handle payment.completed event
    if (type === 'payment.completed') {
      const payment = data.object.payment;

      // Skip if payment not completed
      if (payment.status !== 'COMPLETED') {
        console.log('⏳ PAYMENT NOT COMPLETED:', payment.status);
        return res.json({ received: true, status: 'pending' });
      }

      // IDEMPOTENCY CHECK - Prevent duplicate email delivery from webhook retries
      if (hasBeenProcessed(payment.id)) {
        console.log('⚠️ DUPLICATE WEBHOOK - Already processed payment:', payment.id);
        return res.json({
          received: true,
          status: 'already_processed',
          paymentId: payment.id,
          message: 'Duplicate webhook - email already sent'
        });
      }

      // Extract customer email
      let customerEmail = payment.buyer_email_address;

      // If no email in payment, try to get from customer object
      if (!customerEmail && payment.customer_id) {
        try {
          const customerResponse = await squareClient.customersApi.retrieveCustomer(payment.customer_id);
          customerEmail = customerResponse.result.customer.email_address;
        } catch (error) {
          console.warn('Could not retrieve customer email:', error.message);
        }
      }

      // Fallback to owner email if customer email not found
      if (!customerEmail) {
        customerEmail = process.env.OWNER_EMAIL || 'admin@yourplatform.com';
        console.warn('⚠️ No customer email found, using owner email as fallback');
      }

      // Identify product
      const product = await identifyProduct(payment);

      if (!product) {
        console.warn('⚠️ Could not identify product for payment:', payment.id);
        // Send generic confirmation
        await sendDeliveryEmail(customerEmail, {
          name: 'AI Solutions Store Product',
          deliveryType: 'unknown'
        }, payment);

        // Mark as processed to prevent duplicate emails
        markAsProcessed(payment.id);

        return res.json({
          received: true,
          status: 'product_unknown',
          message: 'Manual delivery required'
        });
      }

      console.log('📦 Product identified:', product.name);

      // Send delivery email
      const emailSent = await sendDeliveryEmail(customerEmail, product, payment);

      // Mark as processed to prevent duplicate emails from webhook retries
      markAsProcessed(payment.id);

      console.log('💚 AI STORE ORDER PROCESSED:', {
        product: product.name,
        amount: parseFloat(payment.amount_money.amount) / 100,
        customer: customerEmail,
        emailSent,
        paymentId: payment.id
      });

      res.json({
        received: true,
        product: product.name,
        emailSent,
        customerEmail,
        paymentId: payment.id
      });

    } else {
      console.log('ℹ️ UNHANDLED EVENT:', type);
      res.json({ received: true });
    }

  } catch (error) {
    console.error('❌ AI STORE WEBHOOK ERROR:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ai-store-webhook/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'AI Solutions Store Webhook Handler',
    timestamp: new Date().toISOString(),
    mission: 'FOR THE KIDS - 100% to verified pediatric charities'
  });
});

export default router;
