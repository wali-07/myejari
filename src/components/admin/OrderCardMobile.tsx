"use client";

import { useState } from "react";
import { Check, Clock } from "lucide-react";
import type { Order } from "@/lib/admin/orders";
import { formatAED, formatDate } from "@/lib/admin/format";
import OrderDetailsModal from "@/components/admin/OrderDetailsModal";

interface Props {
  order: Order;
  wholesalers: string[];
}

const PAYMENT_DOT: Record<Order["paymentMethod"], string> = {
  "Bank Transfer": "bg-primary",
  Card: "bg-amber",
  Other: "bg-gray-dark",
};

const REFUND_LABEL: Record<Order["refundStatus"], string | null> = {
  none: null,
  full: "Refunded",
  partial: "Partial refund",
};

// Mobile-only order card. Two-line dense layout — company name as
// focal point with everything else on the second line. Tap the card to
// open the details popup (the same one used by the desktop table row).
export default function OrderCardMobile({ order: o, wholesalers }: Props) {
  const [open, setOpen] = useState(false);
  const isPaid = o.paymentStatus === "paid";
  const refund = REFUND_LABEL[o.refundStatus];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full px-4 py-2.5 text-left transition-colors hover:bg-primary-light/10 active:bg-primary-light/20"
      >
        {/* Line 1: company (focal) + AED amount on the right */}
        <div className="flex items-baseline justify-between gap-3">
          <span className="line-clamp-1 text-sm font-medium text-foreground">
            {o.company}
          </span>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
            {formatAED(o.myEjariPrice)}
          </span>
        </div>
        {/* Line 2: status + payment + date + invoice */}
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-dark">
          {isPaid ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-success ring-1 ring-success/20">
              <Check size={10} />
              Paid
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber ring-1 ring-amber/30">
              <Clock size={10} />
              Unpaid
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <span
              className={`h-1.5 w-1.5 rounded-full ${PAYMENT_DOT[o.paymentMethod]}`}
              aria-hidden="true"
            />
            {o.paymentMethod}
          </span>
          <span aria-hidden="true" className="text-gray">·</span>
          <span>{formatDate(o.date)}</span>
          <span aria-hidden="true" className="text-gray">·</span>
          <span className="font-medium uppercase tracking-wider text-gray">
            {o.invoice}
          </span>
          {refund && (
            <span className="inline-flex items-center rounded-full bg-coral/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-coral ring-1 ring-coral/20">
              {refund}
            </span>
          )}
        </div>
      </button>

      {open && (
        <OrderDetailsModal
          order={o}
          open
          onClose={() => setOpen(false)}
          wholesalers={wholesalers}
        />
      )}
    </>
  );
}
