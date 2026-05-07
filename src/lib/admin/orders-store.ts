import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { sortOrdersByDate, type Order } from "@/lib/admin/orders";
import { nextInvoiceNumber } from "@/lib/admin/orders";

// File-system-backed orders store. Lives separately from `./orders` so the
// `node:fs` import never bleeds into the client bundle through transitive
// type imports. Anything in this file is server-only.
//
// Production note: Vercel's serverless filesystem is ephemeral, so writes
// here won't survive a redeploy. Before going to production, swap this
// module for a real database adapter (Vercel Postgres, Supabase, etc.).

const ORDERS_PATH = path.join(process.cwd(), "src", "data", "orders.json");

/** Read fresh orders from disk on every call — supports live writes. */
export async function readOrders(): Promise<Order[]> {
  const raw = await fs.readFile(ORDERS_PATH, "utf8");
  return JSON.parse(raw) as Order[];
}

/** Persist the orders array atomically (write to .tmp then rename). */
export async function writeOrders(orders: Order[]): Promise<void> {
  const tmp = ORDERS_PATH + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(orders, null, 2), "utf8");
  await fs.rename(tmp, ORDERS_PATH);
}

/** All orders sorted oldest → newest. Page-level data entry point. */
export async function getAllOrders(): Promise<Order[]> {
  return sortOrdersByDate(await readOrders());
}

// ─── Invoice counter ────────────────────────────────────────────────────
//
// Stored separately so deleting an order does NOT free up its invoice
// number. Numbers are issued strictly monotonically — once assigned they
// stay reserved even if the underlying order is later removed. On first
// run (no counter file yet) the counter initialises to (max(invoice) + 1)
// from the existing CRM data.

const COUNTER_PATH = path.join(
  process.cwd(),
  "data",
  "invoice-counter.json"
);

async function readCounter(): Promise<number> {
  try {
    const raw = await fs.readFile(COUNTER_PATH, "utf8");
    const data = JSON.parse(raw) as { next?: unknown };
    const n = typeof data.next === "number" ? data.next : NaN;
    if (Number.isFinite(n) && n >= 1) return n;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
  // Initialise from existing orders.
  const orders = await readOrders();
  const maxFromOrders = parseInvoiceNumber(nextInvoiceNumber(orders));
  await fs.mkdir(path.dirname(COUNTER_PATH), { recursive: true });
  await writeCounter(maxFromOrders);
  return maxFromOrders;
}

async function writeCounter(value: number): Promise<void> {
  const tmp = COUNTER_PATH + ".tmp";
  await fs.writeFile(
    tmp,
    JSON.stringify({ next: value }, null, 2),
    "utf8"
  );
  await fs.rename(tmp, COUNTER_PATH);
}

function parseInvoiceNumber(invoice: string): number {
  const match = invoice.match(/^INV(\d+)$/i);
  return match ? Number(match[1]) : 1;
}

/**
 * Reserve and return the next invoice number, incrementing the persistent
 * counter atomically. Strictly monotonic — deleted invoice numbers are
 * never reissued.
 */
export async function consumeNextInvoiceNumber(): Promise<string> {
  const current = await readCounter();
  await writeCounter(current + 1);
  return `INV${String(current).padStart(4, "0")}`;
}

/**
 * Delete an order by invoice number — only succeeds when paymentStatus
 * is "unpaid". The invoice counter is intentionally NOT decremented:
 * future orders keep marching forward.
 */
export async function deleteUnpaidOrder(
  invoice: string
): Promise<{ ok: boolean; error?: string }> {
  const orders = await readOrders();
  const idx = orders.findIndex(
    (o) => o.invoice.toLowerCase() === invoice.toLowerCase()
  );
  if (idx < 0) return { ok: false, error: "Order not found" };
  if (orders[idx].paymentStatus !== "unpaid") {
    return {
      ok: false,
      error: "Only unpaid orders can be deleted",
    };
  }
  orders.splice(idx, 1);
  await writeOrders(orders);
  return { ok: true };
}
