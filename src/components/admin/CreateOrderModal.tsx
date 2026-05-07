"use client";

import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  Loader2,
  Plus,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/app/admin/(workspace)/actions";
import { calculateGatewayFees } from "@/lib/admin/orders";
import { formatAED } from "@/lib/admin/format";
import WholesalerSelect from "@/components/admin/WholesalerSelect";

type PaymentMethodChoice = "Bank Transfer" | "Card";
type ValidityChoice = "1 year" | "1 month";

interface FormState {
  contactMobile: string;
  serviceLocation: string;
  validity: ValidityChoice;
  inspectionIncluded: boolean;
  paymentMethod: PaymentMethodChoice;
  myEjariPrice: string;
  wholesalePrice: string;
  wholesaler: string;
}

const DEFAULTS: FormState = {
  contactMobile: "",
  serviceLocation: "",
  validity: "1 year",
  inspectionIncluded: true,
  paymentMethod: "Bank Transfer",
  myEjariPrice: "",
  wholesalePrice: "",
  wholesaler: "",
};

interface UploadedTL {
  fileName: string;
  storedPath: string;
  companyName: string;
  highConfidence: boolean;
}

interface Props {
  /** Wholesalers ranked from most-used to least-used. */
  wholesalers: string[];
}

export default function CreateOrderModal({ wholesalers }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<UploadedTL | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [editingCompany, setEditingCompany] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [, startTransition] = useTransition();

  // ── Modal lifecycle ─────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, submitting]);

  function reset() {
    setForm(DEFAULTS);
    setError(null);
    setUploaded(null);
    setCompanyName("");
    setEditingCompany(false);
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  // ── TL upload ───────────────────────────────────────────
  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("tradeLicense", file);
      const res = await fetch("/api/admin/upload-tl", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Upload failed");
      }
      const data = (await res.json()) as UploadedTL;
      setUploaded(data);
      setCompanyName(data.companyName);
      setEditingCompany(!data.companyName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  // ── Live preview ───────────────────────────────────────
  const myEjariPrice = Number(form.myEjariPrice) || 0;
  const wholesalePrice = Number(form.wholesalePrice) || 0;
  const previewGateway = calculateGatewayFees(myEjariPrice, form.paymentMethod);
  const previewNet = myEjariPrice - previewGateway - wholesalePrice;

  // ── Submit ─────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!companyName.trim()) {
      setError("Upload a Trade License or enter the company name");
      return;
    }
    setSubmitting(true);
    const res = await createOrder({
      company: companyName.trim(),
      contactMobile: form.contactMobile,
      serviceLocation: form.serviceLocation,
      validity: form.validity,
      inspectionIncluded: form.inspectionIncluded,
      paymentMethod: form.paymentMethod,
      myEjariPrice,
      wholesalePrice,
      wholesaler: form.wholesaler,
      tradeLicensePath: uploaded?.storedPath,
    });
    if (res.ok) {
      reset();
      setOpen(false);
      startTransition(() => router.refresh());
    } else {
      setError(res.error);
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-foreground px-3.5 pr-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary"
      >
        <Plus size={14} strokeWidth={2.4} />
        Create order
      </button>

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => !submitting && setOpen(false)}
          />

          {/* Centered modal */}
          <div className="relative flex min-h-screen items-start justify-center px-4 py-10 sm:items-center">
            <div
              role="dialog"
              aria-label="Create order"
              className="relative w-full max-w-[560px] overflow-hidden rounded-3xl border border-border bg-white shadow-2xl"
            >
              {/* Header */}
              <header className="flex items-start justify-between border-b border-border bg-gradient-to-br from-primary-light/60 via-white to-amber/5 px-6 py-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                    New order
                  </p>
                  <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-foreground">
                    Create order &amp; invoice
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => !submitting && setOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray transition-colors hover:bg-white hover:text-foreground"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </header>

              <form
                onSubmit={handleSubmit}
                className="max-h-[70vh] space-y-6 overflow-y-auto p-6"
              >
                {/* ── Trade License upload ── */}
                <div>
                  <SectionLabel>Trade license</SectionLabel>
                  {!uploaded ? (
                    <div
                      onDrop={onDrop}
                      onDragOver={(e) => e.preventDefault()}
                      className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-gray-light/30 px-4 py-8 text-center transition-colors hover:border-primary/40 hover:bg-primary-light/20"
                    >
                      {uploading ? (
                        <>
                          <Loader2
                            size={22}
                            className="animate-spin text-primary"
                          />
                          <p className="text-sm font-medium text-foreground">
                            Reading the trade license…
                          </p>
                          <p className="text-[11px] text-gray">
                            Extracting the company name
                          </p>
                        </>
                      ) : (
                        <>
                          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-light text-primary">
                            <Upload size={18} />
                          </span>
                          <p className="text-sm font-medium text-foreground">
                            Drop the Trade License PDF here
                          </p>
                          <p className="text-[11px] text-gray">
                            or click to browse · max 10 MB
                          </p>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3 text-[11px] font-semibold text-white transition-colors hover:bg-primary"
                          >
                            Choose file
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={onPick}
                            className="hidden"
                          />
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border bg-white p-4">
                      {/* File row */}
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
                          <FileText size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p
                            className="truncate text-sm font-medium text-foreground"
                            title={uploaded.fileName}
                          >
                            {uploaded.fileName}
                          </p>
                          <p className="text-[11px] text-gray">
                            Trade license attached
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setUploaded(null);
                            setCompanyName("");
                            setEditingCompany(false);
                          }}
                          className="rounded-lg p-1.5 text-gray transition-colors hover:bg-gray-light hover:text-foreground"
                          title="Remove"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      {/* Detected company name */}
                      <div className="mt-3 rounded-xl bg-gray-light/50 p-3">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray">
                            {uploaded.highConfidence ? (
                              <CheckCircle2
                                size={11}
                                className="text-success"
                              />
                            ) : (
                              <Sparkles size={11} className="text-primary" />
                            )}
                            Detected company
                          </span>
                          {!editingCompany && companyName && (
                            <button
                              type="button"
                              onClick={() => setEditingCompany(true)}
                              className="text-[11px] font-medium text-primary hover:underline"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                        {editingCompany || !companyName ? (
                          <input
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            onBlur={() => companyName && setEditingCompany(false)}
                            placeholder="Enter the company name"
                            autoFocus
                            className="mt-1.5 h-9 w-full rounded-lg border border-border bg-white px-3 text-sm font-medium text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15"
                          />
                        ) : (
                          <p className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-foreground">
                            <Building2 size={14} className="text-gray-dark" />
                            <span>{companyName}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Customer ── */}
                <div className="space-y-3">
                  <SectionLabel>Customer</SectionLabel>
                  <Field label="Mobile">
                    <input
                      type="tel"
                      value={form.contactMobile}
                      onChange={(e) =>
                        update("contactMobile", e.target.value)
                      }
                      placeholder="971501234567"
                      className={inputCls}
                    />
                  </Field>
                </div>

                {/* ── Service ── */}
                <div className="space-y-3">
                  <SectionLabel>Service</SectionLabel>
                  <Field label="Location">
                    <input
                      value={form.serviceLocation}
                      onChange={(e) =>
                        update("serviceLocation", e.target.value)
                      }
                      placeholder="Business Bay"
                      className={inputCls}
                    />
                  </Field>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Validity">
                      <SegmentedToggle
                        value={form.validity}
                        onChange={(v) => update("validity", v)}
                        options={["1 year", "1 month"] as const}
                      />
                    </Field>
                    <Field label="Inspection">
                      <SegmentedToggle
                        value={form.inspectionIncluded ? "Included" : "Excluded"}
                        onChange={(v) =>
                          update("inspectionIncluded", v === "Included")
                        }
                        options={["Included", "Excluded"] as const}
                      />
                    </Field>
                  </div>
                </div>

                {/* ── Money ── */}
                <div className="space-y-3">
                  <SectionLabel>Money</SectionLabel>
                  <Field label="Wholesaler (business center)">
                    <WholesalerSelect
                      value={form.wholesaler}
                      onChange={(v) => update("wholesaler", v)}
                      options={wholesalers}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Wholesale (cost)">
                      <CurrencyInput
                        value={form.wholesalePrice}
                        onChange={(v) => update("wholesalePrice", v)}
                      />
                    </Field>
                    <Field label="Customer paid (GMV)" required>
                      <CurrencyInput
                        value={form.myEjariPrice}
                        onChange={(v) => update("myEjariPrice", v)}
                        required
                      />
                    </Field>
                  </div>
                  <Field label="Payment method">
                    <SegmentedToggle
                      value={form.paymentMethod}
                      onChange={(v) => update("paymentMethod", v)}
                      options={["Bank Transfer", "Card"] as const}
                    />
                  </Field>
                </div>

                {/* ── Live preview ── */}
                <div className="rounded-2xl border border-border bg-gradient-to-br from-gray-light/50 via-white to-gray-light/40 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray">
                    Preview
                  </p>
                  <dl className="mt-2 space-y-1.5 text-sm">
                    <Row label="GMV" value={formatAED(myEjariPrice)} />
                    <Row label="Cost" value={formatAED(wholesalePrice)} />
                    <Row
                      label={
                        form.paymentMethod === "Card"
                          ? "Gateway fee (2.6% + 1)"
                          : "Gateway fee"
                      }
                      value={formatAED(previewGateway)}
                    />
                    <div className="my-1 h-px bg-border" />
                    <Row
                      label="Net revenue"
                      value={formatAED(previewNet)}
                      bold
                      danger={previewNet < 0}
                    />
                  </dl>
                </div>

                {error && (
                  <p
                    role="alert"
                    className="rounded-xl bg-coral/10 px-3 py-2 text-xs font-medium text-coral"
                  >
                    {error}
                  </p>
                )}
              </form>

              {/* Footer */}
              <footer className="flex items-center justify-end gap-2 border-t border-border bg-gray-light/30 px-6 py-4">
                <button
                  type="button"
                  onClick={() => !submitting && setOpen(false)}
                  className="inline-flex h-9 items-center rounded-xl px-4 text-xs font-semibold text-foreground/70 transition-colors hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={
                    submitting || !companyName.trim() || !form.myEjariPrice
                  }
                  className="group inline-flex h-9 items-center gap-1.5 rounded-xl bg-foreground px-4 text-xs font-semibold text-white transition-all hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      Create order
                      <ArrowRight
                        size={12}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </>
                  )}
                </button>
              </footer>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Form primitives ────────────────────────────────────────────────────

const inputCls =
  "h-9 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground placeholder:text-gray focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray">
      {children}
    </p>
  );
}

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
    <label className="block text-xs font-medium text-foreground/80">
      <span>
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
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
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
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} pl-12 pr-3 text-right tabular-nums`}
        placeholder="0"
      />
    </div>
  );
}

function Row({
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
