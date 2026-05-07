import "server-only";

import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { put, del } from "@vercel/blob";
// Bundled CRM seed — guaranteed to ship with the function on Vercel
// because it's a regular import (Next's bundler picks it up). Used as
// the first-run seed for the Blob store and as a read-only fallback
// when the local fs file isn't reachable.
import bundledOrdersData from "@/data/orders.json";

/**
 * Storage abstraction — dev uses the local filesystem, prod uses Vercel
 * Blob. The backend is auto-selected based on `BLOB_READ_WRITE_TOKEN`
 * (Vercel sets it automatically when a Blob store is connected).
 *
 * Two responsibilities here:
 *   1. The orders JSON document — loaded fresh on every request, written
 *      back atomically when an order is created/updated/deleted.
 *   2. Uploaded files (Trade Licenses, wholesaler invoices). The order
 *      record stores either a relative fs path (dev) or a Blob URL (prod).
 */

export const STORAGE_BACKEND: "fs" | "blob" = process.env
  .BLOB_READ_WRITE_TOKEN
  ? "blob"
  : "fs";

const ORDERS_BLOB_KEY = "admin/orders.json";
const ORDERS_FS_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "orders.json"
);
const UPLOADS_FS_DIR = path.join(process.cwd(), "data", "admin-uploads");

// ─── Orders JSON ───────────────────────────────────────────────────────

/** A small in-memory cache of the orders blob URL — saved per-process. */
let cachedOrdersBlobUrl: string | null = null;

export async function readOrdersJson(): Promise<unknown[]> {
  if (STORAGE_BACKEND === "blob") {
    return readOrdersJsonFromBlob();
  }
  // fs backend: try the on-disk file (so dev writes are visible). If it
  // isn't reachable — typically on Vercel without a Blob store — fall
  // back to the bundled seed so the dashboard at least stays browsable.
  try {
    const raw = await fs.readFile(ORDERS_FS_PATH, "utf8");
    return JSON.parse(raw) as unknown[];
  } catch {
    return bundledOrdersData as unknown[];
  }
}

export async function writeOrdersJson(orders: unknown[]): Promise<void> {
  if (STORAGE_BACKEND === "blob") {
    await writeOrdersJsonToBlob(orders);
    return;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Persistent writes require Vercel Blob. Connect a Blob store to the project (Storage → Create → Blob) and redeploy."
    );
  }
  const tmp = ORDERS_FS_PATH + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(orders, null, 2), "utf8");
  await fs.rename(tmp, ORDERS_FS_PATH);
}

async function readOrdersJsonFromBlob(): Promise<unknown[]> {
  if (cachedOrdersBlobUrl) {
    const res = await fetch(cachedOrdersBlobUrl, { cache: "no-store" });
    if (res.ok) return (await res.json()) as unknown[];
    cachedOrdersBlobUrl = null;
  }

  // Look up the existing blob URL via list().
  const { list } = await import("@vercel/blob");
  const result = await list({ prefix: ORDERS_BLOB_KEY });
  const existing = result.blobs.find((b) => b.pathname === ORDERS_BLOB_KEY);

  if (existing) {
    cachedOrdersBlobUrl = existing.url;
    const res = await fetch(existing.url, { cache: "no-store" });
    return (await res.json()) as unknown[];
  }

  // First-run seed — use the bundled JSON (always available on Vercel
  // because the static import is included in the function bundle).
  const seed = bundledOrdersData as unknown[];
  await writeOrdersJsonToBlob(seed);
  return seed;
}

async function writeOrdersJsonToBlob(orders: unknown[]): Promise<void> {
  const result = await put(
    ORDERS_BLOB_KEY,
    JSON.stringify(orders, null, 2),
    {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
      allowOverwrite: true,
    }
  );
  cachedOrdersBlobUrl = result.url;
}

// ─── File uploads ──────────────────────────────────────────────────────

export interface UploadedRef {
  /**
   * Stored on the Order record. In dev this is a relative path under the
   * repo (`data/admin-uploads/...`). In prod this is the full Vercel Blob
   * URL (`https://<id>.public.blob.vercel-storage.com/...`).
   */
  ref: string;
  /** Detected MIME from the upload, used when serving. */
  contentType: string;
}

/**
 * Persist an uploaded file. `key` is a stable identifier (e.g.
 * `orders/INV0123/wholesaler-invoice.pdf` or `trade-licenses/<file>`).
 */
export async function putUpload(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<UploadedRef> {
  if (STORAGE_BACKEND === "blob") {
    const result = await put(`admin/${key}`, buffer, {
      access: "public",
      addRandomSuffix: true,
      contentType,
    });
    return { ref: result.url, contentType };
  }
  const fullPath = path.join(UPLOADS_FS_DIR, key);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, buffer);
  const rel = path
    .relative(process.cwd(), fullPath)
    .replace(/\\/g, "/");
  return { ref: rel, contentType };
}

/**
 * Remove every upload under a key prefix (used to clean up before a
 * replace). On Blob this lists + dels; on fs this removes matching files
 * inside the directory.
 */
export async function deleteUploadsByPrefix(prefix: string): Promise<void> {
  if (STORAGE_BACKEND === "blob") {
    const { list } = await import("@vercel/blob");
    const result = await list({ prefix: `admin/${prefix}` });
    if (result.blobs.length === 0) return;
    await del(result.blobs.map((b) => b.url));
    return;
  }
  const fullDir = path.join(UPLOADS_FS_DIR, path.dirname(prefix));
  const baseName = path.basename(prefix);
  try {
    const entries = await fs.readdir(fullDir);
    for (const entry of entries) {
      if (entry.startsWith(baseName)) {
        await fs.unlink(path.join(fullDir, entry)).catch(() => {});
      }
    }
  } catch (err) {
    // Directory might not exist yet — fine.
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}

/** True when the ref looks like an absolute Vercel Blob URL. */
export function isBlobRef(ref: string): boolean {
  return /^https?:\/\//.test(ref);
}

/**
 * Resolve a ref into something a route handler can stream / fetch.
 * Local refs return `{ kind: "fs", absolutePath }`; blob refs return
 * `{ kind: "url", url }` so the route can redirect.
 */
export function resolveUploadRef(
  ref: string
):
  | { kind: "url"; url: string }
  | { kind: "fs"; absolutePath: string } {
  if (isBlobRef(ref)) return { kind: "url", url: ref };
  return {
    kind: "fs",
    absolutePath: path.resolve(process.cwd(), ref),
  };
}

/** Fetch the bytes of an uploaded file regardless of backend. Used by ZIP export. */
export async function fetchUploadBytes(ref: string): Promise<Buffer | null> {
  try {
    const resolved = resolveUploadRef(ref);
    if (resolved.kind === "url") {
      const res = await fetch(resolved.url, { cache: "no-store" });
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    }
    return await fs.readFile(resolved.absolutePath);
  } catch {
    return null;
  }
}

/**
 * Open a Node-readable stream for a local fs ref. Throws when called on a
 * blob ref — callers should branch on `resolveUploadRef`.
 */
export function openLocalReadStream(absolutePath: string): Readable {
  return createReadStream(absolutePath);
}
