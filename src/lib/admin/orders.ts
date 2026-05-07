// Pure types + computations — safe to import in client components.
// File-system reads/writes live in `./orders-store` (server-only).

export type PaymentMethod = "Bank Transfer" | "Card" | "Other";
export type RefundStatus = "none" | "full" | "partial";
export type PaymentStatus = "paid" | "unpaid";

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
  /** Customer payment state. New orders start unpaid; toggled via Mark Paid. */
  paymentStatus: PaymentStatus;
  /** Service location used on the invoice (e.g. "Business Bay"). */
  serviceLocation?: string;
  /** Tenancy validity used on the invoice. */
  validity?: "1 year" | "1 month";
  /** Whether the package includes inspection. Default true. */
  inspectionIncluded?: boolean;
  /** Repo-relative path to the uploaded Trade License PDF (if any). */
  tradeLicensePath?: string;
  /** Repo-relative path to the wholesaler-issued invoice/receipt for this order. */
  wholesalerInvoicePath?: string;
}

/** Wholesaler usage rollup — used to populate the dropdown in Create Order. */
export function rankedWholesalers(orders: Order[]): string[] {
  const counts = new Map<string, number>();
  for (const o of orders) {
    const name = o.wholesaler.trim();
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
}

/** Compute the next invoice number based on the highest existing INVxxxx. */
export function nextInvoiceNumber(orders: Order[]): string {
  const max = orders.reduce((m, o) => {
    const match = o.invoice.match(/^INV(\d+)$/i);
    if (!match) return m;
    const n = Number(match[1]);
    return n > m ? n : m;
  }, 0);
  const next = max + 1;
  return `INV${String(next).padStart(4, "0")}`;
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

/** Sort orders chronologically (oldest first). Pure helper. */
export function sortOrdersByDate(orders: Order[]): Order[] {
  return orders.slice().sort((a, b) => a.date.localeCompare(b.date));
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

/**
 * Card-payment gateway fees: 2.6% of the customer-paid amount plus AED 1.
 * Bank transfers and other methods carry no gateway fee.
 *
 * Used when creating new card orders so the admin doesn't need to look the
 * percentage up. Historical CRM data is preserved as-is — this only applies
 * to new entries created from the admin tool.
 */
export const CARD_GATEWAY_RATE = 0.026;
export const CARD_GATEWAY_FIXED = 1;

export function calculateGatewayFees(
  customerAmount: number,
  paymentMethod: PaymentMethod
): number {
  if (paymentMethod !== "Card") return 0;
  if (!Number.isFinite(customerAmount) || customerAmount <= 0) return 0;
  return Number(
    (customerAmount * CARD_GATEWAY_RATE + CARD_GATEWAY_FIXED).toFixed(2)
  );
}

/**
 * Per-order Net Revenue = GMV − payment gateway fee − cost.
 *
 * Bank Transfer orders carry zero gateway fee, so this collapses to
 * (GMV − cost) for them. Refund flags are surfaced separately via the
 * refund badge — this number is the accounting view, not the realised one.
 */
export function netRevenueOf(order: Order): number {
  return order.myEjariPrice - order.gatewayFees - order.wholesalePrice;
}

/**
 * Validate + normalise a custom (`from`, `to`) date pair for the date filter.
 * Returns `null` for malformed input so the page can fall back to a preset.
 */
export function resolveCustomRange(
  from: string | undefined,
  to: string | undefined
): { from: string; to: string } | null {
  if (!from || !to) return null;
  const ok = /^\d{4}-\d{2}-\d{2}$/;
  if (!ok.test(from) || !ok.test(to)) return null;
  if (from > to) return { from: to, to: from };
  return { from, to };
}

/** Monthly trend buckets — used by the dashboard chart. */
export interface MonthlyBucket {
  /** `YYYY-MM`. */
  month: string;
  /** Customer-paid total for the month. */
  gmv: number;
  /** Final-profit total for the month. */
  profit: number;
  orders: number;
}

export function groupOrdersByMonth(orders: Order[]): MonthlyBucket[] {
  const groups = new Map<string, MonthlyBucket>();
  for (const o of orders) {
    const month = o.date.slice(0, 7);
    const cur = groups.get(month) ?? { month, gmv: 0, profit: 0, orders: 0 };
    cur.gmv += o.myEjariPrice;
    cur.profit += o.finalProfit;
    cur.orders += 1;
    groups.set(month, cur);
  }
  return Array.from(groups.values()).sort((a, b) =>
    a.month.localeCompare(b.month)
  );
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

/** Filter to paid orders only. KPIs only ever reflect collected revenue. */
export function paidOnly(orders: Order[]): Order[] {
  return orders.filter((o) => o.paymentStatus === "paid");
}

/** Compute KPIs + breakdowns from a filtered order set. */
export function computeMetrics(orders: Order[]): OrderMetrics {
  const count = orders.length;
  const gmv = orders.reduce((s, o) => s + o.myEjariPrice, 0);
  const totalCost = orders.reduce((s, o) => s + o.wholesalePrice, 0);
  const totalMargin = orders.reduce((s, o) => s + o.margin, 0);
  const totalGatewayFees = orders.reduce((s, o) => s + o.gatewayFees, 0);
  // Aggregate Net Revenue uses the same formula as per-row netRevenueOf:
  // GMV − gateway fees − cost. This matches the column total in the table.
  const netRevenue = orders.reduce((s, o) => s + netRevenueOf(o), 0);
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
