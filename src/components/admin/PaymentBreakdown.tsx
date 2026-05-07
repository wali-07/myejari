import type { OrderMetrics } from "@/lib/admin/orders";
import { formatAED } from "@/lib/admin/format";

interface Props {
  breakdown: OrderMetrics["paymentBreakdown"];
  totalCount: number;
}

const ROW_TONES: Record<string, string> = {
  "Bank Transfer": "bg-primary",
  Card: "bg-amber",
  Other: "bg-gray-dark",
};

export default function PaymentBreakdown({ breakdown, totalCount }: Props) {
  const entries = (Object.keys(breakdown) as (keyof typeof breakdown)[])
    .map((k) => ({ method: k, ...breakdown[k] }))
    .filter((e) => e.count > 0)
    .sort((a, b) => b.count - a.count);

  return (
    <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray">
        Payment methods
      </h2>
      <div className="mt-5 space-y-4">
        {entries.length === 0 ? (
          <p className="text-sm text-gray">No orders in this range.</p>
        ) : (
          entries.map((e) => {
            const pct = totalCount === 0 ? 0 : (e.count / totalCount) * 100;
            return (
              <div key={e.method}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{e.method}</span>
                  <span className="tabular-nums text-foreground/70">
                    {e.count} · {formatAED(e.gmv)}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-light">
                  <div
                    className={`h-full ${ROW_TONES[e.method] ?? "bg-foreground"}`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray">
                  {pct.toFixed(0)}% of orders
                </p>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
