"use client";

import { useEffect } from "react";
import { FileDown, X } from "lucide-react";
import Link from "next/link";
import type { Order } from "@/lib/admin/orders";
import { netRevenueOf } from "@/lib/admin/orders";
import {
  formatAEDPrecise,
  formatDate,
  formatPct,
} from "@/lib/admin/format";

interface Props {
  order: Order;
  open: boolean;
  onClose: () => void;
}

// Read-only "everything about this order" sheet, opened by clicking a row
// in the orders table. Mobile-first, same shell as the other admin modals.
export default function OrderDetailsModal({ order, open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const net = netRevenueOf(order);

  return (
    <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:p-4">
      <div
        className="fixed inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label={`Order ${order.invoice}`}
        className="relative flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[88vh] sm:w-full sm:max-w-[520px] sm:rounded-3xl"
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-3.5 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
              {order.invoice}
            </h2>
            <p
              className="truncate text-[11px] text-gray-dark"
              title={order.company}
            >
              {order.company}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1.5 inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray transition-colors hover:bg-gray-light hover:text-foreground"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <Section title="Order">
            <Row label="Invoice" value={order.invoice} />
            <Row label="Date" value={formatDate(order.date)} />
            <Row label="Company" value={order.company} />
            <Row
              label="Service location"
              value={order.serviceLocation || "—"}
            />
            <Row label="Validity" value={order.validity || "—"} />
            <Row
              label="Inspection"
              value={
                order.inspectionIncluded === false ? "Excluded" : "Included"
              }
            />
            <Row label="Wholesaler" value={order.wholesaler || "—"} />
          </Section>

          <Section title="Customer">
            <Row label="Mobile" value={order.contactMobile || "—"} />
            <Row label="Payment method" value={order.paymentMethod} />
            <Row
              label="Payment status"
              value={order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
            />
            <Row
              label="Refund"
              value={
                order.refundStatus === "none"
                  ? "None"
                  : order.refundStatus === "full"
                    ? "Fully refunded"
                    : "Partially refunded"
              }
            />
          </Section>

          <Section title="Money">
            <Row
              label="Customer paid"
              value={formatAEDPrecise(order.myEjariPrice)}
            />
            <Row
              label="Wholesale cost"
              value={formatAEDPrecise(order.wholesalePrice)}
            />
            <Row label="Margin" value={formatAEDPrecise(order.margin)} />
            <Row
              label="Commission"
              value={formatPct(order.commissionPct)}
            />
            <Row
              label={
                order.paymentMethod === "Card"
                  ? "Ziina fee (incl. VAT)"
                  : "Gateway fee"
              }
              value={formatAEDPrecise(order.gatewayFees)}
            />
            <Row
              label="Net revenue"
              value={formatAEDPrecise(net)}
              strong
              danger={net < 0}
            />
            <Row
              label="Final profit"
              value={formatAEDPrecise(order.finalProfit)}
              danger={order.finalProfit < 0}
            />
          </Section>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-border bg-white px-5 py-3.5 sm:px-6">
          <Link
            href={`/admin/invoices/${order.invoice}`}
            target="_blank"
            rel="noopener"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 text-xs font-medium text-foreground/80 transition-colors hover:text-foreground"
          >
            <FileDown size={14} />
            Customer invoice (PDF)
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-xl bg-foreground px-4 text-xs font-semibold text-white transition-colors hover:bg-primary"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray">
        {title}
      </p>
      <dl className="divide-y divide-border/60 rounded-2xl border border-border bg-gray-light/20 px-3.5">
        {children}
      </dl>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  danger,
}: {
  label: string;
  value: string;
  strong?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="text-xs text-foreground/70">{label}</dt>
      <dd
        className={`text-right text-sm tabular-nums ${
          strong ? "font-semibold" : "font-medium"
        } ${danger ? "text-coral" : "text-foreground"}`}
      >
        {value}
      </dd>
    </div>
  );
}
