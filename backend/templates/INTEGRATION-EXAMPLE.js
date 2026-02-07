/**
 * INTEGRATION EXAMPLE: Square Webhook to Auto-Send Delivery Emails
 *
 * This shows how to integrate delivery email templates with Square checkout
 * Add this logic to your Square webhook handler
 *
 * Gospel V1.4.1 SURVIVAL MODE: 100% to verified pediatric charities
 * FOR THE KIDS. ALWAYS.
 */

import { getDeliveryEmail, validateCustomerInfo } from './delivery-emails.js';

// Email service (choose one)
// Option 1: SendGrid
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Option 2: AWS SES
// import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
// const ses = new SESClient({ region: 'us-east-1' });

/**
 * Product ID mapping from Square to template IDs
 * Update these with your actual Square product catalog item IDs
 */
const PRODUCT_MAPPING = {
  // Square Catalog Item ID : Template Product ID
  'CLAUDE_DROID_ITEM_ID': 'claude-droid',
  'INCOME_DROID_ITEM_ID': 'income-droid',
  'MARKETING_ENGINE_ITEM_ID': 'marketing-engine',
  'JULES_AI_ITEM_ID': 'jules-ai',
  'AFFILIATE_SYSTEM_ITEM_ID': 'affiliate-system',
  'DATING_PLATFORM_ITEM_ID': 'dating-platform',
  'CONSULTATION_ITEM_ID': 'consultation',
  'MERCH_TSHIRT_ITEM_ID': 'merchandise',
  'MERCH_HOODIE_ITEM_ID': 'merchandise',
  'MERCH_MUG_ITEM_ID': 'merchandise'
};

/**
 * Extract product ID from Square payment/order
 */
function getProductIdFromOrder(order) {
  if (!order || !order.line_items || order.line_items.length === 0) {
    return null;
  }

  // Get first line item's catalog object ID
  const catalogItemId = order.line_items[0].catalog_object_id;

  // Map to template product ID
  return PRODUCT_MAPPING[catalogItemId] || null;
}

/**
 * Extract customer info from Square payment
 */
function extractCustomerInfo(payment, order) {
  // Get customer name from order or use email prefix as fallback
  const customerName = order?.customer?.given_name
    ? `${order.customer.given_name} ${order.customer.family_name || ''}`.trim()
    : payment.buyer_email_address.split('@')[0];

  // Format date
  const orderDate = new Date(payment.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Base customer info
  const customerInfo = {
    name: customerName,
    email: payment.buyer_email_address,
    orderId: payment.order_id || payment.id,
    orderDate: orderDate
  };

  // Add merchandise-specific fields if applicable
  const productId = getProductIdFromOrder(order);
  if (productId === 'merchandise') {
    customerInfo.productName = order.line_items[0].name || 'AI Solutions Store Merchandise';

    // Extract shipping address if available
    if (order.fulfillments && order.fulfillments.length > 0) {
      const address = order.fulfillments[0].shipment_details?.recipient?.address;
      if (address) {
        customerInfo.shippingAddress = [
          address.address_line_1,
          address.address_line_2,
          `${address.locality}, ${address.administrative_district_level_1} ${address.postal_code}`,
          address.country
        ].filter(Boolean).join('\n');
      }
    }
  }

  return customerInfo;
}

/**
 * Send delivery email via SendGrid
 */
async function sendEmailViaSendGrid(customerInfo, productId, htmlContent) {
  const msg = {
    to: customerInfo.email,
    from: {
      email: 'support@ai-solutions.store',
      name: 'AI Solutions Store'
    },
    subject: `Your ${productId} is ready! - Order #${customerInfo.orderId}`,
    html: htmlContent,
    // Optional: Add plain text version
    text: `Thank you for your purchase! Your ${productId} is ready. Check your email for detailed setup instructions.`,
    // Optional: Track email opens/clicks
    tracking_settings: {
      click_tracking: { enable: true },
      open_tracking: { enable: true }
    }
  };

  return await sgMail.send(msg);
}

/**
 * Send delivery email via AWS SES
 */
async function sendEmailViaAWSSES(customerInfo, productId, htmlContent) {
  const command = new SendEmailCommand({
    Source: 'support@ai-solutions.store',
    Destination: {
      ToAddresses: [customerInfo.email]
    },
    Message: {
      Subject: {
        Data: `Your ${productId} is ready! - Order #${customerInfo.orderId}`
      },
      Body: {
        Html: {
          Data: htmlContent
        },
        Text: {
          Data: `Thank you for your purchase! Your ${productId} is ready. Check your email for detailed setup instructions.`
        }
      }
    }
  });

  return await ses.send(command);
}

/**
 * Main webhook handler for Square payment.updated events
 */
export async function handleSquarePayment(event) {
  try {
    // Only process completed payments
    if (event.type !== 'payment.updated') {
      console.log('Ignoring non-payment event:', event.type);
      return { success: false, reason: 'Not a payment event' };
    }

    const payment = event.data.object.payment;

    if (payment.status !== 'COMPLETED') {
      console.log('Payment not completed:', payment.status);
      return { success: false, reason: 'Payment not completed' };
    }

    // Fetch full order details (if you have Square SDK available)
    // const order = await squareClient.ordersApi.retrieveOrder(payment.order_id);
    // For this example, we'll assume order data is in the event
    const order = event.data.object.order || {};

    // Extract customer info
    const customerInfo = extractCustomerInfo(payment, order);

    // Validate customer info
    validateCustomerInfo(customerInfo);

    // Determine product ID
    const productId = getProductIdFromOrder(order);

    if (!productId) {
      console.error('Could not determine product ID from order');
      return { success: false, reason: 'Unknown product' };
    }

    console.log(`Processing delivery email for ${productId} to ${customerInfo.email}`);

    // Generate email HTML
    const htmlContent = getDeliveryEmail(productId, customerInfo);

    // Send email (choose your method)
    await sendEmailViaSendGrid(customerInfo, productId, htmlContent);
    // OR: await sendEmailViaAWSSES(customerInfo, productId, htmlContent);

    console.log(`✓ Delivery email sent successfully for ${productId}`);

    // Log the delivery for record-keeping
    await logEmailDelivery({
      orderId: customerInfo.orderId,
      productId: productId,
      email: customerInfo.email,
      sentAt: new Date().toISOString(),
      status: 'sent'
    });

    return {
      success: true,
      productId: productId,
      email: customerInfo.email,
      orderId: customerInfo.orderId
    };

  } catch (error) {
    console.error('Error sending delivery email:', error);

    // Log the error
    await logEmailDelivery({
      orderId: event.data?.object?.payment?.order_id || 'unknown',
      productId: 'unknown',
      email: event.data?.object?.payment?.buyer_email_address || 'unknown',
      sentAt: new Date().toISOString(),
      status: 'failed',
      error: error.message
    });

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Log email delivery for tracking
 * Implement this based on your database/logging system
 */
async function logEmailDelivery(deliveryData) {
  // Example: Save to database
  // await db.deliveryLog.create(deliveryData);

  // Example: Log to file
  // fs.appendFileSync('delivery-log.json', JSON.stringify(deliveryData) + '\n');

  // For now, just console log
  console.log('Email delivery logged:', deliveryData);
}

/**
 * Example Express route for Square webhooks
 */
export function setupWebhookRoute(app) {
  app.post('/webhooks/square', async (req, res) => {
    try {
      const event = req.body;

      // Verify Square signature (recommended in production)
      // const signature = req.headers['x-square-signature'];
      // if (!verifySquareSignature(req.rawBody, signature)) {
      //   return res.status(401).send('Invalid signature');
      // }

      // Process the payment
      const result = await handleSquarePayment(event);

      // Respond to Square immediately (don't make them wait)
      res.status(200).json({ received: true });

      // Log result
      if (result.success) {
        console.log(`✓ Processed order ${result.orderId}: ${result.productId} → ${result.email}`);
      } else {
        console.log(`✗ Failed to process: ${result.reason || result.error}`);
      }

    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  console.log('Square webhook route registered: POST /webhooks/square');
}

/**
 * Manual email send (for testing or resending)
 */
export async function manualSendDeliveryEmail(orderId, customerEmail, productId) {
  try {
    // Look up order details from your database
    // const order = await db.orders.findOne({ orderId });

    // For testing, use sample data
    const customerInfo = {
      name: 'Test Customer',
      email: customerEmail,
      orderId: orderId,
      orderDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };

    validateCustomerInfo(customerInfo);

    const htmlContent = getDeliveryEmail(productId, customerInfo);

    await sendEmailViaSendGrid(customerInfo, productId, htmlContent);

    console.log(`✓ Manual delivery email sent: ${productId} → ${customerEmail}`);

    return { success: true };

  } catch (error) {
    console.error('Manual send failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Resend failed deliveries
 */
export async function resendFailedDeliveries() {
  // Example: Query failed deliveries from database
  // const failed = await db.deliveryLog.find({ status: 'failed' });

  // for (const delivery of failed) {
  //   await manualSendDeliveryEmail(
  //     delivery.orderId,
  //     delivery.email,
  //     delivery.productId
  //   );
  // }

  console.log('Resend function would process failed deliveries from database');
}

// Export for use in main server.js
export default {
  handleSquarePayment,
  setupWebhookRoute,
  manualSendDeliveryEmail,
  resendFailedDeliveries
};
