import Link from "next/link";
import { Inbox } from "lucide-react";
import type { Order } from "@/lib/admin/orders";
import OrderRow from "@/components/admin/OrderRow";
import OrderCardMobile from "@/components/admin/OrderCardMobile";

interface Props {
  orders: Order[];
  wholesalers: string[];
  /** True when any URL filter is active — controls the empty-state CTA. */
  hasActiveFilters?: boolean;
  /** Path to clear all filters (typically "/admin"). */
  clearFiltersHref?: string;
}

// `<thead>` sticky has known cross-browser issues; sticky each `<th>`
// instead. Top offset matches the page header height (~56px + 1px border).
const TH_STICKY =
  "sticky top-14 z-10 bg-gray-light/95 backdrop-blur px-3 py-2.5 first:pl-5 last:pr-5";

export default function OrdersTable({
  orders,
  wholesalers,
  hasActiveFilters = false,
  clearFiltersHref = "/admin",
}: Props) {
  // Most recent first — sort by date desc, then by invoice number desc.
  const rows = [...orders].sort((a, b) => {
    const d = b.date.localeCompare(a.date);
    if (d !== 0) return d;
    return b.invoice.localeCompare(a.invoice);
  });

  if (rows.length === 0) {
    return (
      <section className="overflow-clip rounded-2xl border border-border bg-white shadow-sm">
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-light text-gray-dark">
            <Inbox size={20} />
          </span>
          <p className="text-sm font-medium text-foreground">
            No orders match the current filters
          </p>
          {hasActiveFilters && (
            <Link
              href={clearFiltersHref}
              scroll={false}
              className="inline-flex items-center rounded-full bg-foreground px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-foreground/90"
            >
              Clear filters
            </Link>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-clip rounded-2xl border border-border bg-white shadow-sm">
      {/* Mobile: card list. Hidden ≥sm. */}
      <ul className="divide-y divide-border/60 sm:hidden">
        {rows.map((o, idx) => (
          <li key={`mob-${o.invoice}-${o.date}-${idx}`}>
            <OrderCardMobile order={o} wholesalers={wholesalers} />
          </li>
        ))}
      </ul>

      {/* Desktop: table with sticky-per-th header. Hidden <sm. */}
      <div className="hidden sm:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-dark">
              <th className={TH_STICKY}>#</th>
              <th className={TH_STICKY}>Date</th>
              <th className={TH_STICKY}>Company</th>
              <th className={TH_STICKY}>Mobile</th>
              <th className={TH_STICKY}>Wholesaler</th>
              <th className={TH_STICKY}>Payment</th>
              <th className={TH_STICKY}>Status</th>
              <th className={`${TH_STICKY} text-right`}>GMV</th>
              <th className={`${TH_STICKY} text-right`}>Cost</th>
              <th className={`${TH_STICKY} text-right`}>Net Revenue</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o, idx) => (
              <OrderRow
                key={`${o.invoice}-${o.date}-${idx}`}
                order={o}
                wholesalers={wholesalers}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
