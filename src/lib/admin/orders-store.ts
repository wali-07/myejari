import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { sortOrdersByDate, type Order } from "@/lib/admin/orders";

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
