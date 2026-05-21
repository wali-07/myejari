import "server-only";

import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { put, del, get, list } from "@vercel/blob";
// Bundled CRM seed — guaranteed to ship with the function on Vercel
// because it's a regular import (Next's bundler picks it up). Used as
// the first-run seed for the Blob store and as a read-only fallback
// when the local fs file isn't reachable.
import bundledOrdersData from "@/data/orders.json";
import { calculateGatewayFees, type Order } from "@/lib/admin/orders";

/**
 * Storage abstraction — dev uses the local filesystem, prod uses Vercel
 * Blob. The backend is auto-selected based on `BLOB_READ_WRITE_TOKEN`
 * (Vercel sets it automatically when a Blob store is connected).
 *
 * Two responsibilities here:
 *   1. Mutable JSON documents (the orders CRM, the activity notes) —
 *      see `createVersionedBlobDoc` below.
 *   2. Uploaded files (Trade Licenses, wholesaler invoices). The order
 *      record stores either a relative fs path (dev) or a Blob URL (prod).
 */

export const STORAGE_BACKEND: "fs" | "blob" = process.env
  .BLOB_READ_WRITE_TOKEN
  ? "blob"
  : "fs";

const ORDERS_FS_PATH = path.join(process.cwd(), "src", "data", "orders.json");
const UPLOADS_FS_DIR = path.join(process.cwd(), "data", "admin-uploads");

// ─── Versioned JSON documents ──────────────────────────────────────────
//
// A mutable JSON document is stored on Vercel Blob as an APPEND-ONLY LOG
// of immutable version files. Every write creates a brand-new, uniquely
// named blob — it NEVER overwrites an existing one.
//
// Why this design exists: overwriting a fixed-name blob does NOT purge
// the Vercel Blob CDN, and `fetch(..., { cache: "no-store" })` only
// bypasses Next's own fetch cache — never the CDN edge. With a single
// overwritten document a freshly created/edited/deleted record could
// therefore stay invisible for up to the cache lifetime. That is the
// exact "I marked it paid, refreshed, and it came back" bug.
//
// With one immutable file per version the problem disappears:
//   • a brand-new file's URL has never been cached by anything, and
//   • an existing file's content never changes, so caching it is always
//     correct.
// Reads `list()` the log and fetch the newest version. `list()` reads
// store metadata (strongly consistent), not the CDN. The rare sub-second
// indexing lag after a write is covered, on the writing instance, by an
// in-memory read-your-writes copy. Old versions are pruned on write,
// keeping the most recent N — each of which doubles as a backup.

/** cacheControlMaxAge for backup / migration-flag blobs (SDK minimum). */
const ORDERS_CACHE_MAX_AGE_SECONDS = 60;

interface VersionedBlobDoc {
  /** Newest version of the document, strongly consistent. */
  read(): Promise<unknown[]>;
  /** Append a new immutable version of the document. */
  write(value: unknown[]): Promise<void>;
}

/**
 * Build a strongly-consistent JSON-array document backed by an append-only
 * log of immutable Blob version files. See the section comment above for
 * the rationale.
 */
export function createVersionedBlobDoc(opts: {
  /** Folder the version files live under, e.g. "admin/orders-log/". */
  logPrefix: string;
  /** Pre-upgrade single-document key to migrate from on the first read. */
  legacyKey: string;
  /** How many recent versions to retain (each doubles as a backup). */
  keepVersions: number;
  /** Value to use when the store is genuinely empty (first run ever). */
  fallback: () => unknown[];
}): VersionedBlobDoc {
  // Read-your-writes state, scoped to THIS serverless instance.
  let lastValue: unknown[] | null = null;
  let lastPathname: string | null = null;
  let seq = 0;

  /**
   * A unique, chronologically-sortable pathname for a new version.
   * `<zero-padded-ms>-<ordinal>-<uuid>.json` — lexical order equals write
   * order, and the uuid guarantees uniqueness across instances.
   */
  function nextPathname(): string {
    const stamp = String(Date.now()).padStart(15, "0");
    const ordinal = String(seq++).padStart(6, "0");
    return `${opts.logPrefix}${stamp}-${ordinal}-${randomUUID()}.json`;
  }

  /** Read the pre-upgrade single document, private blob or public blob. */
  async function readLegacy(): Promise<unknown[] | null> {
    try {
      const res = await get(opts.legacyKey, {
        access: "private",
        useCache: false,
      });
      if (res && res.statusCode === 200) {
        return (await new Response(
          res.stream as ReadableStream<Uint8Array>
        ).json()) as unknown[];
      }
    } catch {
      // Not a private blob, or private reads unavailable — try public.
    }
    try {
      const { blobs } = await list({ prefix: opts.legacyKey });
      const existing = blobs.find((b) => b.pathname === opts.legacyKey);
      if (existing) {
        const res = await fetch(existing.url, { cache: "no-store" });
        if (res.ok) return (await res.json()) as unknown[];
      }
    } catch {
      // fall through
    }
    return null;
  }

  /** Delete versions beyond the retention window. Best-effort only. */
  async function prune(): Promise<void> {
    try {
      const { blobs } = await list({ prefix: opts.logPrefix });
      if (blobs.length <= opts.keepVersions) return;
      const stale = blobs
        .sort((a, b) => (a.pathname < b.pathname ? 1 : -1)) // newest first
        .slice(opts.keepVersions) // everything past the keep window
        .map((b) => b.url);
      if (stale.length > 0) await del(stale);
    } catch {
      // Housekeeping only — a failure here is retried by the next write.
    }
  }

  async function write(value: unknown[]): Promise<void> {
    const pathname = nextPathname();
    await put(pathname, JSON.stringify(value, null, 2), {
      access: "public",
      addRandomSuffix: false, // the pathname is already unique
      allowOverwrite: false, // a unique pathname is never an overwrite
      contentType: "application/json",
    });
    // This instance is authoritative until `list()` indexes the write.
    lastValue = structuredClone(value);
    lastPathname = pathname;
    await prune();
  }

  async function read(): Promise<unknown[]> {
    let versions: { pathname: string; url: string }[] = [];
    try {
      const { blobs } = await list({ prefix: opts.logPrefix });
      versions = blobs;
    } catch {
      // Listing failed — fall back to the in-memory / legacy / seed paths.
    }

    if (versions.length > 0) {
      versions.sort((a, b) => (a.pathname < b.pathname ? 1 : -1));
      const newest = versions[0];

      // A write from THIS instance that `list()` hasn't indexed yet is
      // still the freshest truth — serve it.
      if (lastValue && lastPathname && lastPathname > newest.pathname) {
        return structuredClone(lastValue);
      }
      try {
        // The version file is immutable, so its URL is never stale.
        const res = await fetch(newest.url, { cache: "no-store" });
        if (res.ok) return (await res.json()) as unknown[];
      } catch {
        // Fetch failed — fall back below.
      }
    }

    // No readable version. Prefer our own in-memory copy …
    if (lastValue) return structuredClone(lastValue);

    // … then migrate the pre-upgrade single-document store, if any …
    const legacy = await readLegacy();
    if (legacy) {
      try {
        await write(legacy);
      } catch {
        // Migration is best-effort — the data is returned regardless.
      }
      return legacy;
    }

    // … otherwise this is a genuine first run. Seed the store.
    const seed = opts.fallback();
    try {
      await write(seed);
    } catch {
      // Couldn't persist the seed — still return it so the app loads.
    }
    return seed;
  }

  return { read, write };
}

// ─── Orders JSON ───────────────────────────────────────────────────────

const ordersDoc = createVersionedBlobDoc({
  logPrefix: "admin/orders-log/",
  legacyKey: "admin/orders.json",
  keepVersions: 20,
  fallback: () => structuredClone(bundledOrdersData) as unknown[],
});

/** Read fresh orders on every call — backend-agnostic. */
export async function readOrdersJson(): Promise<unknown[]> {
  if (STORAGE_BACKEND === "blob") {
    const orders = await readOrdersJsonFromBlob();
    return ensureCardFeesMigrated(orders);
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

/** Persist the orders array through whichever backend is active. */
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
  return ordersDoc.read();
}

async function writeOrdersJsonToBlob(orders: unknown[]): Promise<void> {
  await ordersDoc.write(orders);
}

/**
 * Write a timestamped, immutable backup of the orders document before a
 * destructive maintenance operation (e.g. the one-time Card-fee recalc).
 * Private + no-overwrite so a backup can never be clobbered. Returns the
 * backup ref (Blob URL or fs path), or null if the backup couldn't be
 * written (the caller decides whether to proceed).
 */
export async function backupOrdersJson(
  orders: unknown[]
): Promise<string | null> {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const body = JSON.stringify(orders, null, 2);
  try {
    if (STORAGE_BACKEND === "blob") {
      const key = `admin/orders.backup-${stamp}.json`;
      try {
        const result = await put(key, body, {
          access: "private",
          addRandomSuffix: false,
          contentType: "application/json",
          allowOverwrite: false,
          cacheControlMaxAge: ORDERS_CACHE_MAX_AGE_SECONDS,
        });
        return result.url;
      } catch {
        // Private blobs may be unavailable on this store. Fall back to a
        // public blob with a random suffix so the URL is unguessable —
        // a recoverable backup beats no backup.
        const result = await put(key, body, {
          access: "public",
          addRandomSuffix: true,
          contentType: "application/json",
          allowOverwrite: false,
          cacheControlMaxAge: ORDERS_CACHE_MAX_AGE_SECONDS,
        });
        return result.url;
      }
    }
    const backupPath = ORDERS_FS_PATH.replace(
      /orders\.json$/,
      `orders.backup-${stamp}.json`
    );
    await fs.writeFile(backupPath, body, "utf8");
    return backupPath;
  } catch {
    return null;
  }
}

// ─── One-time Card-fee recalculation migration ─────────────────────────

/** Per-process guard so the one-time Card-fee recalc is attempted once. */
let cardFeeMigrationChecked = false;
/** Bump the version suffix to re-run the recalc as a fresh migration. */
const CARD_FEE_MIGRATION_FLAG =
  "admin/migrations/recalc-card-fees-v1.json";

function recalcCardFees(orders: Order[]): {
  next: Order[];
  changed: number;
} {
  let changed = 0;
  const next = orders.map((o) => {
    if (o.paymentMethod !== "Card") return o;
    const margin = o.myEjariPrice - o.wholesalePrice;
    const gatewayFees = calculateGatewayFees(o.myEjariPrice, "Card");
    const finalProfit = margin - gatewayFees;
    if (
      o.gatewayFees !== gatewayFees ||
      o.finalProfit !== finalProfit ||
      o.margin !== margin
    ) {
      changed++;
    }
    return { ...o, margin, gatewayFees, finalProfit };
  });
  return { next, changed };
}

async function writeMigrationFlag(
  changed: number,
  backup: string | null
): Promise<void> {
  const body = JSON.stringify(
    { appliedAt: new Date().toISOString(), changed, backup },
    null,
    2
  );
  const base = {
    addRandomSuffix: false as const,
    contentType: "application/json",
    allowOverwrite: false as const,
    cacheControlMaxAge: ORDERS_CACHE_MAX_AGE_SECONDS,
  };
  try {
    await put(CARD_FEE_MIGRATION_FLAG, body, {
      ...base,
      access: "private",
    });
  } catch {
    // Private unavailable, or a racing instance already wrote it. The
    // marker carries no sensitive data, so a public fallback is fine.
    try {
      await put(CARD_FEE_MIGRATION_FLAG, body, {
        ...base,
        access: "public",
      });
    } catch {
      // Already exists (race) — fine, it's a one-way marker.
    }
  }
}

/** True once the Card-fee migration flag exists, however it was written. */
async function cardFeeMigrationApplied(): Promise<boolean> {
  // `list()` reports every blob in the store regardless of access level,
  // so this finds the flag whether it was written private or public.
  try {
    const { blobs } = await list({ prefix: CARD_FEE_MIGRATION_FLAG });
    return blobs.some((b) => b.pathname === CARD_FEE_MIGRATION_FLAG);
  } catch {
    // Unknown — treat as "not applied"; the migration is idempotent.
    return false;
  }
}

/**
 * One-time, idempotent auto-migration. On the first orders read after
 * deploy, recompute every Card order's Ziina fee with the corrected
 * (amount·2.6% + AED 1) × 1.05 formula. Guarded by a Blob flag so it runs
 * once globally, and the document is backed up before any write. Entirely
 * best-effort: any failure returns the original orders untouched (a read
 * can never break), and because the op is idempotent and flag-gated, a
 * later cold instance simply retries until it sticks.
 */
async function ensureCardFeesMigrated(
  orders: unknown[]
): Promise<unknown[]> {
  if (STORAGE_BACKEND !== "blob") return orders;
  if (cardFeeMigrationChecked) return orders;
  cardFeeMigrationChecked = true;

  if (await cardFeeMigrationApplied()) return orders;

  try {
    const { next, changed } = recalcCardFees(orders as Order[]);

    if (changed > 0) {
      const backup = await backupOrdersJson(orders);
      // Never rewrite financial data without a successful backup.
      if (!backup) return orders;
      await writeOrdersJsonToBlob(next);
      await writeMigrationFlag(changed, backup);
      return next;
    }

    // Nothing to change — set the flag so we stop checking every cold start.
    await writeMigrationFlag(0, null);
    return next;
  } catch {
    return orders;
  }
}

// ─── File uploads ──────────────────────────────────────────────────────
//
// Uploaded files (Trade Licenses, wholesaler invoices) contain customer
// PII. On the Blob backend they are stored as PRIVATE blobs and streamed
// only through the auth-gated `/admin/uploads/...` route — never linked at
// a public URL. The Order record stores an opaque ref:
//   • `admin/…`              → a private Blob pathname (current)
//   • `https://…`            → a legacy PUBLIC Blob URL (pre-privacy; the
//                              "Secure documents" backfill migrates these)
//   • `data/admin-uploads/…` → a local file (dev / fs backend)

export interface UploadedRef {
  /** Opaque reference stored on the Order record — see the note above. */
  ref: string;
  /** Detected MIME from the upload, used when serving. */
  contentType: string;
}

/** Blob pathname prefixes the upload serve route is allowed to hand out. */
const UPLOAD_BLOB_PREFIXES = ["admin/trade-licenses/", "admin/orders/"];

const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".gif": "image/gif",
};

/** Best-effort MIME type from a path / URL extension. */
export function guessUploadMime(ref: string): string {
  const ext = path.extname(ref.split("?")[0]).toLowerCase();
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

/**
 * Persist an uploaded file. `key` is a stable identifier (e.g.
 * `orders/INV0123/wholesaler-invoice.pdf` or `trade-licenses/<file>`).
 * On Blob the file is stored PRIVATE and the returned ref is its
 * pathname. If the store has no private-blob support the upload still
 * succeeds as a public blob (logged) so the admin tool never breaks.
 */
export async function putUpload(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<UploadedRef> {
  if (STORAGE_BACKEND === "blob") {
    const pathname = `admin/${key}`;
    try {
      const result = await put(pathname, buffer, {
        access: "private",
        addRandomSuffix: true,
        contentType,
      });
      return { ref: result.pathname, contentType };
    } catch {
      // Private blobs unavailable on this store — fall back to public so
      // the upload never fails. PII is NOT hidden in this case; the
      // Vercel Blob store needs private-blob support enabled.
      console.warn(
        "[storage] Private blob unavailable — uploaded file stored PUBLIC:",
        pathname
      );
      const result = await put(pathname, buffer, {
        access: "public",
        addRandomSuffix: true,
        contentType,
      });
      return { ref: result.url, contentType };
    }
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

/** Delete a single uploaded file by its stored ref. Best-effort. */
export async function deleteUploadByRef(ref: string): Promise<void> {
  try {
    if (/^https?:\/\//.test(ref) || ref.startsWith("admin/")) {
      // `del` accepts either a Blob URL or a pathname.
      await del(ref);
      return;
    }
    const resolved = resolveUploadRef(ref);
    if (resolved.kind === "fs") {
      await fs.unlink(resolved.absolutePath).catch(() => {});
    }
  } catch {
    // Best-effort — a failed delete must not abort the caller.
  }
}

type ResolvedRef =
  | { kind: "blob-url"; url: string }
  | { kind: "blob-private"; pathname: string }
  | { kind: "fs"; absolutePath: string };

/** Classify a stored ref into how its bytes should be retrieved. */
function resolveUploadRef(ref: string): ResolvedRef {
  if (/^https?:\/\//.test(ref)) return { kind: "blob-url", url: ref };
  if (ref.startsWith("admin/")) {
    return { kind: "blob-private", pathname: ref };
  }
  return { kind: "fs", absolutePath: path.resolve(process.cwd(), ref) };
}

/** Fetch the bytes of an uploaded file regardless of backend. */
export async function fetchUploadBytes(ref: string): Promise<Buffer | null> {
  try {
    const resolved = resolveUploadRef(ref);
    if (resolved.kind === "blob-url") {
      const res = await fetch(resolved.url, { cache: "no-store" });
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    }
    if (resolved.kind === "blob-private") {
      const res = await get(resolved.pathname, { access: "private" });
      if (!res || res.statusCode !== 200) return null;
      return Buffer.from(
        await new Response(
          res.stream as ReadableStream<Uint8Array>
        ).arrayBuffer()
      );
    }
    return await fs.readFile(resolved.absolutePath);
  } catch {
    return null;
  }
}

/** What the `/admin/uploads/...` route needs to serve one file. */
export type ServableUpload =
  | { kind: "redirect"; url: string }
  | {
      kind: "stream";
      stream: ReadableStream;
      contentType: string;
      contentLength?: number;
      filename: string;
    }
  | { kind: "not-found" };

/**
 * Resolve a stored ref into a streamable response for the auth-gated
 * `/admin/uploads/...` route. Enforces that private Blob refs sit under an
 * allowed upload prefix, and that fs refs stay inside the uploads dir.
 */
export async function openUploadForServing(
  ref: string
): Promise<ServableUpload> {
  const resolved = resolveUploadRef(ref);

  if (resolved.kind === "blob-url") {
    // Legacy public file — already internet-reachable; just redirect.
    return { kind: "redirect", url: resolved.url };
  }

  if (resolved.kind === "blob-private") {
    if (
      !UPLOAD_BLOB_PREFIXES.some((p) => resolved.pathname.startsWith(p))
    ) {
      return { kind: "not-found" };
    }
    try {
      const res = await get(resolved.pathname, { access: "private" });
      if (!res || res.statusCode !== 200) return { kind: "not-found" };
      return {
        kind: "stream",
        stream: res.stream as ReadableStream,
        contentType:
          res.blob.contentType || guessUploadMime(resolved.pathname),
        contentLength: res.blob.size,
        filename: path.basename(resolved.pathname),
      };
    } catch {
      return { kind: "not-found" };
    }
  }

  // fs — confine to the uploads directory (path-traversal guard).
  const abs = resolved.absolutePath;
  if (abs !== UPLOADS_FS_DIR && !abs.startsWith(UPLOADS_FS_DIR + path.sep)) {
    return { kind: "not-found" };
  }
  try {
    const stat = await fs.stat(abs);
    if (!stat.isFile()) return { kind: "not-found" };
    return {
      kind: "stream",
      stream: Readable.toWeb(
        createReadStream(abs)
      ) as unknown as ReadableStream,
      contentType: guessUploadMime(abs),
      contentLength: stat.size,
      filename: path.basename(abs),
    };
  } catch {
    return { kind: "not-found" };
  }
}
