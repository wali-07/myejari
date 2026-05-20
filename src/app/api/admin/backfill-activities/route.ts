import { NextResponse } from "next/server";
import path from "node:path";
import { extractTradeLicenseVision } from "@/lib/admin/tl-extract";
import { fetchUploadBytes } from "@/lib/admin/storage";
import { readOrders, writeOrders } from "@/lib/admin/orders-store";

// One-time-ish backfill: for each order with an uploaded trade license but
// no `activity` field, fetch the TL bytes and run Claude Haiku Vision to
// extract the activity + activity code. Idempotent — re-running just
// processes orders that still don't have an activity set.
//
// Runs in BATCHES to stay under Vercel function time limits. The frontend
// calls this repeatedly until `remaining === 0`. Each call processes up
// to `batchSize` orders (default 20) and returns progress.
//
// Cost: ~$0.005 per order processed via Haiku Vision. For 109 orders
// that's ~AED 2 total. Negligible.

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel: extend timeout for batch processing

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
  processed: number;
  updated: number;
  skippedNoFile: number;
  skippedExtractFailed: number;
  remaining: number;
  totalNeedsBackfill: number;
  errors: string[];
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not set — Vision extraction unavailable" },
      { status: 503 }
    );
  }

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

  // Candidates: orders with a TL path AND no activity yet.
  const candidates = orders.filter(
    (o) => o.tradeLicensePath && !o.activity
  );
  const totalNeedsBackfill = candidates.length;
  const batch = candidates.slice(0, batchSize);

  if (batch.length === 0) {
    return NextResponse.json<BatchResult>({
      batchSize,
      processed: 0,
      updated: 0,
      skippedNoFile: 0,
      skippedExtractFailed: 0,
      remaining: 0,
      totalNeedsBackfill: 0,
      errors: [],
    });
  }

  // Build an index so we can mutate orders by invoice without scanning.
  const byInvoice = new Map(orders.map((o) => [o.invoice, o]));

  const result: BatchResult = {
    batchSize,
    processed: 0,
    updated: 0,
    skippedNoFile: 0,
    skippedExtractFailed: 0,
    remaining: 0,
    totalNeedsBackfill,
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

  // Persist the mutated orders array.
  if (result.updated > 0) {
    const next = orders.map((o) => byInvoice.get(o.invoice) ?? o);
    await writeOrders(next);
  }

  // Recompute remaining after this batch.
  const updatedOrders = await readOrders();
  result.remaining = updatedOrders.filter(
    (o) => o.tradeLicensePath && !o.activity
  ).length;

  return NextResponse.json<BatchResult>(result);
}

export async function GET() {
  // Status check: how many orders still need backfill.
  const orders = await readOrders();
  const totalNeedsBackfill = orders.filter(
    (o) => o.tradeLicensePath && !o.activity
  ).length;
  const totalWithTL = orders.filter((o) => o.tradeLicensePath).length;
  const totalWithActivity = orders.filter((o) => o.activity).length;
  return NextResponse.json({
    totalOrders: orders.length,
    totalWithTL,
    totalWithActivity,
    totalNeedsBackfill,
  });
}
