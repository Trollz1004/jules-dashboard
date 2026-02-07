import fs from 'fs';
import path from 'path';

export default function treasuryRoutes(app) {
  const LEDGER = process.env.LEDGER_PATH || path.join(process.cwd(), 'data', 'payments_ledger.json');
  const PCT = Number(process.env.DAO_TREASURY_PERCENT || 0.05);
  const CURRENCY = 'USD';

  app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

  app.get('/api/treasury/metrics', (_req, res) => {
    try {
      let revenue_total = 0;
      let subscription_count = 0;

      if (fs.existsSync(LEDGER)) {
        const raw = fs.readFileSync(LEDGER, 'utf8');
        const entries = JSON.parse(raw || '[]');
        for (const e of entries) {
          if (e && e.status === 'succeeded' && typeof e.amount === 'number' && e.currency === CURRENCY) {
            revenue_total += e.amount; // dollars
            subscription_count += 1;
          }
        }
      }
      const treasury_amount = +(revenue_total * PCT).toFixed(2);
      res.json({
        revenue_total: +revenue_total.toFixed(2),
        subscription_count,
        treasury_percent: PCT,
        treasury_amount,
        currency: CURRENCY,
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      res.status(500).json({ error: 'metrics_failed', message: String(err) });
    }
  });
}
