"use client";

import { Check, Clock } from "lucide-react";
import { useState, useTransition } from "react";
import { setPaymentStatus } from "@/app/admin/(workspace)/actions";
import type { PaymentStatus } from "@/lib/admin/orders";

interface Props {
  invoice: string;
  status: PaymentStatus;
}

// Inline pill that toggles paid/unpaid. Fires the server action and
// re-renders the page via the action's `revalidatePath`. Optimistic local
// state keeps the UI snappy; on error we revert and surface a tooltip.
export default function PaymentStatusToggle({ invoice, status }: Props) {
  const [optimistic, setOptimistic] = useState<PaymentStatus>(status);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    const next: PaymentStatus = optimistic === "paid" ? "unpaid" : "paid";
    setOptimistic(next);
    startTransition(async () => {
      const res = await setPaymentStatus(invoice, next);
      if (!res.ok) {
        setOptimistic(optimistic);
        setError(res.error ?? "Failed to update");
      }
    });
  }

  const isPaid = optimistic === "paid";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      title={
        error ??
        (isPaid ? "Click to mark as unpaid" : "Click to mark as paid")
      }
      className={
        isPaid
          ? "inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-success ring-1 ring-success/20 transition-opacity hover:opacity-80 disabled:opacity-50"
          : "inline-flex items-center gap-1 rounded-full bg-amber/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber ring-1 ring-amber/30 transition-opacity hover:opacity-80 disabled:opacity-50"
      }
    >
      {isPaid ? <Check size={10} /> : <Clock size={10} />}
      {isPaid ? "Paid" : "Not paid"}
    </button>
  );
}
