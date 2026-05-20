import DateRangePicker from "@/components/admin/DateRangePicker";
import OrdersFilters from "@/components/admin/OrdersFilters";
import OrdersTable from "@/components/admin/OrdersTable";
import CreateOrderModal from "@/components/admin/CreateOrderModal";
import ExportAllButton from "@/components/admin/ExportAllButton";
import {
  countOrdersByStatus,
  filterOrdersByRange,
  filterOrdersByStatus,
  rankedWholesalers,
  resolveCustomRange,
  resolveRange,
  type DateRangeKey,
  type StatusFilter,
} from "@/lib/admin/orders";
import { getAllOrders } from "@/lib/admin/orders-store";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
    q?: string;
    status?: string;
  }>;
}

const VALID_RANGES: DateRangeKey[] = [
  "all",
  "this-month",
  "last-month",
  "last-90",
  "this-year",
];

const VALID_STATUS: StatusFilter[] = ["all", "paid", "unpaid"];

export default async function AdminOrdersListPage({ searchParams }: Props) {
  const sp = await searchParams;

  const customRange = resolveCustomRange(sp.from, sp.to);
  const presetKey = (sp.range ?? "all") as DateRangeKey;
  const activeRange: DateRangeKey | "custom" = customRange
    ? "custom"
    : VALID_RANGES.includes(presetKey)
      ? presetKey
      : "all";
  const range = customRange ?? resolveRange(presetKey);
  const query = (sp.q ?? "").trim();
  const statusRaw = (sp.status ?? "all") as StatusFilter;
  const status: StatusFilter = VALID_STATUS.includes(statusRaw)
    ? statusRaw
    : "all";

  const all = await getAllOrders();
  const byDate = filterOrdersByRange(all, range);
  let bySearch = byDate;
  if (query) {
    const needle = query.toLowerCase();
    const queryDigits = query.replace(/\D/g, "");
    bySearch = byDate.filter((o) => {
      const mobileDigits = o.contactMobile.replace(/\D/g, "");
      return (
        o.company.toLowerCase().includes(needle) ||
        o.invoice.toLowerCase().includes(needle) ||
        o.wholesaler.toLowerCase().includes(needle) ||
        (queryDigits.length >= 3 && mobileDigits.includes(queryDigits))
      );
    });
  }
  const visible = filterOrdersByStatus(bySearch, status);
  const statusCounts = countOrdersByStatus(bySearch);
  const wholesalers = rankedWholesalers(all);

  const preservedForDate = {
    q: query || undefined,
    status: status === "all" ? undefined : status,
  };
  const preservedForStatus = {
    q: query || undefined,
    range:
      activeRange !== "all" && activeRange !== "custom" ? activeRange : undefined,
    from: customRange?.from,
    to: customRange?.to,
  };

  const hasActiveFilters =
    activeRange !== "all" || Boolean(query) || status !== "all";

  return (
    <div className="space-y-5 sm:space-y-7">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Orders
        </h1>
        <p className="mt-1 text-sm text-gray">
          Every issued Ejari — searchable, filterable, with full per-order
          detail behind each row.
        </p>
      </header>

      <div className="flex items-center justify-between gap-2">
        <DateRangePicker
          active={activeRange}
          basePath="/admin/orders"
          customFrom={customRange?.from}
          customTo={customRange?.to}
          preserveParams={preservedForDate}
        />
        <div className="flex items-center gap-2">
          <ExportAllButton />
          <CreateOrderModal wholesalers={wholesalers} />
        </div>
      </div>

      <OrdersFilters
        query={query}
        status={status}
        counts={statusCounts}
        preserveParams={preservedForStatus}
        basePath="/admin/orders"
      />

      <OrdersTable
        orders={visible}
        wholesalers={wholesalers}
        hasActiveFilters={hasActiveFilters}
        clearFiltersHref="/admin/orders"
      />
    </div>
  );
}
