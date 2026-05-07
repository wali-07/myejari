import { Receipt, TrendingUp, Wallet, Percent } from "lucide-react";
import KpiTile from "@/components/admin/KpiTile";
import DateRangePicker from "@/components/admin/DateRangePicker";
import OrdersFilters from "@/components/admin/OrdersFilters";
import OrdersTable from "@/components/admin/OrdersTable";
import CreateOrderModal from "@/components/admin/CreateOrderModal";
import {
  computeMetrics,
  filterOrdersByRange,
  paidOnly,
  rankedWholesalers,
  resolveCustomRange,
  resolveRange,
  type DateRangeKey,
} from "@/lib/admin/orders";
import { getAllOrders } from "@/lib/admin/orders-store";
import { formatAED, formatPct } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
    q?: string;
  }>;
}

const VALID_RANGES: DateRangeKey[] = [
  "all",
  "this-month",
  "last-month",
  "last-90",
  "this-year",
];

export default async function AdminOrdersPage({ searchParams }: Props) {
  const sp = await searchParams;

  // Resolve filters from URL state.
  const customRange = resolveCustomRange(sp.from, sp.to);
  const presetKey = (sp.range ?? "all") as DateRangeKey;
  const activeRange: DateRangeKey | "custom" = customRange
    ? "custom"
    : VALID_RANGES.includes(presetKey)
      ? presetKey
      : "all";
  const range = customRange ?? resolveRange(presetKey);
  const query = (sp.q ?? "").trim();

  // Apply filters in order: date → search.
  const all = await getAllOrders();
  let filtered = filterOrdersByRange(all, range);
  if (query) {
    const needle = query.toLowerCase();
    const queryDigits = query.replace(/\D/g, "");
    filtered = filtered.filter((o) => {
      const mobileDigits = o.contactMobile.replace(/\D/g, "");
      return (
        o.company.toLowerCase().includes(needle) ||
        o.invoice.toLowerCase().includes(needle) ||
        o.wholesaler.toLowerCase().includes(needle) ||
        (queryDigits.length >= 3 && mobileDigits.includes(queryDigits))
      );
    });
  }

  // Summary cards always reflect *paid* orders only — unpaid invoices are
  // promised revenue, not realised revenue.
  const metrics = computeMetrics(paidOnly(filtered));

  // Wholesalers ranked by usage across the whole dataset (not the filtered
  // window) — most-used → least-used. Used by the Create Order modal.
  const wholesalers = rankedWholesalers(all);

  // Preserve search across date filter changes.
  const preservedForDate = { q: query || undefined };

  return (
    <div className="space-y-7">
      {/* Top action row — date filter on the left, Create order on the right */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DateRangePicker
          active={activeRange}
          basePath="/admin"
          customFrom={customRange?.from}
          customTo={customRange?.to}
          preserveParams={preservedForDate}
        />
        <CreateOrderModal wholesalers={wholesalers} />
      </div>

      {/* KPI tiles — title + value only, paid orders only */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile
          label="Total orders"
          value={metrics.count.toLocaleString("en-AE")}
          icon={Receipt}
          tone="primary"
        />
        <KpiTile
          label="GMV"
          value={formatAED(metrics.gmv)}
          icon={TrendingUp}
          tone="success"
        />
        <KpiTile
          label="Net revenue"
          value={formatAED(metrics.netRevenue)}
          icon={Wallet}
          tone="warning"
        />
        <KpiTile
          label="Avg commission"
          value={formatPct(metrics.averageCommissionPct)}
          icon={Percent}
          tone="neutral"
        />
      </div>

      {/* Filters row — search only */}
      <OrdersFilters query={query} />

      {/* Orders table — shows ALL filtered orders (paid + unpaid) */}
      <OrdersTable orders={filtered} />
    </div>
  );
}
