"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Check,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Receipt,
  ReplaceAll,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { OfficeType, Order, PaymentStatus } from "@/lib/admin/orders";
import {
  calculateGatewayFees,
  netRevenueOf,
  OFFICE_TYPES,
} from "@/lib/admin/orders";
import {
  deleteOrder,
  markOrderPaid,
  updateOrder,
} from "@/app/admin/(workspace)/actions";
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
  /** Known wholesalers, most-used first — powers the edit autocomplete. */
  wholesalers: string[];
}

type PaymentMethodChoice = "Bank Transfer" | "Card";
type ValidityChoice = "1 year" | "1 month";
type OfficeTypeChoice = OfficeType | "";

interface EditForm {
  company: string;
  contactMobile: string;
  serviceLocation: string;
  validity: ValidityChoice;
  inspectionIncluded: boolean;
  paymentMethod: PaymentMethodChoice;
  myEjariPrice: string;
  wholesalePrice: string;
  wholesaler: string;
  paymentStatus: PaymentStatus;
  activity: string;
  activityCode: string;
  officeType: OfficeTypeChoice;
}

// Build the link to an uploaded document. A legacy public Blob URL is
// linked directly (it is already internet-reachable). A private Blob
// pathname or a dev fs path is streamed through the auth-gated
// /admin/uploads/[...path] route, which receives the full ref verbatim.
function storagePathToUrl(ref: string): string {
  if (/^https?:\/\//.test(ref)) return ref;
  return `/admin/uploads/${ref.replace(/\\/g, "/")}`;
}

function formFromOrder(order: Order): EditForm {
  return {
    company: order.company,
    contactMobile: order.contactMobile ?? "",
    serviceLocation: order.serviceLocation ?? "",
    validity: order.validity === "1 month" ? "1 month" : "1 year",
    inspectionIncluded: order.inspectionIncluded !== false,
    paymentMethod: order.paymentMethod === "Card" ? "Card" : "Bank Transfer",
    myEjariPrice: String(order.myEjariPrice ?? ""),
    wholesalePrice: String(order.wholesalePrice ?? ""),
    wholesaler: order.wholesaler ?? "",
    paymentStatus: order.paymentStatus === "paid" ? "paid" : "unpaid",
    activity: order.activity ?? "",
    activityCode: order.activityCode ?? "",
    officeType: order.officeType ?? "",
  };
}

// The single place every order mutation happens. Click a row → this
// popup opens. From here the admin can view the full breakdown, edit any
// field (even on a paid order), upload the business-center invoice,
// mark it paid, or delete it. Nothing on the table row mutates data.
export default function OrderDetailsModal({
  order,
  open,
  onClose,
  wholesalers,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm>(() => formFromOrder(order));
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const busy = pending || uploading;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  const isPaid = order.paymentStatus === "paid";
  const net = netRevenueOf(order);
  const isCard = order.paymentMethod === "Card";

  function update<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  function startEdit() {
    setForm(formFromOrder(order));
    setError(null);
    setConfirming(false);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setError(null);
  }

  function saveEdit() {
    setError(null);
    const myEjariPrice = Number(form.myEjariPrice);
    const wholesalePrice = Number(form.wholesalePrice) || 0;
    if (!form.company.trim()) {
      setError("Company is required");
      return;
    }
    if (!Number.isFinite(myEjariPrice) || myEjariPrice <= 0) {
      setError("Customer amount must be positive");
      return;
    }
    startTransition(async () => {
      const res = await updateOrder(order.invoice, {
        company: form.company,
        contactMobile: form.contactMobile,
        serviceLocation: form.serviceLocation,
        validity: form.validity,
        inspectionIncluded: form.inspectionIncluded,
        paymentMethod: form.paymentMethod,
        myEjariPrice,
        wholesalePrice,
        wholesaler: form.wholesaler,
        paymentStatus: form.paymentStatus,
        activity: form.activity || undefined,
        activityCode: form.activityCode || undefined,
        officeType: form.officeType || undefined,
      });
      if (res.ok) {
        // The server action revalidated and pushed the fresh tree as part
        // of its own response (next/cache refresh), so the table behind is
        // already up to date — just close.
        setEditing(false);
        onClose();
      } else {
        setError(res.error ?? "Failed to save changes");
      }
    });
  }

  function confirmPaid() {
    setError(null);
    startTransition(async () => {
      const res = await markOrderPaid(order.invoice);
      if (res.ok) {
        onClose();
      } else {
        setError(res.error ?? "Failed to mark as paid");
        setConfirming(false);
      }
    });
  }

  function handleDelete() {
    const warning = isPaid
      ? `Delete PAID order ${order.invoice} (${order.company})? This order represents collected revenue. This cannot be undone.`
      : `Delete order ${order.invoice} (${order.company})? This cannot be undone.`;
    if (!window.confirm(warning)) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteOrder(order.invoice);
      if (res.ok) {
        onClose();
      } else {
        setError(res.error ?? "Failed to delete order");
      }
    });
  }

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("invoice", order.invoice);
      fd.append("wholesalerInvoice", file);
      const res = await fetch("/api/admin/upload-wholesaler-invoice", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Upload failed");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = "";
  }

  // Live preview of the money math while editing.
  const previewGmv = Number(form.myEjariPrice) || 0;
  const previewCost = Number(form.wholesalePrice) || 0;
  const previewGateway = calculateGatewayFees(previewGmv, form.paymentMethod);
  const previewNet = previewGmv - previewGateway - previewCost;

  return (
    <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:p-4">
      <div
        className="fixed inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={() => !busy && onClose()}
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
            onClick={() => !busy && onClose()}
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
          {editing ? (
            /* ─── Edit form ─────────────────────────────────────── */
            <div className="space-y-4">
              <Field label="Company" required>
                <input
                  value={form.company}
                  onChange={(e) => update("company", e.target.value)}
                  className={inputCls}
                  placeholder="Company name"
                />
              </Field>

              <Field label="Mobile">
                <input
                  type="tel"
                  value={form.contactMobile}
                  onChange={(e) => update("contactMobile", e.target.value)}
                  placeholder="+971 50 123 4567"
                  className={inputCls}
                />
              </Field>

              <Field label="Service location">
                <input
                  value={form.serviceLocation}
                  onChange={(e) =>
                    update("serviceLocation", e.target.value)
                  }
                  placeholder="Business Bay"
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Validity">
                  <SegmentedToggle
                    value={form.validity}
                    onChange={(v) => update("validity", v)}
                    options={["1 year", "1 month"] as const}
                  />
                </Field>
                <Field label="Inspection">
                  <SegmentedToggle
                    value={
                      form.inspectionIncluded ? "Included" : "Excluded"
                    }
                    onChange={(v) =>
                      update("inspectionIncluded", v === "Included")
                    }
                    options={["Included", "Excluded"] as const}
                  />
                </Field>
              </div>

              <Field label="Wholesaler">
                <input
                  value={form.wholesaler}
                  onChange={(e) => update("wholesaler", e.target.value)}
                  list="oedm-wholesalers"
                  placeholder="Business center"
                  className={inputCls}
                />
                <datalist id="oedm-wholesalers">
                  {wholesalers.map((w) => (
                    <option key={w} value={w} />
                  ))}
                </datalist>
              </Field>

              <Field label="Activity (from TL)">
                <input
                  value={form.activity}
                  onChange={(e) => update("activity", e.target.value)}
                  placeholder="e.g. Management Consultancy"
                  className={inputCls}
                />
              </Field>

              <Field label="Office type sold">
                <select
                  value={form.officeType}
                  onChange={(e) =>
                    update("officeType", e.target.value as OfficeTypeChoice)
                  }
                  className={`${inputCls} appearance-none bg-white pr-8`}
                >
                  <option value="">— Not set —</option>
                  {OFFICE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Customer paid" required>
                  <CurrencyInput
                    value={form.myEjariPrice}
                    onChange={(v) => update("myEjariPrice", v)}
                  />
                </Field>
                <Field label="Wholesale cost">
                  <CurrencyInput
                    value={form.wholesalePrice}
                    onChange={(v) => update("wholesalePrice", v)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Payment method">
                  <SegmentedToggle
                    value={form.paymentMethod}
                    onChange={(v) => update("paymentMethod", v)}
                    options={["Bank Transfer", "Card"] as const}
                  />
                </Field>
                <Field label="Payment status">
                  <SegmentedToggle
                    value={form.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                    onChange={(v) =>
                      update("paymentStatus", v === "Paid" ? "paid" : "unpaid")
                    }
                    options={["Unpaid", "Paid"] as const}
                  />
                </Field>
              </div>

              <div className="rounded-2xl border border-border bg-gradient-to-br from-gray-light/50 via-white to-gray-light/40 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray">
                  Preview
                </p>
                <dl className="mt-2 space-y-1.5 text-sm">
                  <PreviewRow label="GMV" value={formatAED(previewGmv)} />
                  <PreviewRow label="Cost" value={formatAED(previewCost)} />
                  <PreviewRow
                    label={
                      form.paymentMethod === "Card"
                        ? "Ziina fee (2.6% + 1 + 5% VAT)"
                        : "Gateway fee"
                    }
                    value={formatAED(previewGateway)}
                  />
                  <div className="my-1 h-px bg-border" />
                  <PreviewRow
                    label="Net revenue"
                    value={formatAED(previewNet)}
                    bold
                    danger={previewNet < 0}
                  />
                </dl>
              </div>
            </div>
          ) : (
            /* ─── Read-only view ────────────────────────────────── */
            <>
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
                    order.inspectionIncluded === false
                      ? "Excluded"
                      : "Included"
                  }
                />
                <InfoRow label="Wholesaler" value={order.wholesaler || "—"} />
                <InfoRow
                  label="Activity"
                  value={
                    order.activityCode && order.activity
                      ? `${order.activity} (${order.activityCode})`
                      : order.activity || "—"
                  }
                />
                <InfoRow
                  label="Office type sold"
                  value={order.officeType || "—"}
                />
              </Section>

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
                      : "Not uploaded yet"
                  }
                  icon={<FileText size={15} />}
                  ready={!!order.wholesalerInvoicePath}
                  href={
                    order.wholesalerInvoicePath
                      ? storagePathToUrl(order.wholesalerInvoicePath)
                      : undefined
                  }
                  action={
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={busy}
                      className={
                        order.wholesalerInvoicePath
                          ? "inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-border bg-white px-2.5 text-[11px] font-medium text-foreground/80 transition-colors hover:text-foreground disabled:opacity-60"
                          : "inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-foreground px-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-primary disabled:opacity-60"
                      }
                    >
                      {uploading ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          Uploading…
                        </>
                      ) : order.wholesalerInvoicePath ? (
                        <>
                          <ReplaceAll size={12} />
                          Replace
                        </>
                      ) : (
                        <>
                          <Upload size={12} />
                          Upload
                        </>
                      )}
                    </button>
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
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf,image/*,.png,.jpg,.jpeg,.webp,.heic,.heif"
                onChange={onPickFile}
                className="hidden"
              />
            </>
          )}

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
          {editing ? (
            <>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={pending}
                className="inline-flex h-9 items-center rounded-xl px-3 text-xs font-medium text-foreground/70 transition-colors hover:text-foreground disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={pending}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-foreground px-4 text-xs font-semibold text-white transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Check size={13} />
                    Save changes
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/admin/invoices/${order.invoice}`}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-white px-3 text-xs font-medium text-foreground/80 transition-colors hover:text-foreground"
                >
                  <Download size={14} />
                  PDF
                </Link>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={busy}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-white px-3 text-xs font-medium text-coral transition-colors hover:bg-coral/10 disabled:opacity-60"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={startEdit}
                  disabled={busy}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 text-xs font-semibold text-foreground/80 transition-colors hover:text-foreground disabled:opacity-60"
                >
                  <Pencil size={14} />
                  Edit
                </button>

                {isPaid ? (
                  <span className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-success/10 px-4 text-xs font-semibold text-success ring-1 ring-success/20">
                    <Check size={14} />
                    Paid
                  </span>
                ) : confirming ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-foreground/70">
                      Confirm?
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
                    disabled={busy}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-foreground px-4 text-xs font-semibold text-white transition-colors hover:bg-primary disabled:opacity-60"
                  >
                    <Clock size={13} />
                    Mark as paid
                  </button>
                )}
              </div>
            </>
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
  action,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  ready: boolean;
  href?: string;
  action?: React.ReactNode;
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
      <div className="flex shrink-0 items-center gap-1.5">
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
        {action}
      </div>
    </div>
  );
}

// ─── Edit-form primitives ─────────────────────────────────────────────

const inputCls =
  "h-9 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground placeholder:text-gray focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-foreground/80">
        {label}
        {required && <span className="ml-0.5 text-coral">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function SegmentedToggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly T[];
}) {
  return (
    <div className="inline-flex w-full items-center rounded-xl border border-border bg-white p-0.5 text-xs font-medium">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={
            opt === value
              ? "flex-1 rounded-lg bg-foreground px-3 py-1.5 text-white"
              : "flex-1 rounded-lg px-3 py-1.5 text-foreground/70 transition-colors hover:text-foreground"
          }
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function CurrencyInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray">
        AED
      </span>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} pl-12 pr-3 text-right tabular-nums`}
        placeholder="0"
      />
    </div>
  );
}

function PreviewRow({
  label,
  value,
  bold,
  danger,
}: {
  label: string;
  value: string;
  bold?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <dt
        className={`text-xs ${bold ? "font-semibold" : ""} text-foreground/70`}
      >
        {label}
      </dt>
      <dd
        className={`tabular-nums ${
          bold ? "text-base font-semibold" : "text-xs"
        } ${danger ? "text-coral" : "text-foreground"}`}
      >
        {value}
      </dd>
    </div>
  );
}
