"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Check,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  Receipt,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Order } from "@/lib/admin/orders";
import { netRevenueOf } from "@/lib/admin/orders";
import { markOrderPaid } from "@/app/admin/(workspace)/actions";
import {
  formatAED,
  formatAEDPrecise,
  formatDate,
  formatPct,
} from "@/lib/admin/format";

interface Props {
  order: Order;
  open: boolean;
  onClose: () => void;
}

// In prod an uploaded ref is already an absolute Vercel Blob URL. In dev
// it's a repo-relative path served by /admin/uploads/[...path].
function storagePathToUrl(ref: string): string {
  if (/^https?:\/\//.test(ref)) return ref;
  const cleaned = ref.replace(/\\/g, "/");
  const stripped = cleaned.replace(/^data\/admin-uploads\//, "");
  return `/admin/uploads/${stripped}`;
}

// Full read-only sheet for one order — money breakdown, order info, and
// every attachment, plus a Mark-as-paid action for unpaid orders. Opened
// by clicking a row in the orders table.
export default function OrderDetailsModal({ order, open, onClose }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, pending, onClose]);

  if (!open) return null;

  const isPaid = order.paymentStatus === "paid";
  const net = netRevenueOf(order);
  const isCard = order.paymentMethod === "Card";

  function confirmPaid() {
    setError(null);
    startTransition(async () => {
      const res = await markOrderPaid(order.invoice);
      if (res.ok) {
        onClose();
        router.refresh();
      } else {
        setError(res.error ?? "Failed to mark as paid");
        setConfirming(false);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:p-4">
      <div
        className="fixed inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={() => !pending && onClose()}
      />
      <div
        role="dialog"
        aria-label={`Order ${order.invoice}`}
        className="relative flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-[560px] sm:rounded-3xl"
      >
        {/* Hero header */}
        <header className="relative bg-gradient-to-br from-primary/10 via-primary-light/30 to-white px-5 pb-5 pt-4 sm:px-6">
          <button
            type="button"
            onClick={() => !pending && onClose()}
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray transition-colors hover:bg-white/70 hover:text-foreground"
            aria-label="Close"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-primary shadow-sm ring-1 ring-border">
              <Receipt size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary-dark">
                {order.invoice}
              </p>
              <h2
                className="truncate text-lg font-semibold leading-tight tracking-tight text-foreground"
                title={order.company}
              >
                {order.company}
              </h2>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <StatusPill paid={isPaid} />
            <Chip>{order.paymentMethod}</Chip>
            <Chip>{formatDate(order.date)}</Chip>
            {order.refundStatus !== "none" && (
              <span className="inline-flex items-center rounded-full bg-coral/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-coral ring-1 ring-coral/20">
                {order.refundStatus === "full"
                  ? "Refunded"
                  : "Partial refund"}
              </span>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {/* Money */}
          <div className="rounded-2xl border border-border bg-gray-light/20 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray">
                Customer paid
              </span>
              <span className="text-2xl font-semibold tabular-nums text-foreground">
                {formatAED(order.myEjariPrice)}
              </span>
            </div>
            <dl className="mt-3 space-y-1.5 border-t border-border/60 pt-3">
              <MoneyRow
                label="Wholesale cost"
                value={formatAEDPrecise(order.wholesalePrice)}
              />
              <MoneyRow
                label="Margin"
                value={formatAEDPrecise(order.margin)}
              />
              <MoneyRow
                label="Commission"
                value={formatPct(order.commissionPct)}
              />
              <MoneyRow
                label={isCard ? "Ziina fee (incl. 5% VAT)" : "Gateway fee"}
                value={formatAEDPrecise(order.gatewayFees)}
              />
              <div className="my-1 h-px bg-border" />
              <MoneyRow
                label="Net revenue"
                value={formatAEDPrecise(net)}
                strong
                danger={net < 0}
              />
              <MoneyRow
                label="Final profit"
                value={formatAEDPrecise(order.finalProfit)}
                danger={order.finalProfit < 0}
              />
            </dl>
          </div>

          {/* Order info */}
          <Section title="Order info">
            <InfoRow label="Mobile" value={order.contactMobile || "—"} />
            <InfoRow
              label="Service location"
              value={order.serviceLocation || "—"}
            />
            <InfoRow label="Validity" value={order.validity || "—"} />
            <InfoRow
              label="Inspection"
              value={
                order.inspectionIncluded === false ? "Excluded" : "Included"
              }
            />
            <InfoRow label="Wholesaler" value={order.wholesaler || "—"} />
          </Section>

          {/* Attachments */}
          <p className="mb-1.5 mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray">
            Attachments
          </p>
          <div className="space-y-2">
            <DocRow
              title="Customer invoice"
              subtitle={`Auto-generated · ${order.invoice}.pdf`}
              icon={<FileText size={15} />}
              ready
              href={`/admin/invoices/${order.invoice}`}
            />
            <DocRow
              title="Business-center invoice"
              subtitle={
                order.wholesalerInvoicePath
                  ? "Receipt from the business center"
                  : "Not uploaded yet — use the 📎 on the row to upload"
              }
              icon={<FileText size={15} />}
              ready={!!order.wholesalerInvoicePath}
              href={
                order.wholesalerInvoicePath
                  ? storagePathToUrl(order.wholesalerInvoicePath)
                  : undefined
              }
            />
            <DocRow
              title="Trade license"
              subtitle={
                order.tradeLicensePath
                  ? "Uploaded during order creation"
                  : "Not uploaded"
              }
              icon={<ImageIcon size={15} />}
              ready={!!order.tradeLicensePath}
              href={
                order.tradeLicensePath
                  ? storagePathToUrl(order.tradeLicensePath)
                  : undefined
              }
            />
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-coral/10 px-3 py-2 text-xs font-medium text-coral"
            >
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between gap-2 border-t border-border bg-white px-5 py-3.5 sm:px-6">
          <Link
            href={`/admin/invoices/${order.invoice}`}
            target="_blank"
            rel="noopener"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 text-xs font-medium text-foreground/80 transition-colors hover:text-foreground"
          >
            <Download size={14} />
            Invoice PDF
          </Link>

          {isPaid ? (
            <span className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-success/10 px-4 text-xs font-semibold text-success ring-1 ring-success/20">
              <Check size={14} />
              Paid
            </span>
          ) : confirming ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-foreground/70">
                Permanent — confirm?
              </span>
              <button
                type="button"
                onClick={() => !pending && setConfirming(false)}
                disabled={pending}
                className="inline-flex h-9 items-center rounded-xl px-3 text-xs font-medium text-foreground/70 transition-colors hover:text-foreground disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPaid}
                disabled={pending}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-success px-4 text-xs font-semibold text-white transition-colors hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Check size={13} />
                    Confirm paid
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-foreground px-4 text-xs font-semibold text-white transition-colors hover:bg-primary"
            >
              <Clock size={13} />
              Mark as paid
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function StatusPill({ paid }: { paid: boolean }) {
  return paid ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-success ring-1 ring-success/20">
      <Check size={10} />
      Paid
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber ring-1 ring-amber/30">
      <Clock size={10} />
      Not paid
    </span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-foreground/70 ring-1 ring-border">
      {children}
    </span>
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
    <div className="mt-4">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray">
        {title}
      </p>
      <dl className="divide-y divide-border/60 rounded-2xl border border-border bg-white px-3.5">
        {children}
      </dl>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="text-xs text-foreground/70">{label}</dt>
      <dd className="text-right text-sm font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}

function MoneyRow({
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
    <div className="flex items-baseline justify-between gap-3">
      <dt
        className={`text-xs ${
          strong ? "font-semibold text-foreground" : "text-foreground/70"
        }`}
      >
        {label}
      </dt>
      <dd
        className={`text-right tabular-nums ${
          strong ? "text-base font-semibold" : "text-sm font-medium"
        } ${danger ? "text-coral" : "text-foreground"}`}
      >
        {value}
      </dd>
    </div>
  );
}

function DocRow({
  title,
  subtitle,
  icon,
  ready,
  href,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  ready: boolean;
  href?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-white px-3.5 py-3">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          ready
            ? "bg-success/10 text-success"
            : "bg-gray-light text-gray-dark"
        }`}
      >
        {ready ? <CheckCircle2 size={16} /> : icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="truncate text-[11px] text-gray-dark">{subtitle}</p>
      </div>
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener"
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-border bg-white px-2.5 text-[11px] font-medium text-foreground/80 transition-colors hover:text-foreground"
        >
          <Download size={12} />
          View
        </a>
      )}
    </div>
  );
}
