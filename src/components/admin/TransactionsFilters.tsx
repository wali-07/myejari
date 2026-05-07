import Link from "next/link";
import type { PaymentMethod } from "@/lib/admin/orders";

interface Props {
  payment: "all" | PaymentMethod;
  query: string;
  /** Other URL params to preserve when toggling the payment filter. */
  preserveParams?: Record<string, string | undefined>;
}

const PAYMENT_OPTIONS: { key: "all" | PaymentMethod; label: string }[] = [
  { key: "all", label: "All methods" },
  { key: "Bank Transfer", label: "Bank Transfer" },
  { key: "Card", label: "Card" },
];

// URL-driven filters — the company-name search is a plain GET form so
// pressing Enter re-navigates with `?q=...`. No client state required.
export default function TransactionsFilters({
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
    return qs ? `/admin/transactions?${qs}` : "/admin/transactions";
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-1.5">
        {PAYMENT_OPTIONS.map((opt) => {
          const isActive = opt.key === payment;
          return (
            <Link
              key={opt.key}
              href={buildHref(opt.key)}
              scroll={false}
              className={
                isActive
                  ? "rounded-full bg-foreground px-3.5 py-1.5 text-xs font-semibold text-white"
                  : "rounded-full border border-border bg-white px-3.5 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-primary/30 hover:text-foreground"
              }
            >
              {opt.label}
            </Link>
          );
        })}
      </div>

      {/* Search — plain HTML form, GET to /admin/transactions */}
      <form
        action="/admin/transactions"
        method="get"
        className="flex items-center gap-2"
      >
        {/* Preserve current filters when re-submitting search */}
        {preserveParams &&
          Object.entries(preserveParams).map(([k, v]) =>
            v ? <input key={k} type="hidden" name={k} value={v} /> : null
          )}
        {payment !== "all" && (
          <input type="hidden" name="payment" value={payment} />
        )}
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search company…"
          className="h-9 w-full min-w-[180px] rounded-full border border-border bg-white px-4 text-xs text-foreground placeholder:text-gray focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15 sm:w-[260px]"
        />
      </form>
    </div>
  );
}
