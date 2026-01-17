// ═══════════════════════════════════════════════════════════════
// EMAIL SERVICE USAGE EXAMPLES
// How to use the SendGrid email service in your routes
// ═══════════════════════════════════════════════════════════════

const {
  sendEmail,
  sendWelcomeEmail,
  sendThankYouEmail,
  sendKickstarterPledgeEmail
} = require('./email');

// ─────────────────────────────────────────────────────────────────
// EXAMPLE 1: Send Welcome Email (User Registration)
// ─────────────────────────────────────────────────────────────────

async function onUserSignup(email, name) {
  try {
    await sendWelcomeEmail(email, name);
    console.log('Welcome email sent successfully');
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // Don't fail the signup if email fails - just log it
  }
}

// Usage in route:
// app.post('/api/auth/register', async (req, res) => {
//   const { email, name } = req.body;
//   // ... create user in database ...
//   await onUserSignup(email, name);
//   res.json({ success: true });
// });

// ─────────────────────────────────────────────────────────────────
// EXAMPLE 2: Send Thank You Email (After Purchase/Subscription)
// ─────────────────────────────────────────────────────────────────

async function onPurchaseComplete(email, name, orderData) {
  try {
    await sendThankYouEmail(email, name, {
      amount: orderData.total,
      item: orderData.productName,
      charityAmount: (orderData.total * 1.0).toFixed(2) // 100% to verified pediatric charities
    });
    console.log('Thank you email sent successfully');
  } catch (error) {
    console.error('Failed to send thank you email:', error);
  }
}

// Usage in route:
// app.post('/webhook/square-merch', async (req, res) => {
//   const { payment } = req.body;
//   if (payment.status === 'COMPLETED') {
//     await onPurchaseComplete(
//       payment.customer_email,
//       payment.customer_name,
//       { total: payment.amount / 100, productName: 'Premium Subscription' }
//     );
//   }
//   res.json({ success: true });
// });

// ─────────────────────────────────────────────────────────────────
// EXAMPLE 3: Send Kickstarter Pledge Confirmation
// ─────────────────────────────────────────────────────────────────

async function onKickstarterPledge(email, name, pledgeData) {
  try {
    await sendKickstarterPledgeEmail(email, name, {
      amount: pledgeData.amount,
      reward: pledgeData.rewardTier,
      estimatedDelivery: 'March 2026'
    });
    console.log('Kickstarter pledge email sent successfully');
  } catch (error) {
    console.error('Failed to send Kickstarter email:', error);
  }
}

// Usage in route:
// app.post('/api/kickstarter/pledge', async (req, res) => {
//   const { email, name, amount, reward } = req.body;
//   // ... process pledge ...
//   await onKickstarterPledge(email, name, { amount, rewardTier: reward });
//   res.json({ success: true });
// });

// ─────────────────────────────────────────────────────────────────
// EXAMPLE 4: Send Custom Email
// ─────────────────────────────────────────────────────────────────

async function sendCustomEmail(recipient, subject, htmlContent) {
  try {
    await sendEmail({
      to: recipient,
      subject: subject,
      html: htmlContent
    });
    console.log('Custom email sent successfully');
  } catch (error) {
    console.error('Failed to send custom email:', error);
  }
}

// Usage:
// await sendCustomEmail(
//   'user@example.com',
//   'Custom Subject',
//   '<h1>Hello</h1><p>Your custom HTML content here</p>'
// );

// ─────────────────────────────────────────────────────────────────
// INTEGRATION POINTS (Where to add email triggers)
// ─────────────────────────────────────────────────────────────────

/**
 * ROUTE: /api/auth/register (api/routes/auth.js)
 * TRIGGER: After successful user creation
 * EMAIL: sendWelcomeEmail(email, name)
 */

/**
 * ROUTE: /webhook/square-merch (api/routes/merch.js)
 * TRIGGER: On payment.updated (status = COMPLETED)
 * EMAIL: sendThankYouEmail(email, name, purchaseDetails)
 */

/**
 * ROUTE: /webhook/stripe (api/routes/stripe-subscriptions.js)
 * TRIGGER: On checkout.session.completed
 * EMAIL: sendThankYouEmail(email, name, subscriptionDetails)
 */

/**
 * ROUTE: /api/kickstarter/pledge (NEW - needs to be created)
 * TRIGGER: On pledge submission
 * EMAIL: sendKickstarterPledgeEmail(email, name, pledgeDetails)
 */

// ─────────────────────────────────────────────────────────────────
// TESTING (Run from this file)
// ─────────────────────────────────────────────────────────────────

async function testEmails() {
  const testEmail = 'admin@yourplatform.com'; // Founder's email for testing

  console.log('Testing email service...');

  // Test 1: Welcome Email
  console.log('\n1. Sending welcome email...');
  await sendWelcomeEmail(testEmail, 'Joshua');

  // Wait 2 seconds between emails to avoid rate limits
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Thank You Email
  console.log('\n2. Sending thank you email...');
  await sendThankYouEmail(testEmail, 'Joshua', {
    amount: 29.99,
    item: 'Premium Subscription',
    charityAmount: 17.99
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3: Kickstarter Pledge Email
  console.log('\n3. Sending Kickstarter pledge email...');
  await sendKickstarterPledgeEmail(testEmail, 'Joshua', {
    amount: 50,
    reward: 'Early Bird Special - Premium Merch Pack',
    estimatedDelivery: 'March 2026'
  });

  console.log('\n✅ All test emails sent! Check your inbox.');
}

// Uncomment to test:
// testEmails().catch(console.error);

module.exports = {
  onUserSignup,
  onPurchaseComplete,
  onKickstarterPledge,
  sendCustomEmail
};
