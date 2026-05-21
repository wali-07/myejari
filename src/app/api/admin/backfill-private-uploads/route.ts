import { NextResponse } from "next/server";
import { readOrders, writeOrders } from "@/lib/admin/orders-store";
import {
  deleteUploadByRef,
  fetchUploadBytes,
  guessUploadMime,
  putUpload,
} from "@/lib/admin/storage";
import type { Order } from "@/lib/admin/orders";

// Migrate uploaded customer documents (trade licenses, wholesaler
// invoices) from PUBLIC Vercel Blobs to PRIVATE ones. Pre-privacy uploads
// were stored at public, internet-reachable URLs; this re-uploads each as
// a private blob, repoints the order record, and deletes the public
// original.
//
// Runs in BATCHES — each file is downloaded then re-uploaded, which is
// heavy. The client loops, always taking the first N still-public orders;
// the candidate list shrinks as files are secured, so no offset is needed.
//
// Auth: gated by the /api/admin/* session middleware.

export const runtime = "nodejs";
export const maxDuration = 60;

const DEFAULT_BATCH_SIZE = 10;
const MAX_BATCH_SIZE = 25;

/** The two order fields that hold an uploaded-document ref. */
const REF_FIELDS = ["tradeLicensePath", "wholesalerInvoicePath"] as const;

/** A ref is "public" (needs securing) when it is a plain http(s) URL. */
function isPublicRef(ref: string | undefined): ref is string {
  return typeof ref === "string" && /^https?:\/\//.test(ref);
}

function publicRefCount(order: Order): number {
  return REF_FIELDS.filter((f) => isPublicRef(order[f])).length;
}

/** File extension from a URL path, e.g. ".pdf". */
function extOf(url: string): string {
  try {
    const p = new URL(url).pathname;
    const dot = p.lastIndexOf(".");
    return dot >= 0 ? p.slice(dot).toLowerCase() : "";
  } catch {
    return "";
  }
}

interface BatchResult {
  processed: number;
  migrated: number;
  failed: number;
  remaining: number;
  totalCandidates: number;
  errors: string[];
}

export async function GET() {
  const orders = await readOrders();
  const candidates = orders.filter((o) => publicRefCount(o) > 0);
  return NextResponse.json({
    totalOrders: orders.length,
    totalCandidates: candidates.length,
    totalFiles: candidates.reduce((s, o) => s + publicRefCount(o), 0),
  });
}

export async function POST(request: Request) {
  let body: { batchSize?: number } = {};
  try {
    body = await request.json();
  } catch {
    /* empty body is fine */
  }
  const batchSize = Math.min(
    Math.max(1, body.batchSize ?? DEFAULT_BATCH_SIZE),
    MAX_BATCH_SIZE
  );

  const orders = await readOrders();
  // Stable order so repeated calls process candidates deterministically.
  const candidates = [...orders]
    .sort((a, b) => a.invoice.localeCompare(b.invoice))
    .filter((o) => publicRefCount(o) > 0);

  const result: BatchResult = {
    processed: 0,
    migrated: 0,
    failed: 0,
    remaining: candidates.length,
    totalCandidates: candidates.length,
    errors: [],
  };

  const batch = candidates.slice(0, batchSize);
  if (batch.length === 0) {
    return NextResponse.json<BatchResult>(result);
  }

  // Working copies, mutated then written back in one pass.
  const byInvoice = new Map(orders.map((o) => [o.invoice, { ...o }]));

  for (const order of batch) {
    result.processed++;
    const current = byInvoice.get(order.invoice);
    if (!current) continue;

    for (const field of REF_FIELDS) {
      const ref = current[field];
      if (!isPublicRef(ref)) continue;
      try {
        const bytes = await fetchUploadBytes(ref);
        if (!bytes) throw new Error("could not download the original file");
        const ext = extOf(ref);
        const key =
          field === "tradeLicensePath"
            ? `trade-licenses/${order.invoice}-tl${ext}`
            : `orders/${order.invoice}/wholesaler-invoice${ext}`;
        const stored = await putUpload(key, bytes, guessUploadMime(ref));
        current[field] = stored.ref;
        // Drop the now-orphaned public original.
        await deleteUploadByRef(ref);
        result.migrated++;
      } catch (err) {
        result.failed++;
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`${order.invoice} ${field}: ${msg}`);
        console.error(`[backfill-private-uploads] ${order.invoice}`, err);
      }
    }
  }

  // Persist the repointed refs.
  const next = orders.map((o) => byInvoice.get(o.invoice) ?? o);
  await writeOrders(next);

  result.remaining = next.filter((o) => publicRefCount(o) > 0).length;
  return NextResponse.json<BatchResult>(result);
}
