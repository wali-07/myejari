import "server-only";

import { sortOrdersByDate, type Order } from "@/lib/admin/orders";
import { readOrdersJson, writeOrdersJson } from "@/lib/admin/storage";

// Storage-backed orders store. Reads/writes go through the storage
// abstraction so this works on local fs (dev) and Vercel Blob (prod)
// transparently. See src/lib/admin/storage.ts for the backend selection.

/** Read fresh orders on every call — backend-agnostic. */
export async function readOrders(): Promise<Order[]> {
  const raw = await readOrdersJson();
  return raw as Order[];
}

/** Persist the orders array atomically through whichever backend is active. */
export async function writeOrders(orders: Order[]): Promise<void> {
  await writeOrdersJson(orders);
}

/** All orders sorted oldest → newest. Page-level data entry point. */
export async function getAllOrders(): Promise<Order[]> {
  return sortOrdersByDate(await readOrders());
}

/**
 * Delete an order by invoice number — only succeeds when paymentStatus
 * is "unpaid". The deleted invoice number becomes available again, so
 * the next created order will reuse it (since `nextInvoiceNumber` just
 * scans for max + 1 across remaining orders).
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
