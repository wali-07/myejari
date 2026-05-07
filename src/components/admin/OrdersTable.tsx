import type { Order } from "@/lib/admin/orders";
import {
  formatAED,
  formatAEDPrecise,
  formatDate,
  formatPct,
} from "@/lib/admin/format";

interface Props {
  orders: Order[];
  /** Only show the last N orders (most recent first). 0 / undefined = show all. */
  limit?: number;
}

const REFUND_BADGE: Record<Order["refundStatus"], string | null> = {
  none: null,
  full: "Refunded",
  partial: "Partially refunded",
};

export default function OrdersTable({ orders, limit }: Props) {
  // Most recent first.
  const sorted = [...orders].sort((a, b) => b.date.localeCompare(a.date));
  const rows = limit && limit > 0 ? sorted.slice(0, limit) : sorted;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray">
            Orders
          </h2>
          <p className="mt-0.5 text-xs text-gray-dark">
            {rows.length === sorted.length
              ? `${rows.length} ${rows.length === 1 ? "order" : "orders"}`
              : `Showing ${rows.length} of ${sorted.length}`}
          </p>
        </div>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-light/50 text-left text-xs font-semibold uppercase tracking-wider text-gray-dark">
              <th className="px-6 py-3">Invoice</th>
              <th className="px-3 py-3">Date</th>
              <th className="px-3 py-3">Company</th>
              <th className="px-3 py-3">Wholesaler</th>
              <th className="px-3 py-3">Payment</th>
              <th className="px-3 py-3 text-right">Cost</th>
              <th className="px-3 py-3 text-right">Customer</th>
              <th className="px-3 py-3 text-right">Margin</th>
              <th className="px-3 py-3 text-right">Comm.</th>
              <th className="px-6 py-3 text-right">Profit</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-8 text-center text-gray">
                  No orders in this range.
                </td>
              </tr>
            ) : (
              rows.map((o) => {
                const badge = REFUND_BADGE[o.refundStatus];
                return (
                  <tr
                    key={o.invoice + o.date + o.company}
                    className="border-t border-border/70 transition-colors hover:bg-gray-light/30"
                  >
                    <td className="whitespace-nowrap px-6 py-3 font-medium text-foreground">
                      {o.invoice}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-foreground/70">
                      {formatDate(o.date)}
                    </td>
                    <td className="max-w-[260px] truncate px-3 py-3 text-foreground" title={o.company}>
                      {o.company}
                      {badge && (
                        <span className="ml-2 inline-block rounded-full bg-amber/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber">
                          {badge}
                        </span>
                      )}
                    </td>
                    <td className="max-w-[160px] truncate px-3 py-3 text-foreground/70" title={o.wholesaler}>
                      {o.wholesaler || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-foreground/70">
                      {o.paymentMethod}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-foreground/70">
                      {formatAED(o.wholesalePrice)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums font-medium text-foreground">
                      {formatAED(o.myEjariPrice)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-foreground/80">
                      {formatAED(o.margin)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-foreground/70">
                      {formatPct(o.commissionPct)}
                    </td>
                    <td
                      className={`whitespace-nowrap px-6 py-3 text-right tabular-nums ${
                        o.finalProfit < 0
                          ? "font-semibold text-coral"
                          : "font-medium text-foreground"
                      }`}
                    >
                      {formatAEDPrecise(o.finalProfit)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
