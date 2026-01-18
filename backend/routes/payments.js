import express from 'express';

const router = express.Router();

// Square API configuration
const SQUARE_BASE_URL = 'https://connect.squareup.com/v2';
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;

// POST /api/payments/create-checkout
// Create a Square payment for AI Solutions Store OR domain purchase
router.post('/create-checkout', async (req, res) => {
  try {
    const { sourceId, amount, currency, customer, items, domain, price, plan } = req.body;

    // Handle AI Solutions Store checkout (from storefront)
    if (sourceId && amount && customer && items) {
      const { Client, Environment } = await import('square');

      const client = new Client({
        accessToken: process.env.SQUARE_MERCH_ACCESS_TOKEN || process.env.SQUARE_ACCESS_TOKEN,
        environment: Environment.Production
      });

      // Create payment
      const paymentResponse = await client.paymentsApi.createPayment({
        sourceId: sourceId,
        idempotencyKey: `ai-store-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        amountMoney: {
          amount: BigInt(amount),
          currency: currency || 'USD'
        },
        locationId: process.env.SQUARE_MERCH_LOCATION_ID || process.env.SQUARE_LOCATION_ID,
        referenceId: `ai-store-${items.map(i => i.id).join('-')}`,
        note: `AI Solutions Store Purchase - ${customer.email}`,
        buyerEmailAddress: customer.email
      });

      if (paymentResponse.result.payment) {
        // Log successful payment
        console.log('AI Solutions Store payment successful:', {
          paymentId: paymentResponse.result.payment.id,
          amount: amount / 100,
          customer: customer.email,
          items: items.length
        });

        return res.json({
          success: true,
          paymentId: paymentResponse.result.payment.id,
          status: paymentResponse.result.payment.status
        });
      }

      throw new Error('Payment creation failed');
    }

    // Handle domain purchase (legacy support)
    if (domain && price && plan) {
      const response = await fetch(`${SQUARE_BASE_URL}/online-checkout/payment-links`, {
        method: 'POST',
        headers: {
          'Square-Version': '2025-11-20',
          'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          idempotency_key: `${domain}-${Date.now()}`,
          quick_pay: {
            name: `${domain} - ${plan.toUpperCase()} Plan`,
            price_money: {
              amount: Math.round(price * 100),
              currency: 'USD'
            },
            location_id: process.env.SQUARE_LOCATION_ID
          },
          checkout_options: {
            redirect_url: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/purchase/success?domain=${domain}` : `https://youandinotai.com/purchase/success?domain=${domain}`,
            ask_for_shipping_address: false
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errors?.[0]?.detail || 'Failed to create checkout');
      }

      return res.json({
        success: true,
        checkoutUrl: data.payment_link.url,
        orderId: data.payment_link.order_id
      });
    }

    // Invalid request
    return res.status(400).json({
      error: 'Invalid checkout request. Provide either (sourceId, amount, customer, items) for AI store OR (domain, price, plan) for domain purchase.'
    });

  } catch (error) {
    console.error('Square checkout error:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message
    });
  }
});

// POST /api/payments/verify
// Verify payment completed successfully
router.post('/verify', async (req, res) => {
  try {
    const { orderId } = req.body;

    const response = await fetch(`${SQUARE_BASE_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Square-Version': '2025-11-20',
        'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors?.[0]?.detail || 'Failed to retrieve order');
    }

    const order = data.order;
    const isPaid = order.state === 'COMPLETED';

    res.json({
      success: true,
      isPaid,
      order: {
        id: order.id,
        state: order.state,
        totalMoney: order.total_money,
        createdAt: order.created_at
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      error: 'Failed to verify payment',
      message: error.message
    });
  }
});

// GET /api/payments/plans
// Get available domain subscription plans
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    plans: [
      {
        id: 'basic',
        name: 'Basic Domain',
        description: 'Standard domain registration',
        price: 12.99,
        duration: '1 year',
        features: [
          'Domain registration',
          'DNS management',
          'Email forwarding',
          'WHOIS privacy'
        ]
      },
      {
        id: 'premium',
        name: 'Premium Domain + Hosting',
        description: 'Domain + basic hosting',
        price: 29.99,
        duration: '1 year',
        features: [
          'Everything in Basic',
          '10GB SSD storage',
          'SSL certificate',
          'Daily backups',
          'Email accounts (5)'
        ]
      },
      {
        id: 'business',
        name: 'Business Package',
        description: 'Full business solution',
        price: 99.99,
        duration: '1 year',
        features: [
          'Everything in Premium',
          '50GB SSD storage',
          'Priority support',
          'CDN integration',
          'Email accounts (unlimited)'
        ]
      }
    ],
    note: '100% of ALL revenue goes to verified pediatric charities!'
  });
});

export default router;
