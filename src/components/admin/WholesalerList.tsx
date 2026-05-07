import type { OrderMetrics } from "@/lib/admin/orders";
import { formatAED } from "@/lib/admin/format";

interface Props {
  wholesalers: OrderMetrics["topWholesalers"];
}

export default function WholesalerList({ wholesalers }: Props) {
  return (
    <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray">
        Top wholesalers
      </h2>
      <div className="mt-5 divide-y divide-border/70">
        {wholesalers.length === 0 ? (
          <p className="py-2 text-sm text-gray">No data in this range.</p>
        ) : (
          wholesalers.map((w, i) => (
            <div
              key={w.name}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-light text-[11px] font-semibold text-gray-dark tabular-nums">
                  {i + 1}
                </span>
                <span className="truncate text-sm font-medium text-foreground">
                  {w.name}
                </span>
              </div>
              <div className="shrink-0 text-right tabular-nums">
                <p className="text-sm font-semibold text-foreground">
                  {w.count}
                </p>
                <p className="text-[11px] text-gray">{formatAED(w.gmv)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
