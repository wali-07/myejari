import { Receipt, TrendingUp, Wallet, Percent } from "lucide-react";
import KpiTile from "@/components/admin/KpiTile";
import DateRangePicker from "@/components/admin/DateRangePicker";
import OrdersFilters from "@/components/admin/OrdersFilters";
import OrdersTable from "@/components/admin/OrdersTable";
import CreateOrderModal from "@/components/admin/CreateOrderModal";
import ExportAllButton from "@/components/admin/ExportAllButton";
import RenewalsBanner from "@/components/admin/RenewalsBanner";
import PaymentBreakdown from "@/components/admin/PaymentBreakdown";
import WholesalerList from "@/components/admin/WholesalerList";
import BackfillActivitiesButton from "@/components/admin/BackfillActivitiesButton";
import {
  computeMetrics,
  countOrdersByStatus,
  dateRangePresets,
  filterOrdersByRange,
  filterOrdersByStatus,
  getIsoWeekRange,
  paidOnly,
  rankedWholesalers,
  renewalsForWeek,
  resolveCustomRange,
  resolveRange,
  type DateRangeKey,
  type StatusFilter,
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

function rangeLabel(
  active: DateRangeKey | "custom",
  customFrom?: string,
  customTo?: string
): string {
  if (active === "custom") {
    return customFrom && customTo ? "Custom range" : "All time";
  }
  return dateRangePresets().find((p) => p.key === active)?.label ?? "All time";
}

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
  const statusRaw = (sp.status ?? "all") as StatusFilter;
  const status: StatusFilter = VALID_STATUS.includes(statusRaw)
    ? statusRaw
    : "all";

  // Apply filters in order: date → search → status.
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

  // Summary cards always reflect *paid* orders within the date+search
  // window — unpaid invoices are promised revenue, not realised revenue.
  // The status filter only affects the table, never the KPIs.
  const metrics = computeMetrics(paidOnly(bySearch));

  // Wholesalers ranked by usage across the whole dataset — used to power
  // the CreateOrder + OrderDetails edit autocompletes.
  const wholesalers = rankedWholesalers(all);

  // Renewals due this ISO week (Mon–Sun) — computed across ALL orders, not
  // the filtered window, since the user shouldn't have to clear filters to
  // see who to message.
  const week = getIsoWeekRange();
  const renewals = renewalsForWeek(all, week);

  const kpiScope = `Paid · ${rangeLabel(
    activeRange,
    customRange?.from,
    customRange?.to
  )}`;

  // Preserve cross-cutting params when switching filters.
  const preservedForDate = {
    q: query || undefined,
    status: status === "all" ? undefined : status,
  };
  const preservedForStatus = {
    q: query || undefined,
    range: activeRange !== "all" && activeRange !== "custom" ? activeRange : undefined,
    from: customRange?.from,
    to: customRange?.to,
  };

  const hasActiveFilters =
    activeRange !== "all" || Boolean(query) || status !== "all";

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* Renewals due this week — silent when empty */}
      <RenewalsBanner
        renewals={renewals}
        week={week}
        wholesalers={wholesalers}
      />

      {/* Top action row — date filter on the left, Export + Create on the right */}
      <div className="flex items-center justify-between gap-2">
        <DateRangePicker
          active={activeRange}
          basePath="/admin"
          customFrom={customRange?.from}
          customTo={customRange?.to}
          preserveParams={preservedForDate}
        />
        <div className="flex items-center gap-2">
          <ExportAllButton />
          <CreateOrderModal wholesalers={wholesalers} />
        </div>
      </div>

      {/* KPI tiles — scoped to paid orders inside the current date+search window */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiTile
          label="Total orders"
          value={metrics.count.toLocaleString("en-AE")}
          sub={kpiScope}
          icon={Receipt}
          tone="primary"
        />
        <KpiTile
          label="GMV"
          value={formatAED(metrics.gmv)}
          sub={kpiScope}
          icon={TrendingUp}
          tone="success"
        />
        <KpiTile
          label="Net revenue"
          value={formatAED(metrics.netRevenue)}
          sub={kpiScope}
          icon={Wallet}
          tone="warning"
        />
        <KpiTile
          label="Avg margin"
          value={formatPct(metrics.averageCommissionPct)}
          sub={kpiScope}
          icon={Percent}
          tone="neutral"
        />
      </div>

      {/* Status segmented control + search */}
      <OrdersFilters
        query={query}
        status={status}
        counts={statusCounts}
        preserveParams={preservedForStatus}
      />

      {/* Orders — table on desktop, card list on mobile */}
      <OrdersTable
        orders={visible}
        wholesalers={wholesalers}
        hasActiveFilters={hasActiveFilters}
        clearFiltersHref="/admin"
      />

      {/* Insights — payment-mix and top wholesalers from the current window */}
      {bySearch.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray">
            Insights · {rangeLabel(activeRange, customRange?.from, customRange?.to)}
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <PaymentBreakdown
              breakdown={metrics.paymentBreakdown}
              totalCount={metrics.count}
            />
            <WholesalerList wholesalers={metrics.topWholesalers} />
          </div>
        </section>
      )}

      {/* Maintenance / one-time tools */}
      <section className="space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray">
          Maintenance
        </h2>
        <BackfillActivitiesButton />
      </section>
    </div>
  );
}
