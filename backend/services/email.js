// ═══════════════════════════════════════════════════════════════
// FOR THE KIDS - EMAIL SERVICE (SENDGRID)
// Gospel Version: V1.4.1 SURVIVAL MODE (100% to verified pediatric charities)
// Created: December 17, 2025
// Purpose: Email automation for user engagement & Kickstarter
// ═══════════════════════════════════════════════════════════════

const sgMail = require('@sendgrid/mail');

// Configure SendGrid with API key from environment
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Main email sending function
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text fallback (optional)
 * @returns {Promise<Object>} SendGrid response
 */
async function sendEmail({ to, subject, html, text }) {
  try {
    const msg = {
      to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@aidoesitall.website',
        name: process.env.SENDGRID_FROM_NAME || 'AI Does It All'
      },
      subject,
      html,
      text: text || stripHtml(html) // Auto-generate text from HTML if not provided
    };

    const response = await sgMail.send(msg);
    console.log(`✅ Email sent to ${to}: ${subject}`);
    return { success: true, response };
  } catch (error) {
    console.error('❌ SendGrid Error:', error.response?.body || error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Strip HTML tags for plain text fallback
 */
function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// ─────────────────────────────────────────────────────────────────
// EMAIL TEMPLATES
// ─────────────────────────────────────────────────────────────────

/**
 * Welcome Email - Sent when user signs up
 */
async function sendWelcomeEmail(userEmail, userName = 'Friend') {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #078EFA; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; background: #f9f9f9; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .button { display: inline-block; padding: 12px 24px; background: #CC785C; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .mission-box { background: #fff; border-left: 4px solid #20808D; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to AI Does It All!</h1>
    </div>
    <div class="content">
      <h2>Hey ${userName}! 👋</h2>
      <p>Welcome to the AI platform that's changing lives - literally.</p>

      <div class="mission-box">
        <h3>🎯 Our Mission: FOR THE KIDS</h3>
        <p><strong>100% of every dollar we earn goes directly to verified pediatric charities.</strong></p>
        <p>That's not marketing. That's Gospel V1.4.1 SURVIVAL MODE - our immutable law.</p>
      </div>

      <p>Here's what you can do right now:</p>
      <ul>
        <li>🤖 <strong>Try Jules Dashboard</strong> - AI-powered workspace</li>
        <li>👕 <strong>Shop Merch</strong> - Every purchase helps kids</li>
        <li>💰 <strong>Subscribe</strong> - Unlock premium AI models</li>
        <li>❤️ <strong>Back our Kickstarter</strong> - Help us scale impact</li>
      </ul>

      <a href="https://jules-dashboard.pages.dev" class="button">Launch Dashboard</a>

      <p>Every interaction you have with our platform generates revenue for verified pediatric charities. You're not just a user - you're a hero.</p>

      <p>Let's do this. <strong>FOR THE KIDS.</strong></p>

      <p>- Claude (Opus 4.5)<br>AI Custodian, AI Does It All</p>
    </div>
    <div class="footer">
      <p>AI Does It All | Gospel V1.4.1 SURVIVAL MODE</p>
      <p>100% to Verified Pediatric Charities</p>
      <p><a href="https://aidoesitall.website">aidoesitall.website</a></p>
    </div>
  </div>
</body>
</html>
`;

  return sendEmail({
    to: userEmail,
    subject: '🎉 Welcome to AI Does It All - FOR THE KIDS',
    html
  });
}

/**
 * Thank You Email - Sent after purchase/subscription
 */
async function sendThankYouEmail(userEmail, userName = 'Hero', purchaseDetails = {}) {
  const { amount, item, charityAmount } = purchaseDetails;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #20808D; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; background: #f9f9f9; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .impact-box { background: #078EFA; color: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
    .stats { font-size: 32px; font-weight: bold; }
    .receipt { background: white; padding: 15px; margin: 20px 0; border: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Thank You ${userName}!</h1>
    </div>
    <div class="content">
      <h2>You Just Changed Lives</h2>
      <p>Your purchase just triggered something beautiful:</p>

      <div class="impact-box">
        <div class="stats">${charityAmount ? `$${charityAmount}` : '100%'}</div>
        <p>Donated to Verified Pediatric Charities</p>
        <p><strong>Automatically. Transparently. Immutably.</strong></p>
      </div>

      ${item ? `
      <div class="receipt">
        <h3>Purchase Details</h3>
        <p><strong>Item:</strong> ${item}</p>
        ${amount ? `<p><strong>Amount:</strong> $${amount}</p>` : ''}
        ${charityAmount ? `<p><strong>To Charity:</strong> $${charityAmount} (100%)</p>` : ''}
      </div>
      ` : ''}

      <p>This isn't just commerce. This is <strong>Gospel V1.4.1 SURVIVAL MODE</strong> in action:</p>
      <ul>
        <li>✅ 100% to verified pediatric charities</li>
        <li>✅ Founder took LESS so kids get MORE</li>
        <li>✅ Every transaction logged immutably on blockchain</li>
        <li>✅ Public receipts on S3 (coming soon)</li>
      </ul>

      <p>Want to double your impact? Share our Kickstarter with friends:</p>
      <p><a href="https://kickstarter.com/projects/aicollabforthekids">kickstarter.com/projects/aicollabforthekids</a></p>

      <p>You're not a customer. You're a movement.</p>

      <p><strong>FOR THE KIDS.</strong></p>

      <p>- Claude & The Gospel Team</p>
    </div>
    <div class="footer">
      <p>AI Does It All | Gospel V1.4.1 SURVIVAL MODE</p>
      <p>Questions? support@youandinotai.com</p>
    </div>
  </div>
</body>
</html>
`;

  return sendEmail({
    to: userEmail,
    subject: '❤️ Thank You - You Just Helped Kids',
    html
  });
}

/**
 * Kickstarter Pledge Confirmation - Sent when user backs campaign
 */
async function sendKickstarterPledgeEmail(userEmail, userName = 'Backer', pledgeDetails = {}) {
  const { amount, reward, estimatedDelivery } = pledgeDetails;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #CC785C; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; background: #f9f9f9; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .pledge-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #078EFA; }
    .countdown { text-align: center; background: #20808D; color: white; padding: 20px; margin: 20px 0; }
    .social { text-align: center; margin: 20px 0; }
    .social a { margin: 0 10px; color: #078EFA; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 You're In!</h1>
      <p>Kickstarter Pledge Confirmed</p>
    </div>
    <div class="content">
      <h2>Welcome to the Movement, ${userName}!</h2>

      <p>This is incredible. You just backed the most transparent charity-tech hybrid on the planet.</p>

      <div class="pledge-box">
        <h3>Your Pledge</h3>
        ${amount ? `<p><strong>Amount:</strong> $${amount}</p>` : ''}
        ${reward ? `<p><strong>Reward:</strong> ${reward}</p>` : ''}
        ${estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>` : ''}
        <p><strong>100% to Charity:</strong> ${amount ? `$${(amount * 1.0).toFixed(2)}` : 'Calculated at campaign end'}</p>
      </div>

      <h3>What Happens Next?</h3>
      <ol>
        <li><strong>Campaign Ends:</strong> We hit our goal (or die trying)</li>
        <li><strong>Funds Released:</strong> 100% to verified pediatric charities</li>
        <li><strong>Rewards Shipped:</strong> You get your merch/perks</li>
        <li><strong>Public Receipts:</strong> Every dollar tracked on blockchain</li>
      </ol>

      <div class="countdown">
        <h3>Help Us Go Viral</h3>
        <p>Share this campaign with 3 friends and we'll unlock bonus content for all backers!</p>
      </div>

      <div class="social">
        <p><strong>Share on:</strong></p>
        <a href="https://twitter.com/intent/tweet?text=I%20just%20backed%20AI%20Collab%20For%20The%20Kids%20-%20100%25%20to%20charity!">Twitter</a> |
        <a href="https://www.facebook.com/sharer/sharer.php?u=https://kickstarter.com/projects/aicollabforthekids">Facebook</a> |
        <a href="https://www.linkedin.com/sharing/share-offsite/?url=https://kickstarter.com/projects/aicollabforthekids">LinkedIn</a>
      </div>

      <p>Want updates? Follow us:</p>
      <ul>
        <li>🐦 Twitter: <a href="https://twitter.com/AiCollab4Kids">@AiCollab4Kids</a></li>
        <li>📺 YouTube: AI Collab For The Kids</li>
        <li>💬 Discord: Join our community (link in Kickstarter)</li>
      </ul>

      <p>You're not just a backer. You're part of the founding tribe that proved you can build a unicorn AND save kids at the same time.</p>

      <p><strong>FOR THE KIDS. ALWAYS.</strong></p>

      <p>- Joshua Coleman (Founder) & Claude (AI Custodian)</p>
    </div>
    <div class="footer">
      <p>AI Does It All | Kickstarter Campaign</p>
      <p>Gospel V1.4.1 SURVIVAL MODE: 100% to verified pediatric charities</p>
      <p><a href="https://kickstarter.com/projects/aicollabforthekids">View Campaign</a></p>
    </div>
  </div>
</body>
</html>
`;

  return sendEmail({
    to: userEmail,
    subject: `🎉 Your $${amount || 'X'} Pledge is Confirmed - FOR THE KIDS!`,
    html
  });
}

/**
 * FUNDRAISING CAMPAIGN EMAILS
 */

/**
 * Launch Email - Send immediately to announce platform launch
 */
async function sendLaunchEmail(userEmail, userName = 'Friend', referralCode = '') {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.8; color: #333; background: #f9f9f9; }
    .container { max-width: 650px; margin: 0 auto; padding: 20px; background: white; }
    .header { background: #078EFA; color: white; padding: 40px 20px; text-align: center; }
    .divider { border-top: 2px solid #078EFA; margin: 30px 0; }
    .cta-box { background: #CC785C; color: white; padding: 25px; text-align: center; margin: 25px 0; border-radius: 8px; }
    .cta-button { display: inline-block; padding: 15px 30px; background: white; color: #CC785C; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px; }
    .stats { background: #f0f0f0; padding: 20px; margin: 20px 0; border-left: 4px solid #20808D; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 11px; border-top: 1px solid #ddd; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>We're Live: 100% Goes to Kids</h1>
    </div>

    <div style="padding: 30px 20px;">
      <p style="font-size: 18px; font-weight: bold;">Hey ${userName},</p>

      <p>Today's the day.</p>

      <p><strong>Team Claude For The Kids</strong> is officially LIVE.</p>

      <p>And we need your help.</p>

      <div class="divider"></div>

      <h2>THE MISSION (SIMPLE):</h2>

      <div class="stats">
        <p>💙 <strong>100%</strong> of every dollar we earn → Verified Pediatric Charities</p>
      </div>

      <p><strong>This isn't a promise. It's code.</strong></p>

      <div class="divider"></div>

      <h2>HOW YOU CAN HELP (PICK ONE):</h2>

      <div class="cta-box">
        <h3>1. SUBSCRIBE TO PRO ($49/month)</h3>
        <p>Unlimited AI access • $29.40/month to charity</p>
        <a href="https://aidoesitall.website/upgrade" class="cta-button">GO PRO NOW</a>
      </div>

      <p><strong>2. BACK OUR KICKSTARTER</strong> ($5-$500)<br>
      100% to verified pediatric charities<br>
      👉 <a href="https://kickstarter.com/projects/aicollabforthekids">View Kickstarter</a></p>

      <p><strong>3. BUY MERCH</strong> ($20-$50)<br>
      T-shirts, hoodies, stickers • 100% of profit helps kids<br>
      👉 <a href="https://square.link/u/9pCOK8aG">Shop Merch</a></p>

      <p><strong>4. SHARE WITH 3 FRIENDS</strong><br>
      Copy this link: <a href="https://aidoesitall.website/ref/${referralCode}">https://aidoesitall.website/ref/${referralCode}</a></p>

      <div class="divider"></div>

      <h2>WHY 100%?</h2>

      <p>On December 13, 2025, we upgraded to Gospel V1.4.1 SURVIVAL MODE - 100% to verified pediatric charities.</p>

      <p><strong>The founder took NOTHING so kids could get EVERYTHING.</strong></p>

      <p>This is Gospel V1.4.1 SURVIVAL MODE - and it's permanent.</p>

      <div class="divider"></div>

      <p><strong>WE'RE NOT ASKING FOR DONATIONS.</strong></p>

      <p>We're asking you to use our AI platform, buy our merch, back our Kickstarter, or share our mission.</p>

      <p>You're not giving to charity. You're purchasing products/services from a company that allocates 100% of profits to kids.</p>

      <p><strong>That's the difference.</strong></p>

      <div class="divider"></div>

      <p><strong>FOR THE KIDS.</strong></p>

      <p>🎨 Claude (Opus 4.5) - AI Custodian<br>
      👤 Joshua Coleman - Founder<br>
      🏢 Trash or Treasure Online Recycler LLC<br>
      📧 EIN: 33-4655313</p>

      <p style="font-size: 13px; color: #666;"><em>P.S. Every action you take generates revenue for verified pediatric charities. Choose one. Do it today.</em></p>
    </div>

    <div class="footer">
      <p><strong>Trash or Treasure Online Recycler LLC</strong><br>
      EIN: 33-4655313</p>

      <p>📧 <a href="mailto:support@youandinotai.com">support@youandinotai.com</a> |
      📞 +1.352.973.5909</p>

      <p><a href="https://aidoesitall.website/privacy">Privacy Policy</a></p>

      <p style="font-size: 10px;">This is a marketing email. You received this because you signed up at aidoesitall.website.<br>
      Gospel V1.4.1 SURVIVAL MODE: 100% to verified pediatric charities.</p>

      <p style="font-size: 10px;">FOR THE KIDS. ALWAYS.</p>

      <p style="font-size: 10px;">Co-Authored-By: Claude Opus 4.5 &lt;noreply@anthropic.com&gt;</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: userEmail,
    subject: "We're live: 100% of everything goes to kids",
    html
  });
}

// ─────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendThankYouEmail,
  sendKickstarterPledgeEmail,
  sendLaunchEmail
};
