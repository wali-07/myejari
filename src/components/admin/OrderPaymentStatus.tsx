"use client";

import { Check, Clock, Loader2, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markOrderPaid } from "@/app/admin/(workspace)/actions";
import { formatAED } from "@/lib/admin/format";
import type { Order } from "@/lib/admin/orders";

interface Props {
  order: Pick<
    Order,
    "invoice" | "company" | "myEjariPrice" | "paymentStatus" | "paymentMethod"
  >;
}

// Paid is a one-way transition. Paid orders show a static green pill.
// Unpaid orders show a clickable amber pill that opens a confirmation
// dialog. The dialog summarises the order before committing — paid is
// permanent in the data model.
export default function OrderPaymentStatus({ order }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Lock body scroll while the dialog is open.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, pending]);

  if (order.paymentStatus === "paid") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-success ring-1 ring-success/20"
        title="Payment recorded — paid status is locked"
      >
        <Check size={10} />
        Paid
      </span>
    );
  }

  function confirm() {
    setError(null);
    startTransition(async () => {
      const res = await markOrderPaid(order.invoice);
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(res.error ?? "Failed to mark as paid");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Mark as paid"
        className="inline-flex items-center gap-1 rounded-full bg-amber/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber ring-1 ring-amber/30 transition-opacity hover:opacity-80"
      >
        <Clock size={10} />
        Not paid
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => !pending && setOpen(false)}
          />
          <div
            role="dialog"
            aria-label="Mark order as paid"
            className="relative w-full max-w-[420px] overflow-hidden rounded-3xl border border-border bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between border-b border-border px-6 py-4">
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Mark as paid
              </h2>
              <button
                type="button"
                onClick={() => !pending && setOpen(false)}
                className="-mr-1.5 inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray transition-colors hover:bg-gray-light hover:text-foreground"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </header>

            <div className="px-6 py-5">
              <p className="text-sm leading-relaxed text-foreground/80">
                Confirm that{" "}
                <span className="font-semibold text-foreground">
                  {order.invoice}
                </span>{" "}
                has been settled by the customer.
              </p>

              <dl className="mt-4 space-y-2 rounded-2xl bg-gray-light/50 p-4 text-sm">
                <Row label="Company" value={order.company} truncate />
                <Row label="Amount" value={formatAED(order.myEjariPrice)} />
                <Row label="Method" value={order.paymentMethod} />
              </dl>

              {error && (
                <p
                  role="alert"
                  className="mt-3 rounded-xl bg-coral/10 px-3 py-2 text-xs font-medium text-coral"
                >
                  {error}
                </p>
              )}
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-border bg-gray-light/30 px-6 py-3.5">
              <button
                type="button"
                onClick={() => !pending && setOpen(false)}
                disabled={pending}
                className="inline-flex h-9 items-center rounded-xl px-4 text-xs font-medium text-foreground/70 transition-colors hover:text-foreground disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={pending}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-success px-4 text-xs font-semibold text-white transition-colors hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Check size={13} />
                    Mark as paid
                  </>
                )}
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}

function Row({
  label,
  value,
  truncate,
}: {
  label: string;
  value: string;
  truncate?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray">
        {label}
      </dt>
      <dd
        className={`text-xs font-medium text-foreground tabular-nums ${
          truncate ? "min-w-0 truncate text-right" : ""
        }`}
        title={truncate ? value : undefined}
      >
        {value}
      </dd>
    </div>
  );
}
