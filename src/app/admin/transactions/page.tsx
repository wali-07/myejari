import DateFilter from "@/components/admin/DateFilter";
import TransactionsFilters from "@/components/admin/TransactionsFilters";
import OrdersTable from "@/components/admin/OrdersTable";
import KpiTile from "@/components/admin/KpiTile";
import {
  computeMetrics,
  filterOrdersByRange,
  getAllOrders,
  resolveRange,
  type DateRangeKey,
  type PaymentMethod,
} from "@/lib/admin/orders";
import { formatAED, formatDate, formatPct } from "@/lib/admin/format";
import { Receipt, TrendingUp, Wallet, Percent } from "lucide-react";

interface Props {
  searchParams: Promise<{
    range?: string;
    payment?: string;
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
const VALID_PAYMENTS: ("all" | PaymentMethod)[] = [
  "all",
  "Bank Transfer",
  "Card",
];

export default async function TransactionsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const activeRange: DateRangeKey = VALID_RANGES.includes(
    (sp.range ?? "all") as DateRangeKey
  )
    ? ((sp.range ?? "all") as DateRangeKey)
    : "all";
  const activePayment: "all" | PaymentMethod = VALID_PAYMENTS.includes(
    (sp.payment ?? "all") as "all" | PaymentMethod
  )
    ? ((sp.payment ?? "all") as "all" | PaymentMethod)
    : "all";
  const query = (sp.q ?? "").trim();

  const all = getAllOrders();
  const range = resolveRange(activeRange);
  let filtered = filterOrdersByRange(all, range);

  if (activePayment !== "all") {
    filtered = filtered.filter((o) => o.paymentMethod === activePayment);
  }
  if (query) {
    const needle = query.toLowerCase();
    filtered = filtered.filter(
      (o) =>
        o.company.toLowerCase().includes(needle) ||
        o.invoice.toLowerCase().includes(needle) ||
        o.wholesaler.toLowerCase().includes(needle)
    );
  }

  const metrics = computeMetrics(filtered);

  const rangeText = range
    ? `${formatDate(range.from)} – ${formatDate(range.to)}`
    : `${formatDate(all[0]?.date ?? "")} – ${formatDate(
        all[all.length - 1]?.date ?? ""
      )}`;

  // Preserve params across each filter so users can compose them.
  const preservedForDate = {
    payment: activePayment !== "all" ? activePayment : undefined,
    q: query || undefined,
  };
  const preservedForPayment = {
    range: activeRange !== "all" ? activeRange : undefined,
    q: query || undefined,
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray">
            Detail
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-[34px]">
            Transactions
          </h1>
          <p className="mt-1 text-sm text-gray-dark">{rangeText}</p>
        </div>
        <DateFilter
          active={activeRange}
          basePath="/admin/transactions"
          preserveParams={preservedForDate}
        />
      </div>

      {/* KPI tiles for the filtered set */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile
          label="Filtered orders"
          value={metrics.count.toLocaleString("en-AE")}
          sub={
            metrics.refundCount > 0
              ? `${metrics.refundCount} refunded`
              : "No refunds"
          }
          icon={Receipt}
          tone="primary"
        />
        <KpiTile
          label="GMV"
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

      {/* Filters row */}
      <TransactionsFilters
        payment={activePayment}
        query={query}
        preserveParams={preservedForPayment}
      />

      {/* Full table */}
      <OrdersTable orders={filtered} />
    </div>
  );
}
