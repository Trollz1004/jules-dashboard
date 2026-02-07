# Support Copy - Ready to Use
## OPUS Trust Platform - Founder Tier Compliant

---

## AUDIT FINDINGS

### 1. Contact Email Visibility
**Status:** PARTIALLY VISIBLE

**Found emails:**
- `support@youandinotai.com` - Used in backend code (ai-chat.js, kickstarter.js, dao-webhooks.js, email.js)
- `privacy@youandinotai.com` - In Terms of Service and Privacy Policy
- `admin@yourplatform.com` - Placeholder in founding-members.html (NEEDS UPDATE)
- `support@yourplatform.com` - Placeholder in COMPLIANCE.md (NEEDS UPDATE)

**Issue:** Contact email is NOT prominently visible on customer-facing pages. Footer in `founding-member.html` has no email. Footer in `backend/public/founding-members.html` uses placeholder `admin@yourplatform.com`.

---

### 2. Support Page / FAQ
**Status:** EXISTS BUT INCOMPLETE

**Existing FAQ locations:**
- `C:/OPUStrustForTheKidsPlatform/frontend/founding-member.html` - Has 5 FAQ items
- `C:/OPUStrustForTheKidsPlatform/backend/public/founding-members.html` - Has 2 FAQ items
- `C:/OPUStrustForTheKidsPlatform/backend/routes/LAUNCH_KIT_MESSAGING.md` - Has 10 detailed FAQs

**Issue:** No dedicated support page. FAQ exists but is scattered across files and lacks support-specific questions (payment issues, cancellation process, technical troubleshooting).

---

### 3. Payment Issue Handling
**Status:** DOCUMENTED BUT NOT USER-FACING

**Current behavior:**
- Square checkout errors display generic alerts
- Dating subscriptions return a compliance message with support email
- 14-day refund policy exists in COMPLIANCE.md but NOT visible to users
- Cancellation policy exists but not prominently displayed

**From `square-subscriptions.js`:**
```javascript
support: 'admin@yourplatform.com', // NEEDS UPDATE
```

**From `COMPLIANCE.md`:**
- Cancel anytime through account settings
- Cancellation takes effect at end of billing period
- 14-day refund window for initial purchase
- Contact support for refund requests

---

## READY-TO-USE SUPPORT COPY

### 1. Simple Support Email Copy

**Short version:**
```
For support, email: support@youandinotai.com
```

**With response time:**
```
Need help? Email us at support@youandinotai.com
We respond within 24 hours.
```

**For footer:**
```html
<p>Need help? <a href="mailto:support@youandinotai.com">support@youandinotai.com</a></p>
```

---

### 2. FAQ Section Copy (Founder-Tier Compliant)

```html
<section class="faq-section">
    <h2>Frequently Asked Questions</h2>

    <div class="faq-item">
        <h4>How do I cancel my subscription?</h4>
        <p>You can cancel anytime through your account settings. Your access continues until the end of your current billing period. No partial refunds for unused time, but you keep all benefits until your subscription expires.</p>
    </div>

    <div class="faq-item">
        <h4>When will I be charged?</h4>
        <p>For monthly plans, you're charged on the same date each month. For one-time purchases (like Founding Member), you're charged once at checkout with no recurring fees ever. All payments are processed securely through Square or Stripe.</p>
    </div>

    <div class="faq-item">
        <h4>How do I contact support?</h4>
        <p>Email us at support@youandinotai.com. We respond within 24 hours on business days. For urgent payment issues, include your email and order ID in your message.</p>
    </div>

    <div class="faq-item">
        <h4>Is my payment secure?</h4>
        <p>Yes. All payments are processed through Square or Stripe, industry-leading payment processors with bank-level encryption. We never store your full card details on our servers.</p>
    </div>

    <div class="faq-item">
        <h4>What if the app doesn't launch?</h4>
        <p>Your investment is protected. If we don't launch by the announced date, we'll either extend your access at no cost or provide a full refund. As a Founding Member, you're backing a real team building real products. Check our transparency dashboard for real-time progress updates.</p>
    </div>
</section>
```

---

### 3. Extended FAQ (10 Questions)

```markdown
## Complete FAQ

### Account & Access

**Q: How do I cancel my subscription?**
A: You can cancel anytime through your account settings. Your access continues until the end of your current billing period. No partial refunds for unused time, but you keep all benefits until your subscription expires.

**Q: Can I get a refund?**
A: Refunds are available within 14 days of your initial purchase. After 14 days, you can cancel to stop future billing but won't receive a refund for the current period. For refund requests, email support@youandinotai.com with your order details.

**Q: What happens to my data if I cancel?**
A: Your data remains secure and can be deleted upon request. Email privacy@youandinotai.com to request data deletion.

### Payments & Billing

**Q: When will I be charged?**
A: For monthly plans, you're charged on the same date each month. For one-time purchases (like Founding Member), you're charged once at checkout with no recurring fees ever. All payments are processed securely through Square or Stripe.

**Q: Is my payment secure?**
A: Yes. All payments are processed through Square or Stripe, industry-leading payment processors with bank-level encryption. We never store your full card details on our servers.

**Q: My payment failed. What do I do?**
A: Check that your card details are correct and your bank hasn't blocked the transaction. Try a different payment method or contact your bank. If issues persist, email support@youandinotai.com and we'll help resolve it.

### Support & Contact

**Q: How do I contact support?**
A: Email us at support@youandinotai.com. We respond within 24 hours on business days. For urgent payment issues, include your email and order ID in your message.

**Q: I haven't received my confirmation email.**
A: Check your spam folder first. If it's not there, email support@youandinotai.com with the email you used at checkout and we'll resend it.

### Product & Launch

**Q: What if the app doesn't launch?**
A: Your investment is protected. If we don't launch by the announced date, we'll either extend your access at no cost or provide a full refund. As a Founding Member, you're backing a real team building real products. Check our transparency dashboard for real-time progress updates.

**Q: What's included in Founding Member?**
A: Lifetime Pro access, all current and future features, priority support, exclusive badge, and recognition on our Founder Wall. One payment, lifetime value.
```

---

## WHERE TO ADD THIS COPY

### High Priority Updates

| File | Location | Action | Status |
|------|----------|--------|--------|
| `frontend/founding-member.html` | Line 701 (footer) | Add support email link | MANUAL |
| `backend/public/founding-members.html` | Line 369 (footer) | Update `admin@yourplatform.com` to `support@youandinotai.com` | MANUAL |
| `backend/routes/square-subscriptions.js` | Line 55 | Update `admin@yourplatform.com` to `support@youandinotai.com` | DONE |
| `COMPLIANCE.md` | Line 437 | Update `support@yourplatform.com` to `support@youandinotai.com` | MANUAL |

### Recommended Additions

1. **Create dedicated support page**: `frontend/support.html` or add `/support` route
2. **Add FAQ to checkout page**: `checkout.html` - users need reassurance before payment
3. **Footer consistency**: Add support email to ALL page footers
4. **Email templates**: Include support email in all transactional emails (already done in some)

---

## FOOTER TEMPLATE (Copy-Paste Ready)

```html
<footer style="background: var(--void-dark); padding: 40px 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
    <p style="color: var(--text-dim); margin-bottom: 10px;">
        Trash or Treasure Online Recycler LLC | EIN: 33-4655313
    </p>
    <p style="color: var(--text-dim); margin-bottom: 10px;">
        Need help? <a href="mailto:support@youandinotai.com" style="color: var(--coral);">support@youandinotai.com</a>
    </p>
    <p style="color: var(--text-dim); font-size: 0.9rem;">
        <a href="/terms.html" style="color: var(--text-dim);">Terms</a> |
        <a href="/privacy.html" style="color: var(--text-dim);">Privacy</a>
    </p>
</footer>
```

---

## PAYMENT ERROR COPY

For checkout error states:

```html
<div class="payment-error">
    <h3>Payment Issue?</h3>
    <p>If your payment didn't go through:</p>
    <ul>
        <li>Check your card details are correct</li>
        <li>Ensure your bank hasn't blocked the transaction</li>
        <li>Try a different payment method</li>
    </ul>
    <p>Still having trouble? Email <a href="mailto:support@youandinotai.com">support@youandinotai.com</a> with your order details.</p>
</div>
```

---

## COMPLIANCE NOTE

All copy above is **founder-tier compliant**:
- No charity language
- No donation references
- Focuses on product value and customer support
- Clear refund/cancellation policies
- Transparent business practices

---

*Document created: January 17, 2026*
*For: OPUS Trust Platform Support Implementation*
