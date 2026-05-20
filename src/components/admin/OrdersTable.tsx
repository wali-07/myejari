import type { Order } from "@/lib/admin/orders";
import OrderRow from "@/components/admin/OrderRow";

interface Props {
  orders: Order[];
  wholesalers: string[];
}

export default function OrdersTable({ orders, wholesalers }: Props) {
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
              <th className="px-5 py-3">#</th>
              <th className="px-3 py-3">Date</th>
              <th className="px-3 py-3">Company</th>
              <th className="px-3 py-3">Mobile</th>
              <th className="px-3 py-3">Wholesaler</th>
              <th className="px-3 py-3">Payment</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">GMV</th>
              <th className="px-3 py-3 text-right">Cost</th>
              <th className="px-5 py-3 text-right">Net Revenue</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-6 py-10 text-center text-sm text-gray"
                >
                  No orders match the current filters.
                </td>
              </tr>
            ) : (
              rows.map((o, idx) => (
                // Some legacy CRM rows share an invoice number, so
                // composite-key the row with the array index too.
                <OrderRow
                  key={`${o.invoice}-${o.date}-${idx}`}
                  order={o}
                  wholesalers={wholesalers}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
