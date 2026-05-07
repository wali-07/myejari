import { Receipt, TrendingUp, Wallet, Percent } from "lucide-react";
import KpiTile from "@/components/admin/KpiTile";
import DateRangePicker from "@/components/admin/DateRangePicker";
import OrdersFilters from "@/components/admin/OrdersFilters";
import OrdersTable from "@/components/admin/OrdersTable";
import CreateOrderDrawer from "@/components/admin/CreateOrderDrawer";
import {
  computeMetrics,
  filterOrdersByRange,
  paidOnly,
  resolveCustomRange,
  resolveRange,
  type DateRangeKey,
  type PaymentMethod,
} from "@/lib/admin/orders";
import { getAllOrders } from "@/lib/admin/orders-store";
import { formatAED, formatPct } from "@/lib/admin/format";

// /admin reads from the on-disk JSON and writes via server actions, so we
// must opt out of static rendering — the data changes between requests.
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
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

  const activePayment: "all" | PaymentMethod = VALID_PAYMENTS.includes(
    (sp.payment ?? "all") as "all" | PaymentMethod
  )
    ? ((sp.payment ?? "all") as "all" | PaymentMethod)
    : "all";
  const query = (sp.q ?? "").trim();

  // Apply filters in order: date → payment → search.
  const all = await getAllOrders();
  let filtered = filterOrdersByRange(all, range);
  if (activePayment !== "all") {
    filtered = filtered.filter((o) => o.paymentMethod === activePayment);
  }
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

  // Preserve params across each filter so users can compose them.
  const preservedForDate = {
    payment: activePayment !== "all" ? activePayment : undefined,
    q: query || undefined,
  };
  const preservedForPayment = {
    range: customRange
      ? undefined
      : activeRange !== "all"
        ? activeRange
        : undefined,
    from: customRange?.from,
    to: customRange?.to,
    q: query || undefined,
  };

  return (
    <div className="space-y-7">
      {/* Page header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray">
            Workspace
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-[34px]">
            Orders
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker
            active={activeRange}
            basePath="/admin"
            customFrom={customRange?.from}
            customTo={customRange?.to}
            preserveParams={preservedForDate}
          />
          <CreateOrderDrawer />
        </div>
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

      {/* Filters row (payment + search) */}
      <OrdersFilters
        payment={activePayment}
        query={query}
        preserveParams={preservedForPayment}
      />

      {/* Orders table — shows ALL filtered orders (paid + unpaid) */}
      <OrdersTable orders={filtered} />
    </div>
  );
}
