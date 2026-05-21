import Link from "next/link";
import { ArrowRight, Receipt, TrendingUp, Wallet, Percent } from "lucide-react";
import KpiTile from "@/components/admin/KpiTile";
import DateRangePicker from "@/components/admin/DateRangePicker";
import CreateOrderModal from "@/components/admin/CreateOrderModal";
import ExportAllButton from "@/components/admin/ExportAllButton";
import RenewalsBanner from "@/components/admin/RenewalsBanner";
import PaymentBreakdown from "@/components/admin/PaymentBreakdown";
import WholesalerList from "@/components/admin/WholesalerList";
import BackfillActivitiesButton from "@/components/admin/BackfillActivitiesButton";
import SecureUploadsButton from "@/components/admin/SecureUploadsButton";
import {
  computeMetrics,
  dateRangePresets,
  filterOrdersByRange,
  getIsoWeekRange,
  paidOnly,
  rankedWholesalers,
  renewalsForWeek,
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
  }>;
}

const VALID_RANGES: DateRangeKey[] = [
  "all",
  "this-month",
  "last-month",
  "last-90",
  "this-year",
];

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

export default async function AdminDashboardPage({ searchParams }: Props) {
  const sp = await searchParams;

  const customRange = resolveCustomRange(sp.from, sp.to);
  const presetKey = (sp.range ?? "all") as DateRangeKey;
  const activeRange: DateRangeKey | "custom" = customRange
    ? "custom"
    : VALID_RANGES.includes(presetKey)
      ? presetKey
      : "all";
  const range = customRange ?? resolveRange(presetKey);

  const all = await getAllOrders();
  const byDate = filterOrdersByRange(all, range);

  // KPI tiles always reflect *paid* orders — unpaid is promised, not realised.
  const metrics = computeMetrics(paidOnly(byDate));
  const wholesalers = rankedWholesalers(all);

  // Renewals due this ISO week — computed across ALL orders, not the
  // filtered window, since the user shouldn't have to clear filters to
  // see who to message.
  const week = getIsoWeekRange();
  const renewals = renewalsForWeek(all, week);

  const kpiScope = `Paid · ${rangeLabel(
    activeRange,
    customRange?.from,
    customRange?.to
  )}`;

  return (
    <div className="space-y-5 sm:space-y-7">
      <RenewalsBanner
        renewals={renewals}
        week={week}
        wholesalers={wholesalers}
      />

      <div className="flex items-center justify-between gap-2">
        <DateRangePicker
          active={activeRange}
          basePath="/admin"
          customFrom={customRange?.from}
          customTo={customRange?.to}
        />
        <div className="flex items-center gap-2">
          <ExportAllButton />
          <CreateOrderModal wholesalers={wholesalers} />
        </div>
      </div>

      {/* KPI tiles */}
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

      {/* Quick link to orders view */}
      <Link
        href="/admin/orders"
        className="group flex items-center justify-between rounded-2xl border border-border bg-white px-5 py-3.5 shadow-sm transition-all hover:border-foreground/20 hover:shadow-md"
      >
        <div>
          <p className="text-sm font-semibold text-foreground">
            See all orders
          </p>
          <p className="mt-0.5 text-xs text-gray">
            Searchable table with full per-order detail, filters by status,
            and quick mark-paid actions.
          </p>
        </div>
        <ArrowRight
          size={18}
          className="shrink-0 text-gray transition-transform group-hover:translate-x-1 group-hover:text-primary"
        />
      </Link>

      {/* Insights */}
      {byDate.length > 0 && (
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

      <section className="space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray">
          Maintenance
        </h2>
        <SecureUploadsButton />
        <BackfillActivitiesButton />
      </section>
    </div>
  );
}
