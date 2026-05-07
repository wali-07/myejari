import {
  ShoppingBag,
  TrendingUp,
  Wallet,
  Percent,
} from "lucide-react";
import KpiTile from "@/components/admin/KpiTile";
import DateFilter from "@/components/admin/DateFilter";
import PaymentBreakdown from "@/components/admin/PaymentBreakdown";
import WholesalerList from "@/components/admin/WholesalerList";
import OrdersTable from "@/components/admin/OrdersTable";
import {
  computeMetrics,
  filterOrdersByRange,
  getAllOrders,
  resolveRange,
  type DateRangeKey,
} from "@/lib/admin/orders";
import { formatAED, formatDate, formatPct } from "@/lib/admin/format";

interface Props {
  searchParams: Promise<{ range?: string }>;
}

const VALID_RANGES: DateRangeKey[] = [
  "all",
  "this-month",
  "last-month",
  "last-90",
  "this-year",
];

export default async function AdminDashboardPage({ searchParams }: Props) {
  const sp = await searchParams;
  const rangeParam = (sp.range ?? "all") as DateRangeKey;
  const activeRange: DateRangeKey = VALID_RANGES.includes(rangeParam)
    ? rangeParam
    : "all";

  const allOrders = getAllOrders();
  const range = resolveRange(activeRange);
  const filtered = filterOrdersByRange(allOrders, range);
  const metrics = computeMetrics(filtered);

  const rangeText = range
    ? `${formatDate(range.from)} – ${formatDate(range.to)}`
    : `${formatDate(allOrders[0]?.date ?? "")} – ${formatDate(
        allOrders[allOrders.length - 1]?.date ?? ""
      )}`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-dark">
            Live snapshot of orders, GMV, and margin from the CRM.
          </p>
        </div>
        <DateFilter active={activeRange} rangeText={rangeText} />
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label="Total orders"
          value={metrics.count.toLocaleString("en-AE")}
          sub={
            metrics.refundCount > 0
              ? `${metrics.refundCount} refunded`
              : "No refunds"
          }
          icon={ShoppingBag}
          tone="primary"
        />
        <KpiTile
          label="GMV (customer paid)"
          value={formatAED(metrics.gmv)}
          sub={`Cost: ${formatAED(metrics.totalCost)}`}
          icon={TrendingUp}
          tone="success"
        />
        <KpiTile
          label="Net revenue"
          value={formatAED(metrics.netRevenue)}
          sub={`Gateway fees: ${formatAED(metrics.totalGatewayFees)}`}
          icon={Wallet}
          tone="warning"
        />
        <KpiTile
          label="Avg commission"
          value={formatPct(metrics.averageCommissionPct)}
          sub={`Margin: ${formatAED(metrics.totalMargin)}`}
          icon={Percent}
          tone="neutral"
        />
      </div>

      {/* Two-column row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PaymentBreakdown
          breakdown={metrics.paymentBreakdown}
          totalCount={metrics.count}
        />
        <WholesalerList wholesalers={metrics.topWholesalers} />
      </div>

      {/* Orders table */}
      <OrdersTable orders={filtered} />
    </div>
  );
}
