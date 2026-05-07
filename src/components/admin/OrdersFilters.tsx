import Link from "next/link";
import type { PaymentMethod } from "@/lib/admin/orders";
import SearchInput from "@/components/admin/SearchInput";

interface Props {
  payment: "all" | PaymentMethod;
  query: string;
  /** URL params to preserve when toggling the payment filter. */
  preserveParams?: Record<string, string | undefined>;
}

const PAYMENT_OPTIONS: { key: "all" | PaymentMethod; label: string }[] = [
  { key: "all", label: "All methods" },
  { key: "Bank Transfer", label: "Bank Transfer" },
  { key: "Card", label: "Card" },
];

export default function OrdersFilters({
  payment,
  query,
  preserveParams,
}: Props) {
  function buildHref(paymentKey: "all" | PaymentMethod) {
    const params = new URLSearchParams();
    if (paymentKey !== "all") params.set("payment", paymentKey);
    if (preserveParams) {
      for (const [k, v] of Object.entries(preserveParams)) {
        if (v) params.set(k, v);
      }
    }
    const qs = params.toString();
    return qs ? `/admin?${qs}` : "/admin";
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Payment-method segmented control */}
      <div className="inline-flex items-center rounded-full border border-border bg-white p-0.5 text-xs font-medium">
        {PAYMENT_OPTIONS.map((opt) => {
          const isActive = opt.key === payment;
          return (
            <Link
              key={opt.key}
              href={buildHref(opt.key)}
              scroll={false}
              className={
                isActive
                  ? "rounded-full bg-foreground px-3 py-1.5 text-white"
                  : "rounded-full px-3 py-1.5 text-foreground/70 transition-colors hover:text-foreground"
              }
            >
              {opt.label}
            </Link>
          );
        })}
      </div>

      <SearchInput defaultValue={query} />
    </div>
  );
}
