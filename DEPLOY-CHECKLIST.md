# GoLive Checklist (MustHaves)

1. Secrets injection complete
   - Merge C:\Keys\stripe-production.env, plaid-production.env, square-production.env into .env.production (local only)
   - Set Stripe/Plaid live secrets in Railway variables (project-level)

2. Deploy to Railway
   - railway up
   - Confirm GET /health returns 200 JSON { status: "ok" }

3. Payments flow - $9.99 subscription
   - Create a live PaymentIntent $9.99 via Stripe
   - Verify webhook appends an entry in ./data/payments_ledger.json

4. Treasury allocation (5%)
   - GET /api/treasury/metrics - confirm treasury_amount $0.50 for $9.99

5. Governance dashboard visible
   - Mount GovernanceDashboard component and verify live metrics
