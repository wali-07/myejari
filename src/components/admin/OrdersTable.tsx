import Link from "next/link";
import { FileDown } from "lucide-react";
import type { Order } from "@/lib/admin/orders";
import { netRevenueOf } from "@/lib/admin/orders";
import { formatAED, formatDate } from "@/lib/admin/format";
import OrderPaymentStatus from "@/components/admin/OrderPaymentStatus";
import OrderDocsModal from "@/components/admin/OrderDocsModal";
import DeleteOrderButton from "@/components/admin/DeleteOrderButton";

interface Props {
  orders: Order[];
}

const REFUND_BADGE: Record<Order["refundStatus"], string | null> = {
  none: null,
  full: "Refunded",
  partial: "Refunded",
};

const PAYMENT_BADGE: Record<Order["paymentMethod"], string> = {
  "Bank Transfer":
    "bg-primary-light/70 text-primary-dark ring-primary/15",
  Card: "bg-amber/10 text-[#a35a00] ring-amber/30",
  Other: "bg-gray-light text-gray-dark ring-border",
};

export default function OrdersTable({ orders }: Props) {
  // Most recent first — sort by date desc, then by invoice number desc to break ties.
  const rows = [...orders].sort((a, b) => {
    const d = b.date.localeCompare(a.date);
    if (d !== 0) return d;
    return b.invoice.localeCompare(a.invoice);
  });

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-light/40 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-dark">
              <th className="px-5 py-3">Invoice #</th>
              <th className="px-3 py-3">Date</th>
              <th className="px-3 py-3">Company</th>
              <th className="px-3 py-3">Mobile</th>
              <th className="px-3 py-3">Wholesaler</th>
              <th className="px-3 py-3">Payment</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">GMV</th>
              <th className="px-3 py-3 text-right">Cost</th>
              <th className="px-3 py-3 text-right">Net Revenue</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="px-6 py-10 text-center text-sm text-gray"
                >
                  No orders match the current filters.
                </td>
              </tr>
            ) : (
              rows.map((o, idx) => {
                const badge = REFUND_BADGE[o.refundStatus];
                const net = netRevenueOf(o);
                return (
                  <tr
                    // Some legacy CRM rows share an invoice number, so
                    // composite-key the row with the array index too.
                    key={`${o.invoice}-${o.date}-${idx}`}
                    className="border-t border-border/60 transition-colors hover:bg-primary-light/20"
                  >
                    <td className="whitespace-nowrap px-5 py-3 text-foreground">
                      {o.invoice}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-foreground">
                      {formatDate(o.date)}
                    </td>
                    <td
                      className="max-w-[280px] truncate px-3 py-3 text-foreground"
                      title={o.company}
                    >
                      <span>{o.company}</span>
                      {badge && (
                        <span className="ml-2 inline-block rounded-full bg-coral/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-coral ring-1 ring-coral/20">
                          {badge}
                        </span>
                      )}
                    </td>
                    <td
                      className="max-w-[160px] truncate whitespace-nowrap px-3 py-3 text-foreground"
                      title={o.contactMobile}
                    >
                      {o.contactMobile || "—"}
                    </td>
                    <td
                      className="max-w-[180px] truncate whitespace-nowrap px-3 py-3 text-foreground"
                      title={o.wholesaler}
                    >
                      {o.wholesaler || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${
                          PAYMENT_BADGE[o.paymentMethod]
                        }`}
                      >
                        {o.paymentMethod}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <OrderPaymentStatus order={o} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-foreground">
                      {formatAED(o.myEjariPrice)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-foreground">
                      {formatAED(o.wholesalePrice)}
                    </td>
                    <td
                      className={`whitespace-nowrap px-3 py-3 text-right tabular-nums ${
                        net < 0 ? "text-coral" : "text-foreground"
                      }`}
                    >
                      {formatAED(net)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-0.5">
                        <Link
                          href={`/admin/invoices/${o.invoice}`}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-dark transition-colors hover:bg-gray-light hover:text-foreground"
                          title={`Open invoice ${o.invoice} (PDF)`}
                        >
                          <FileDown size={14} />
                        </Link>
                        <OrderDocsModal order={o} />
                        {o.paymentStatus === "unpaid" && (
                          <DeleteOrderButton invoice={o.invoice} />
                        )}
                      </div>
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
