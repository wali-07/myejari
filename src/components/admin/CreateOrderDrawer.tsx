"use client";

import { ArrowRight, Loader2, Plus, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/app/admin/(workspace)/actions";
import { calculateGatewayFees } from "@/lib/admin/orders";
import { formatAED } from "@/lib/admin/format";

type PaymentMethodChoice = "Bank Transfer" | "Card";
type ValidityChoice = "1 year" | "1 month";

interface FormState {
  company: string;
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
  company: "",
  contactMobile: "",
  serviceLocation: "",
  validity: "1 year",
  inspectionIncluded: true,
  paymentMethod: "Bank Transfer",
  myEjariPrice: "",
  wholesalePrice: "",
  wholesaler: "",
};

export default function CreateOrderDrawer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function reset() {
    setForm(DEFAULTS);
    setError(null);
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  // Live preview of gateway fees + net revenue while filling the form.
  const myEjariPrice = Number(form.myEjariPrice) || 0;
  const wholesalePrice = Number(form.wholesalePrice) || 0;
  const previewGateway = calculateGatewayFees(myEjariPrice, form.paymentMethod);
  const previewNet = myEjariPrice - previewGateway - wholesalePrice;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await createOrder({
      company: form.company,
      contactMobile: form.contactMobile,
      serviceLocation: form.serviceLocation,
      validity: form.validity,
      inspectionIncluded: form.inspectionIncluded,
      paymentMethod: form.paymentMethod,
      myEjariPrice,
      wholesalePrice,
      wholesaler: form.wholesaler,
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
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm"
            onClick={() => !submitting && setOpen(false)}
          />

          {/* Drawer */}
          <aside
            role="dialog"
            aria-label="Create order"
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray">
                  New order
                </p>
                <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-foreground">
                  Create order & invoice
                </h2>
              </div>
              <button
                type="button"
                onClick={() => !submitting && setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray transition-colors hover:bg-gray-light hover:text-foreground"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </header>

            <form
              onSubmit={handleSubmit}
              className="flex-1 space-y-5 overflow-y-auto p-6"
            >
              {/* Customer */}
              <Section title="Customer">
                <Field label="Company name" required>
                  <input
                    required
                    value={form.company}
                    onChange={(e) => update("company", e.target.value)}
                    placeholder="ERTH LIVING DESIGN L.L.C"
                    className={inputCls}
                  />
                </Field>
                <Field label="Mobile">
                  <input
                    type="tel"
                    value={form.contactMobile}
                    onChange={(e) => update("contactMobile", e.target.value)}
                    placeholder="971501234567"
                    className={inputCls}
                  />
                </Field>
              </Section>

              {/* Service */}
              <Section title="Service">
                <Field label="Location">
                  <input
                    value={form.serviceLocation}
                    onChange={(e) => update("serviceLocation", e.target.value)}
                    placeholder="Business Bay"
                    className={inputCls}
                  />
                </Field>
                <Field label="Validity">
                  <div className="inline-flex w-full items-center rounded-xl border border-border bg-white p-0.5 text-xs font-medium">
                    {(["1 year", "1 month"] as ValidityChoice[]).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => update("validity", v)}
                        className={
                          form.validity === v
                            ? "flex-1 rounded-lg bg-foreground px-3 py-1.5 text-white"
                            : "flex-1 rounded-lg px-3 py-1.5 text-foreground/70 transition-colors hover:text-foreground"
                        }
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </Field>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={form.inspectionIncluded}
                    onChange={(e) =>
                      update("inspectionIncluded", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                  />
                  Inspection included
                </label>
              </Section>

              {/* Money */}
              <Section title="Money">
                <Field label="Wholesaler (business center)">
                  <input
                    value={form.wholesaler}
                    onChange={(e) => update("wholesaler", e.target.value)}
                    placeholder="Blackswan Center"
                    className={inputCls}
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
                  <div className="inline-flex w-full items-center rounded-xl border border-border bg-white p-0.5 text-xs font-medium">
                    {(
                      ["Bank Transfer", "Card"] as PaymentMethodChoice[]
                    ).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => update("paymentMethod", m)}
                        className={
                          form.paymentMethod === m
                            ? "flex-1 rounded-lg bg-foreground px-3 py-1.5 text-white"
                            : "flex-1 rounded-lg px-3 py-1.5 text-foreground/70 transition-colors hover:text-foreground"
                        }
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </Field>
              </Section>

              {/* Live preview */}
              <div className="rounded-2xl border border-border bg-gray-light/30 p-4">
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

            <footer className="flex items-center justify-between border-t border-border px-6 py-4">
              <p className="text-[11px] text-gray-dark">
                Status defaults to <span className="font-semibold">Not paid</span>.
                Mark paid from the table.
              </p>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={submitting || !form.company || !form.myEjariPrice}
                className="group inline-flex h-9 items-center gap-1.5 rounded-xl bg-foreground px-4 text-xs font-semibold text-white transition-all hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Saving…
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
          </aside>
        </>
      )}
    </>
  );
}

// ─── Field primitives ───────────────────────────────────────────────────

const inputCls =
  "h-9 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground placeholder:text-gray focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray">
        {title}
      </p>
      <div className="space-y-3">{children}</div>
    </div>
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
      <dt className={`text-xs ${bold ? "font-semibold" : ""} text-foreground/70`}>
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
