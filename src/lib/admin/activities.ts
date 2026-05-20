// Pure aggregation: turns the Order[] array into a deduplicated list of
// business activities with usage statistics. Safe to import in client
// components — no fs / network here.
//
// Activities are stored as comma-separated strings on each Order
// (`order.activity`, `order.activityCode`). This file splits and
// normalises them into a per-activity view.

import type { OfficeType, Order } from "@/lib/admin/orders";

/** Split a comma-separated field into trimmed, non-empty parts. */
function splitCsv(s: string | undefined | null): string[] {
  if (!s) return [];
  return s
    .split(",")
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

/**
 * Normalise an activity name for deduplication / matching. Trims, collapses
 * whitespace, and lowercases. Original-case display name is kept separately
 * — this is purely the key used to group identical activities.
 */
export function normaliseActivityName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export interface ActivityNote {
  /** Normalised activity name (used as the key). */
  key: string;
  /** Plain-text admin operational notes (what office types work, gotchas, etc.). */
  notes: string;
  /** ISO timestamp of the last edit. */
  updatedAt: string;
}

export interface AggregatedActivity {
  /** Normalised lowercase name — stable key for matching / storage. */
  key: string;
  /** Display name — original case from the first order that mentioned it. */
  name: string;
  /** Distinct activity codes seen for this activity, in first-seen order. */
  codes: string[];
  /** Total orders that listed this activity. */
  orderCount: number;
  /** Invoice numbers of orders with this activity, newest first. */
  orderInvoices: string[];
  /** Office types placed for orders with this activity, with counts. */
  officeTypeCounts: Partial<Record<OfficeType, number>>;
  /** How many orders with this activity had no office type recorded. */
  officeTypeUnknown: number;
  /** Most common office type ("primary fit"), or undefined if none recorded. */
  primaryOfficeType?: OfficeType;
  /** ISO date — first time we placed an order with this activity. */
  firstSeen: string;
  /** ISO date — most recent time we placed an order with this activity. */
  lastSeen: string;
  /** Admin's operational notes, if any. */
  notes?: string;
}

/**
 * Aggregate the full order list into a deduplicated activity view. Each
 * order can contribute to multiple activities (comma-separated activity
 * field). Activity codes are aligned by position with activity names —
 * the first code corresponds to the first activity, etc.
 *
 * Sort: orderCount descending, then name ascending (alphabetical within
 * same count). The most-placed activities surface first.
 */
export function aggregateActivities(
  orders: Order[],
  notes: ActivityNote[] = []
): AggregatedActivity[] {
  const notesByKey = new Map(notes.map((n) => [n.key, n.notes]));
  const map = new Map<string, AggregatedActivity>();

  // Sort orders newest first so orderInvoices comes out in that order
  // and `firstSeen` / `lastSeen` are populated correctly.
  const sortedOrders = [...orders].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  for (const order of sortedOrders) {
    const names = splitCsv(order.activity);
    const codes = splitCsv(order.activityCode);
    if (names.length === 0) continue;

    for (let i = 0; i < names.length; i++) {
      const display = names[i];
      const key = normaliseActivityName(display);
      if (!key) continue;
      // Code at the same index, if present and not the placeholder.
      const code = codes[i] && codes[i] !== "—" ? codes[i] : undefined;

      let agg = map.get(key);
      if (!agg) {
        agg = {
          key,
          name: display,
          codes: [],
          orderCount: 0,
          orderInvoices: [],
          officeTypeCounts: {},
          officeTypeUnknown: 0,
          firstSeen: order.date,
          lastSeen: order.date,
          notes: notesByKey.get(key),
        };
        map.set(key, agg);
      }

      agg.orderCount += 1;
      agg.orderInvoices.push(order.invoice);
      if (code && !agg.codes.includes(code)) agg.codes.push(code);
      if (order.officeType) {
        agg.officeTypeCounts[order.officeType] =
          (agg.officeTypeCounts[order.officeType] ?? 0) + 1;
      } else {
        agg.officeTypeUnknown += 1;
      }
      // sortedOrders is newest-first, so the FIRST visit sets lastSeen,
      // and each subsequent visit only updates firstSeen (going back in time).
      if (order.date < agg.firstSeen) agg.firstSeen = order.date;
      if (order.date > agg.lastSeen) agg.lastSeen = order.date;
    }
  }

  // Compute primary office type per activity.
  for (const agg of map.values()) {
    let bestType: OfficeType | undefined;
    let bestCount = 0;
    for (const [type, count] of Object.entries(agg.officeTypeCounts)) {
      if (count && count > bestCount) {
        bestCount = count;
        bestType = type as OfficeType;
      }
    }
    agg.primaryOfficeType = bestType;
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.orderCount !== a.orderCount) return b.orderCount - a.orderCount;
    return a.name.localeCompare(b.name);
  });
}

/** Case-insensitive substring filter across the activity name and codes. */
export function filterActivities(
  activities: AggregatedActivity[],
  query: string
): AggregatedActivity[] {
  const q = query.trim().toLowerCase();
  if (!q) return activities;
  return activities.filter((a) => {
    if (a.name.toLowerCase().includes(q)) return true;
    if (a.codes.some((c) => c.toLowerCase().includes(q))) return true;
    if (a.notes?.toLowerCase().includes(q)) return true;
    return false;
  });
}
