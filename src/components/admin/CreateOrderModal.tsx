"use client";

import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  Plus,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createOrder } from "@/app/admin/(workspace)/actions";
import {
  calculateGatewayFees,
  OFFICE_TYPES,
  type OfficeType,
} from "@/lib/admin/orders";
import { formatAED } from "@/lib/admin/format";
import WholesalerSelect from "@/components/admin/WholesalerSelect";

type PaymentMethodChoice = "Bank Transfer" | "Card";
type ValidityChoice = "1 year" | "1 month";
type OfficeTypeChoice = OfficeType | "";

interface FormState {
  contactMobile: string;
  serviceLocation: string;
  validity: ValidityChoice;
  inspectionIncluded: boolean;
  paymentMethod: PaymentMethodChoice;
  myEjariPrice: string;
  wholesalePrice: string;
  wholesaler: string;
  /** Business activity from the TL (Vision-extracted, editable). */
  activity: string;
  /** Activity code from the TL, if Vision found one. */
  activityCode: string;
  /** Office type we sold this customer ("" = not yet selected). */
  officeType: OfficeTypeChoice;
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
  activity: "",
  activityCode: "",
  officeType: "",
};

interface UploadedTL {
  fileName: string;
  storedPath: string;
  companyName: string;
  highConfidence: boolean;
  activity?: string;
  activityCode?: string;
}

interface Props {
  wholesalers: string[];
}

export default function CreateOrderModal({ wholesalers }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<UploadedTL | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [editingCompany, setEditingCompany] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      // Auto-fill activity + activity code from Vision extraction if
      // they came through — the admin can edit either before submit.
      if (data.activity) update("activity", data.activity);
      if (data.activityCode) update("activityCode", data.activityCode);
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

  const myEjariPrice = Number(form.myEjariPrice) || 0;
  const wholesalePrice = Number(form.wholesalePrice) || 0;
  const previewGateway = calculateGatewayFees(myEjariPrice, form.paymentMethod);
  const previewNet = myEjariPrice - previewGateway - wholesalePrice;
  const canSubmit = !!companyName.trim() && myEjariPrice > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!companyName.trim()) {
      setError("Upload a Trade License or enter the company name");
      return;
    }
    setSubmitting(true);
    try {
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
        activity: form.activity || undefined,
        activityCode: form.activityCode || undefined,
        officeType: form.officeType || undefined,
      });
      if (res.ok) {
        // createOrder revalidated /admin and pushed the fresh tree back as
        // part of its own response (next/cache refresh, computed on the
        // same instance that just wrote — so the new row is guaranteed to
        // be in it). Just close; the table is already current. No second
        // client round-trip that could land on a stale instance.
        reset();
        setOpen(false);
        return;
      }
      setError(res.error);
    } catch {
      // Server action threw (network/edge error) — don't leave the
      // button stuck on "Creating…" with no feedback.
      setError("Couldn't save the order — please try again in a moment.");
    } finally {
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
        <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => !submitting && setOpen(false)}
          />

          {/* Modal — full-screen on mobile, centered card on desktop */}
          <div
            role="dialog"
            aria-label="Create order"
            className="relative flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[88vh] sm:w-full sm:max-w-[520px] sm:rounded-3xl"
          >
            {/* Header */}
            <header className="flex items-center justify-between border-b border-border px-5 py-3.5 sm:px-6 sm:py-4">
              <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                New order
              </h2>
              <button
                type="button"
                onClick={() => !submitting && setOpen(false)}
                className="-mr-1.5 inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray transition-colors hover:bg-gray-light hover:text-foreground"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </header>

            {/* Body — single scrollable column */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-1 min-h-0 flex-col"
            >
              <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                {/* Trade License — primary action at the top */}
                {!uploaded ? (
                  <div
                    onDrop={onDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-gray-light/30 px-4 py-8 text-center transition-all hover:border-primary/50 hover:bg-primary-light/30"
                  >
                    {uploading ? (
                      <>
                        <Loader2
                          size={20}
                          className="animate-spin text-primary"
                        />
                        <p className="text-sm font-medium text-foreground">
                          Reading the license…
                        </p>
                      </>
                    ) : (
                      <>
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-primary shadow-sm ring-1 ring-border transition-transform group-hover:scale-105">
                          <Upload size={18} />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            Upload Trade License
                          </p>
                          <p className="mt-0.5 text-[11px] text-gray">
                            PDF or image · auto-extracts on PDF
                          </p>
                        </div>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf,.pdf,image/*,.png,.jpg,.jpeg,.webp,.heic,.heif"
                      onChange={onPick}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border bg-white p-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                        <FileText size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate text-sm font-medium text-foreground"
                          title={uploaded.fileName}
                        >
                          {uploaded.fileName}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-gray">
                          {uploaded.highConfidence ? (
                            <>
                              <CheckCircle2
                                size={11}
                                className="text-success"
                              />
                              Verified extraction
                            </>
                          ) : (
                            <>
                              <Sparkles size={11} className="text-primary" />
                              Best-guess match
                            </>
                          )}
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

                    <div className="mt-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray">
                          Company
                        </label>
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
                          onBlur={() =>
                            companyName.trim() && setEditingCompany(false)
                          }
                          placeholder="Enter the company name"
                          autoFocus
                          className="mt-1 h-9 w-full rounded-lg border border-border bg-white px-3 text-sm font-medium text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15"
                        />
                      ) : (
                        <p className="mt-1 break-words text-sm font-semibold leading-snug text-foreground">
                          {companyName}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Form fields — compact, label-on-top */}
                <div className="mt-5 space-y-4">
                  <Field label="Mobile">
                    <input
                      type="tel"
                      value={form.contactMobile}
                      onChange={(e) =>
                        update("contactMobile", e.target.value)
                      }
                      placeholder="+971 50 123 4567"
                      className={inputCls}
                    />
                  </Field>

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
                    <WholesalerSelect
                      value={form.wholesaler}
                      onChange={(v) => update("wholesaler", v)}
                      options={wholesalers}
                    />
                  </Field>

                  <Field
                    label={
                      form.activity
                        ? "Activity (from TL)"
                        : "Activity"
                    }
                  >
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
                      <option value="">— Select —</option>
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
                        required
                      />
                    </Field>
                    <Field label="Wholesale cost">
                      <CurrencyInput
                        value={form.wholesalePrice}
                        onChange={(v) => update("wholesalePrice", v)}
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

                {/* Live preview — vertical card, in the form body */}
                <div className="mt-5 rounded-2xl border border-border bg-gradient-to-br from-gray-light/50 via-white to-gray-light/40 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray">
                    Preview
                  </p>
                  <dl className="mt-2 space-y-1.5 text-sm">
                    <SummaryRow label="GMV" value={formatAED(myEjariPrice)} />
                    <SummaryRow label="Cost" value={formatAED(wholesalePrice)} />
                    <SummaryRow
                      label={
                        form.paymentMethod === "Card"
                          ? "Ziina fee (2.6% + 1 + 5% VAT)"
                          : "Gateway fee"
                      }
                      value={formatAED(previewGateway)}
                    />
                    <div className="my-1 h-px bg-border" />
                    <SummaryRow
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
                    className="mt-4 rounded-xl bg-coral/10 px-3 py-2 text-xs font-medium text-coral"
                  >
                    {error}
                  </p>
                )}
              </div>

              {/* Footer — sticky action bar */}
              <footer className="flex items-center justify-end gap-2 border-t border-border bg-white px-5 py-3.5 sm:px-6">
                <button
                  type="button"
                  onClick={() => !submitting && setOpen(false)}
                  className="inline-flex h-10 items-center rounded-xl px-4 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground sm:h-9 sm:text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !canSubmit}
                  className="group inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-foreground px-4 text-sm font-semibold text-white transition-all hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60 sm:h-9 sm:flex-initial sm:text-xs"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      Create order
                      <ArrowRight
                        size={14}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </>
                  )}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Form primitives ────────────────────────────────────────────────────

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

function SummaryRow({
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
