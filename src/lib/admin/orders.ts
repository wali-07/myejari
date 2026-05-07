import ordersData from "@/data/orders.json";

export type PaymentMethod = "Bank Transfer" | "Card" | "Other";
export type RefundStatus = "none" | "full" | "partial";

export interface Order {
  invoice: string;
  /** ISO date `YYYY-MM-DD`. */
  date: string;
  company: string;
  contactMobile: string;
  /** Normalised: Bank Transfer, Card (Ziina + true cards merged), or Other. */
  paymentMethod: PaymentMethod;
  /** Original string from the CRM, preserved for audit. */
  paymentMethodRaw: string;
  /** The licensed business center we sourced the Ejari from. */
  wholesaler: string;
  /** What we paid the business center (cost). */
  wholesalePrice: number;
  /** What the customer paid us (revenue). */
  myEjariPrice: number;
  /** myEjariPrice − wholesalePrice. */
  margin: number;
  /** Decimal fraction, e.g. 0.143 means 14.3%. */
  commissionPct: number;
  /** Card-processor fees we ate. */
  gatewayFees: number;
  /** Margin − gatewayFees (− full refund cost where applicable). */
  finalProfit: number;
  refundStatus: RefundStatus;
}

export type DateRangeKey =
  | "all"
  | "this-month"
  | "last-month"
  | "last-90"
  | "this-year";

const ALL_DATE_RANGES: { key: DateRangeKey; label: string }[] = [
  { key: "all", label: "All time" },
  { key: "this-year", label: "This year" },
  { key: "last-90", label: "Last 90 days" },
  { key: "last-month", label: "Last month" },
  { key: "this-month", label: "This month" },
];

export function dateRangePresets() {
  return ALL_DATE_RANGES;
}

/** All orders in chronological order (oldest first). */
export function getAllOrders(): Order[] {
  return (ordersData as Order[]).slice().sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

/** Resolve a preset key into a [from, to] inclusive ISO date pair, or null for "all". */
export function resolveRange(
  key: DateRangeKey | string | undefined,
  // Pass `today` so callers (and tests) can pin behaviour. Defaults to now.
  today: Date = new Date()
): { from: string; to: string } | null {
  const k = (key ?? "all") as DateRangeKey;
  const yyyy = today.getFullYear();
  const mm = today.getMonth(); // 0-indexed
  const dd = today.getDate();
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  switch (k) {
    case "this-month": {
      const from = new Date(yyyy, mm, 1);
      const to = new Date(yyyy, mm, dd);
      return { from: fmt(from), to: fmt(to) };
    }
    case "last-month": {
      const from = new Date(yyyy, mm - 1, 1);
      const to = new Date(yyyy, mm, 0); // last day of previous month
      return { from: fmt(from), to: fmt(to) };
    }
    case "last-90": {
      const from = new Date(today);
      from.setDate(today.getDate() - 90);
      return { from: fmt(from), to: fmt(today) };
    }
    case "this-year": {
      const from = new Date(yyyy, 0, 1);
      return { from: fmt(from), to: fmt(today) };
    }
    case "all":
    default:
      return null;
  }
}

export function filterOrdersByRange(
  orders: Order[],
  range: { from: string; to: string } | null
): Order[] {
  if (!range) return orders;
  return orders.filter((o) => o.date >= range.from && o.date <= range.to);
}

export interface OrderMetrics {
  count: number;
  gmv: number;
  totalCost: number;
  totalMargin: number;
  totalGatewayFees: number;
  netRevenue: number;
  averageCommissionPct: number;
  refundCount: number;
  paymentBreakdown: Record<PaymentMethod, { count: number; gmv: number }>;
  topWholesalers: { name: string; count: number; gmv: number; margin: number }[];
}

/** Compute KPIs + breakdowns from a filtered order set. */
export function computeMetrics(orders: Order[]): OrderMetrics {
  const count = orders.length;
  const gmv = orders.reduce((s, o) => s + o.myEjariPrice, 0);
  const totalCost = orders.reduce((s, o) => s + o.wholesalePrice, 0);
  const totalMargin = orders.reduce((s, o) => s + o.margin, 0);
  const totalGatewayFees = orders.reduce((s, o) => s + o.gatewayFees, 0);
  const netRevenue = orders.reduce((s, o) => s + o.finalProfit, 0);
  const averageCommissionPct =
    count === 0
      ? 0
      : orders.reduce((s, o) => s + o.commissionPct, 0) / count;
  const refundCount = orders.filter((o) => o.refundStatus !== "none").length;

  const paymentBreakdown: OrderMetrics["paymentBreakdown"] = {
    "Bank Transfer": { count: 0, gmv: 0 },
    Card: { count: 0, gmv: 0 },
    Other: { count: 0, gmv: 0 },
  };
  for (const o of orders) {
    paymentBreakdown[o.paymentMethod].count += 1;
    paymentBreakdown[o.paymentMethod].gmv += o.myEjariPrice;
  }

  const wholesalerAgg = new Map<
    string,
    { count: number; gmv: number; margin: number }
  >();
  for (const o of orders) {
    const key = o.wholesaler.trim() || "(unknown)";
    const cur = wholesalerAgg.get(key) ?? { count: 0, gmv: 0, margin: 0 };
    cur.count += 1;
    cur.gmv += o.myEjariPrice;
    cur.margin += o.margin;
    wholesalerAgg.set(key, cur);
  }
  const topWholesalers = Array.from(wholesalerAgg.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    count,
    gmv,
    totalCost,
    totalMargin,
    totalGatewayFees,
    netRevenue,
    averageCommissionPct,
    refundCount,
    paymentBreakdown,
    topWholesalers,
  };
}
