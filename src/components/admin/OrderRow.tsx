"use client";

import { useState } from "react";
import { Check, Clock } from "lucide-react";
import type { Order } from "@/lib/admin/orders";
import { netRevenueOf } from "@/lib/admin/orders";
import { formatAED, formatDate } from "@/lib/admin/format";
import OrderDetailsModal from "@/components/admin/OrderDetailsModal";

const REFUND_BADGE: Record<Order["refundStatus"], string | null> = {
  none: null,
  full: "Refunded",
  partial: "Refunded",
};

const PAYMENT_BADGE: Record<Order["paymentMethod"], string> = {
  "Bank Transfer": "bg-primary-light/70 text-primary-dark ring-primary/15",
  Card: "bg-amber/10 text-[#a35a00] ring-amber/30",
  Other: "bg-gray-light text-gray-dark ring-border",
};

interface Props {
  order: Order;
  wholesalers: string[];
}

// One table row. The row is display-only — clicking anywhere on it opens
// the details popup, which is the single surface for every mutation
// (edit, mark paid, upload invoice, delete).
export default function OrderRow({ order: o, wholesalers }: Props) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const badge = REFUND_BADGE[o.refundStatus];
  const net = netRevenueOf(o);
  const isPaid = o.paymentStatus === "paid";

  return (
    <>
      <tr
        onClick={() => setDetailsOpen(true)}
        className="cursor-pointer border-t border-border/60 transition-colors hover:bg-primary-light/20"
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
          {isPaid ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-success ring-1 ring-success/20">
              <Check size={10} />
              Paid
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber ring-1 ring-amber/30">
              <Clock size={10} />
              Not paid
            </span>
          )}
        </td>
        <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-foreground">
          {formatAED(o.myEjariPrice)}
        </td>
        <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-foreground">
          {formatAED(o.wholesalePrice)}
        </td>
        <td
          className={`whitespace-nowrap px-5 py-3 text-right tabular-nums ${
            net < 0 ? "text-coral" : "text-foreground"
          }`}
        >
          {formatAED(net)}
        </td>
      </tr>

      {detailsOpen && (
        <OrderDetailsModal
          order={o}
          open
          onClose={() => setDetailsOpen(false)}
          wholesalers={wholesalers}
        />
      )}
    </>
  );
}
