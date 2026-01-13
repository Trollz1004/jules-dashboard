import React, { useEffect, useState } from 'react';

type Metrics = {
  revenue_total: number;
  subscription_count: number;
  treasury_percent: number;
  treasury_amount: number;
  currency: string;
  updated_at: string;
};

export default function GovernanceDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/treasury/metrics', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setMetrics(json);
      } catch (e: any) {
        setErr(e.message || 'Failed to load metrics');
      }
    };
    fetchMetrics();
    const id = setInterval(fetchMetrics, 5000);
    return () => clearInterval(id);
  }, []);

  if (err) return <div className="p-4 text-red-600">Error: {err}</div>;
  if (!metrics) return <div className="p-4">Loading governance metrics</div>;

  return (
    <div className="p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-semibold mb-4">
        Community Governance  Realtime Treasury
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border rounded">
          <div className="text-gray-500">Total Revenue</div>
          <div className="text-3xl font-bold">
            {metrics.currency} {metrics.revenue_total.toFixed(2)}
          </div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-gray-500">Subscriptions</div>
          <div className="text-3xl font-bold">{metrics.subscription_count}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-gray-500">Treasury %</div>
          <div className="text-3xl font-bold">
            {(metrics.treasury_percent * 100).toFixed(0)}%
          </div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-gray-500">Treasury Amount</div>
          <div className="text-3xl font-bold">
            {metrics.currency} {metrics.treasury_amount.toFixed(2)}
          </div>
        </div>
      </div>
      <div className="text-sm text-gray-400 mt-4">
        Updated: {metrics.updated_at}
      </div>
      <p className="mt-6 text-gray-600">
        Messaging: Communitydriven dating platform with transparent governance.
        Users stake tokens to vote on feature priorities. No charity language here.
      </p>
    </div>
  );
}
