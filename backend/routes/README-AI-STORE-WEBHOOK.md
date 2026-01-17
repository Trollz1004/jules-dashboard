# AI Solutions Store - Square Webhook Handler

**Created:** 2025-12-21
**File:** `C:\AiCollabForTheKids\api\routes\ai-store-webhook.js`
**Endpoint:** `https://api.youandinotai.com/api/ai-store-webhook`

---

## Purpose

Automatically processes Square `payment.completed` webhooks for the AI Solutions Store and sends product-specific delivery emails with setup instructions, GitHub access, and support information.

**Mission:** 100% of all revenue goes to verified pediatric charities (Gospel V1.4.1 SURVIVAL MODE)

---

## Products Supported

| Product | Price | Delivery Method |
|---------|-------|-----------------|
| Claude Droid | $299 | GitHub repo access + setup guide |
| Income Droid | $499 | GitHub repo access + video tutorial |
| Marketing Engine | $199 | GitHub repo access + API keys guide |
| Jules AI | $399 | GitHub repo access + GCP/AWS integration guide |
| Affiliate System | $599 | GitHub repo access + white-label guide |
| Dating Platform | $2,499 | Full source code zip + deployment guide |
| Custom Consult | $99 | Calendly booking link |
| Merch (tee, hoodie, mug, stickers, bundle) | $5-$75 | Printful auto-fulfillment |

---

## Setup Instructions

### 1. Configure SendGrid

1. Sign up for SendGrid: https://signup.sendgrid.com/
2. Verify your sender email (`support@youandinotai.com`)
3. Create an API key:
   - Go to: https://app.sendgrid.com/settings/api_keys
   - Click "Create API Key"
   - Name: "AI Solutions Store Webhook"
   - Permissions: "Full Access" (or "Mail Send" only)
   - Copy the key (you'll only see it once!)
4. Add to `.env`:
   ```bash
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 2. Configure Square Webhook

1. Go to Square Developer Dashboard: https://developer.squareup.com/
2. Navigate to: **Webhooks** → **Create Subscription**
3. Configure:
   - **Event Type:** `payment.completed`
   - **URL:** `https://api.youandinotai.com/api/ai-store-webhook`
   - **API Version:** Latest (2024-12-18 or newer)
4. Copy the **Signature Key** and add to `.env`:
   ```bash
   SQUARE_WEBHOOK_SECRET=1Rz4NEptrk1fYwlHBgs_aw
   ```

### 3. Update Server

The webhook is already registered in `server.js`:

```javascript
app.use('/api/ai-store-webhook', aiStoreWebhookRoutes);
```

### 4. Test the Webhook

Health check:
```bash
curl https://api.youandinotai.com/api/ai-store-webhook/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "AI Solutions Store Webhook Handler",
  "timestamp": "2025-12-21T...",
  "mission": "FOR THE KIDS - 100% to verified pediatric charities"
}
```

---

## How It Works

### Workflow

1. **Customer purchases** from ai-solutions.store (Square checkout)
2. **Square sends webhook** to `/api/ai-store-webhook` with `payment.completed` event
3. **Signature verification** using `SQUARE_WEBHOOK_SECRET`
4. **Product identification** by:
   - Matching order line items with product catalog
   - Fallback: Match payment amount to product price
5. **Email delivery** via SendGrid with product-specific instructions
6. **GitHub access** (manual process - owner invites customer to private repo)

### Product Identification Logic

```javascript
// Order of precedence:
1. Order line item name matches product name
2. Order line item contains product keyword
3. Payment amount matches product price (within $0.01)
```

### Email Templates

Each product has a custom HTML email template with:
- Order confirmation
- Step-by-step setup instructions
- GitHub repository URL
- Support contact information
- 100% charity disclosure

---

## Email Content by Product

### GitHub Repo Products (claude-droid, income-droid, etc.)

**Email includes:**
- GitHub repo URL
- Note about GitHub invitation (sent within 24 hours)
- Clone and install commands
- Configuration steps (.env setup)
- Support links (email + GitHub issues)

### Dating Platform (Full Source)

**Email includes:**
- GitHub repo URL for download
- Complete deployment guide links
- High-risk merchant account warning (MCC 7273)
- Technical stack overview
- 30 days email support notice

### Consultation

**Email includes:**
- Calendly booking link
- What to expect during the call
- Pre-call preparation checklist
- Meeting format (Google Meet)
- Rescheduling instructions

### Merch Items

**Email includes:**
- Order confirmation
- Printful fulfillment notice
- Shipping timeline (2-3 days to ship, 5-7 days delivery)
- Tracking info will be sent separately

---

## GitHub Access Process

**IMPORTANT:** The webhook sends the delivery email, but **GitHub access must be granted manually**.

### Manual Steps (Owner Action Required)

For each software product purchase:

1. Check the webhook logs for customer email
2. Go to GitHub: https://github.com/orgs/Ai-Solutions-Store/people
3. Click **"Invite member"**
4. Enter customer email address
5. Grant **Read access** to the specific repository
6. Customer receives GitHub invitation email (separate from delivery email)

### Repositories

- https://github.com/Ai-Solutions-Store/claude-droid (PRIVATE)
- https://github.com/Ai-Solutions-Store/income-droid (PRIVATE)
- https://github.com/Ai-Solutions-Store/marketing-engine (PRIVATE)
- https://github.com/Ai-Solutions-Store/jules-ai (PRIVATE)
- https://github.com/Ai-Solutions-Store/affiliate-system (PRIVATE)
- https://github.com/Ai-Solutions-Store/dating-platform (PRIVATE)

**Note:** These repositories need to be created if they don't exist yet.

---

## Error Handling

### If SendGrid Fails

- Error logged to console with full details
- Manual delivery required flag set
- Console output includes:
  ```
  MANUAL DELIVERY REQUIRED: {
    customerEmail: "...",
    product: "...",
    paymentId: "...",
    error: "..."
  }
  ```

### If Product Cannot Be Identified

- Generic confirmation email sent
- Manual review required
- Logs show: `product_unknown` status

### If Webhook Signature Invalid

- 403 Forbidden response
- Request rejected
- Security event logged

---

## Security

### Webhook Signature Verification

Every webhook request is verified using HMAC-SHA256:

```javascript
const hmac = crypto.createHmac('sha256', SQUARE_WEBHOOK_SECRET);
hmac.update(requestBody);
const hash = hmac.digest('base64');
return hash === signatureHeader;
```

### Required Headers

- `x-square-hmacsha256-signature`: HMAC signature from Square

### Protection Against

- Replay attacks (Square includes timestamp in signature)
- Man-in-the-middle attacks (HTTPS + signature verification)
- Fake payment injection (signature verification prevents unauthorized webhooks)

---

## Testing

### Test with Square Sandbox

1. Switch to sandbox mode:
   ```bash
   SQUARE_ENVIRONMENT=sandbox
   SQUARE_ACCESS_TOKEN=<sandbox_token>
   ```

2. Create test payment in Square Sandbox Dashboard

3. Square will send webhook to your configured URL

### Test Email Delivery

1. Use a test email address
2. Make a real purchase or use Square's webhook testing tool
3. Verify email received with correct content

---

## Monitoring

### Key Metrics to Track

- Webhook success rate
- Email delivery rate (SendGrid dashboard)
- Product identification accuracy
- Time to GitHub access grant (manual)

### Logs to Monitor

```bash
# Successful processing
📥 AI STORE WEBHOOK RECEIVED: payment.completed
📦 Product identified: Claude Droid
✅ Delivery email sent to customer@email.com for Claude Droid
💚 AI STORE ORDER PROCESSED: { product, amount, customer, emailSent }

# Errors
❌ SENDGRID EMAIL ERROR: [error details]
⚠️ Could not identify product for payment: [payment_id]
⚠️ No customer email found, using owner email as fallback
```

---

## Troubleshooting

### Email Not Sent

1. **Check SendGrid API key:**
   ```bash
   # Verify key is set
   echo $SENDGRID_API_KEY
   ```

2. **Check SendGrid activity:**
   - Go to: https://app.sendgrid.com/email_activity
   - Search for customer email or payment ID

3. **Verify sender email:**
   - `support@youandinotai.com` must be verified in SendGrid

### GitHub Invitation Not Received

1. Check GitHub invitation was sent from Ai-Solutions-Store org
2. Ask customer to check spam folder
3. Resend invitation from GitHub manually

### Product Not Identified

1. Check Square order details match product catalog
2. Verify product names in Square match `PRODUCT_CATALOG`
3. Update product catalog if needed

---

## Future Enhancements

### Automated GitHub Access

Consider implementing GitHub API integration to automatically invite customers:

```javascript
// Pseudo-code
const octokit = new Octokit({ auth: GITHUB_TOKEN });
await octokit.orgs.createInvitation({
  org: 'Ai-Solutions-Store',
  email: customerEmail,
  role: 'direct_member',
  team_ids: [repo_access_team_id]
});
```

### Product Delivery Tracking

Add database table to track:
- Payment ID
- Product purchased
- Email sent timestamp
- GitHub access granted timestamp
- Customer support tickets

### Automated Testing

Create test suite for:
- Webhook signature verification
- Product identification logic
- Email template rendering
- Error handling scenarios

---

## Support

**Email:** support@youandinotai.com
**Owner:** admin@yourplatform.com
**GitHub Org:** https://github.com/Ai-Solutions-Store

---

## Gospel V1.4.1 SURVIVAL MODE Compliance

Every purchase through this webhook supports our mission:
- **100%** → verified pediatric charities

**FOR THE KIDS. ALWAYS.**
