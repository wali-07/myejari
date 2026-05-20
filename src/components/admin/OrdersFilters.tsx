import Link from "next/link";
import SearchInput from "@/components/admin/SearchInput";
import type { StatusFilter } from "@/lib/admin/orders";

interface Props {
  query: string;
  status: StatusFilter;
  counts: { all: number; paid: number; unpaid: number };
  /** Other URL params to preserve when switching status. */
  preserveParams?: Record<string, string | undefined>;
  basePath?: string;
}

const STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "unpaid", label: "Unpaid" },
];

// Segmented status control on the left, search on the right. Status
// affects the orders list/table only — KPI tiles always reflect paid
// orders so revenue numbers stay truthful regardless of filter.
export default function OrdersFilters({
  query,
  status,
  counts,
  preserveParams,
  basePath = "/admin",
}: Props) {
  function buildStatusHref(key: StatusFilter): string {
    const params = new URLSearchParams();
    if (key !== "all") params.set("status", key);
    if (preserveParams) {
      for (const [k, v] of Object.entries(preserveParams)) {
        if (v) params.set(k, v);
      }
    }
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <nav
        aria-label="Filter by status"
        className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 sm:overflow-visible"
      >
        {STATUS_OPTIONS.map((opt) => {
          const active = status === opt.key;
          const count = counts[opt.key];
          return (
            <Link
              key={opt.key}
              href={buildStatusHref(opt.key)}
              scroll={false}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
                  : "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-gray-dark transition-colors hover:border-foreground/20 hover:text-foreground"
              }
            >
              <span>{opt.label}</span>
              <span
                className={
                  active
                    ? "rounded-full bg-white/15 px-1.5 text-[10px] font-semibold tabular-nums"
                    : "rounded-full bg-gray-light px-1.5 text-[10px] font-semibold tabular-nums text-gray-dark"
                }
              >
                {count}
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="w-full sm:w-72">
        <SearchInput defaultValue={query} fullWidth />
      </div>
    </div>
  );
}
