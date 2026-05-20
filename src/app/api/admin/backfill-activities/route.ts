import { NextResponse } from "next/server";
import path from "node:path";
import { extractTradeLicenseVision } from "@/lib/admin/tl-extract";
import { fetchUploadBytes } from "@/lib/admin/storage";
import { readOrders, writeOrders } from "@/lib/admin/orders-store";

// Backfill / re-backfill the `activity` + `activityCode` fields on orders
// by running Claude Haiku Vision over the uploaded trade license. Two modes:
//
//   - Default: only orders with a TL AND no activity yet (idempotent —
//     re-running picks up only what's still missing).
//   - Force: ALL orders with a TL, even ones already backfilled. Useful
//     after a prompt change (e.g. "extract ALL activities, not just one")
//     to re-run on already-processed orders without manually clearing
//     their fields first.
//
// Runs in BATCHES to stay under Vercel function timeout. The frontend
// calls this repeatedly until `remaining === 0`. In force mode, the
// frontend tracks `nextOffset` and passes it back on each call so we
// don't loop on the same already-updated orders.
//
// Cost: ~$0.005 per order processed via Haiku Vision.

export const runtime = "nodejs";
export const maxDuration = 60;

const DEFAULT_BATCH_SIZE = 20;
const MAX_BATCH_SIZE = 50;

function mimeFromPath(p: string): string {
  const ext = path.extname(p).toLowerCase();
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}

interface BatchResult {
  batchSize: number;
  force: boolean;
  processed: number;
  updated: number;
  skippedNoFile: number;
  skippedExtractFailed: number;
  /** For force mode: pass this back as `offset` on the next call. */
  nextOffset: number;
  /** How many candidates remain after this batch. */
  remaining: number;
  totalCandidates: number;
  errors: string[];
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not set — Vision extraction unavailable" },
      { status: 503 }
    );
  }

  let body: { batchSize?: number; force?: boolean; offset?: number } = {};
  try {
    body = await request.json();
  } catch {
    /* empty body is fine */
  }
  const batchSize = Math.min(
    Math.max(1, body.batchSize ?? DEFAULT_BATCH_SIZE),
    MAX_BATCH_SIZE
  );
  const force = body.force === true;
  const offset = Math.max(0, Math.floor(body.offset ?? 0));

  const orders = await readOrders();

  // Stable ordering so offset slicing is deterministic across calls.
  const sortedOrders = [...orders].sort((a, b) =>
    a.invoice.localeCompare(b.invoice)
  );

  const candidates = sortedOrders.filter(
    (o) => o.tradeLicensePath && (force || !o.activity)
  );
  const totalCandidates = candidates.length;
  const batch = candidates.slice(offset, offset + batchSize);

  if (batch.length === 0) {
    return NextResponse.json<BatchResult>({
      batchSize,
      force,
      processed: 0,
      updated: 0,
      skippedNoFile: 0,
      skippedExtractFailed: 0,
      nextOffset: offset,
      remaining: Math.max(0, totalCandidates - offset),
      totalCandidates,
      errors: [],
    });
  }

  // Index for O(1) mutation by invoice.
  const byInvoice = new Map(orders.map((o) => [o.invoice, o]));

  const result: BatchResult = {
    batchSize,
    force,
    processed: 0,
    updated: 0,
    skippedNoFile: 0,
    skippedExtractFailed: 0,
    nextOffset: offset,
    remaining: 0,
    totalCandidates,
    errors: [],
  };

  for (const order of batch) {
    result.processed++;
    const ref = order.tradeLicensePath;
    if (!ref) {
      result.skippedNoFile++;
      continue;
    }

    try {
      const bytes = await fetchUploadBytes(ref);
      if (!bytes) {
        result.skippedNoFile++;
        continue;
      }
      const mime = mimeFromPath(ref);
      const extraction = await extractTradeLicenseVision(bytes, mime);
      if (!extraction.activity && !extraction.activityCode) {
        result.skippedExtractFailed++;
        continue;
      }
      const current = byInvoice.get(order.invoice);
      if (!current) continue;
      byInvoice.set(order.invoice, {
        ...current,
        activity: extraction.activity ?? current.activity,
        activityCode: extraction.activityCode ?? current.activityCode,
      });
      result.updated++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`${order.invoice}: ${msg}`);
    }
  }

  if (result.updated > 0) {
    const next = orders.map((o) => byInvoice.get(o.invoice) ?? o);
    await writeOrders(next);
  }

  if (force) {
    // Force mode is offset-driven — advance by what we processed.
    result.nextOffset = offset + result.processed;
    result.remaining = Math.max(0, totalCandidates - result.nextOffset);
  } else {
    // Default mode: candidates list shrinks as we backfill — recount.
    const updatedOrders = await readOrders();
    result.remaining = updatedOrders.filter(
      (o) => o.tradeLicensePath && !o.activity
    ).length;
    result.nextOffset = 0;
  }

  return NextResponse.json<BatchResult>(result);
}

export async function GET() {
  const orders = await readOrders();
  const totalWithTL = orders.filter((o) => o.tradeLicensePath).length;
  const totalWithActivity = orders.filter((o) => o.activity).length;
  const totalNeedsBackfill = orders.filter(
    (o) => o.tradeLicensePath && !o.activity
  ).length;
  return NextResponse.json({
    totalOrders: orders.length,
    totalWithTL,
    totalWithActivity,
    totalNeedsBackfill,
    // In force mode the client re-extracts all `totalWithTL` orders.
    totalReextract: totalWithTL,
  });
}
