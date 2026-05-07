"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteOrder } from "@/app/admin/(workspace)/actions";

interface Props {
  invoice: string;
}

// Trash button for unpaid rows. Confirms via window.confirm (admin-only
// surface, low friction is fine), then fires the delete server action.
// Paid invoices never render this button; the action also enforces
// server-side that paid orders can't be deleted.
export default function DeleteOrderButton({ invoice }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (
      !window.confirm(
        `Delete unpaid order ${invoice}? This cannot be undone — but the invoice number won't be reissued, so the next order will continue the sequence.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await deleteOrder(invoice);
      if (res.ok) {
        router.refresh();
      } else {
        window.alert(res.error ?? "Failed to delete order");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      title={`Delete ${invoice}`}
      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-dark transition-colors hover:bg-coral/10 hover:text-coral disabled:opacity-50"
    >
      {pending ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Trash2 size={14} />
      )}
    </button>
  );
}
