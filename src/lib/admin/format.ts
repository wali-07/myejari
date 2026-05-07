// Single source of truth for AED money + date display in the admin app.
// Use these everywhere so totals and per-row values render identically.

const AED = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const AED_PRECISE = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** AED with no decimals — for KPIs and table totals. */
export function formatAED(amount: number): string {
  return AED.format(amount);
}

/** AED with 2 decimals — for invoice line items + per-row precision. */
export function formatAEDPrecise(amount: number): string {
  return AED_PRECISE.format(amount);
}

/** Percentage string from a decimal fraction (0.143 → "14.3%"). */
export function formatPct(fraction: number, digits = 1): string {
  return `${(fraction * 100).toFixed(digits)}%`;
}

/** Display an ISO `YYYY-MM-DD` date as "5 May 2026". */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return DATE.format(new Date(y, (m ?? 1) - 1, d ?? 1));
}
