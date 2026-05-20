"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Database, Loader2 } from "lucide-react";

// One-time-ish backfill trigger. Calls /api/admin/backfill-activities in
// a loop until `remaining === 0`. Each call processes up to 20 orders
// (~40s on Vision). The button is hidden once everything is backfilled —
// no point showing a "0 remaining" CTA forever.

interface Status {
  totalOrders: number;
  totalWithTL: number;
  totalWithActivity: number;
  totalNeedsBackfill: number;
}

interface BatchResult {
  processed: number;
  updated: number;
  skippedNoFile: number;
  skippedExtractFailed: number;
  remaining: number;
  totalNeedsBackfill: number;
  errors: string[];
}

export default function BackfillActivitiesButton() {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  async function checkStatus() {
    try {
      const res = await fetch("/api/admin/backfill-activities");
      if (!res.ok) throw new Error(`Status check failed (${res.status})`);
      const data = (await res.json()) as Status;
      setStatus(data);
      setChecked(true);
      if (data.totalNeedsBackfill === 0) {
        setProgress("All trade licenses already backfilled.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status check failed");
      setChecked(true);
    }
  }

  async function runBackfill() {
    if (running) return;
    setRunning(true);
    setError(null);
    setProgress(null);

    try {
      let totalUpdated = 0;
      let totalProcessed = 0;
      let batchCount = 0;
      // Loop until the route reports remaining === 0 OR we hit a safety cap.
      while (batchCount < 50) {
        batchCount++;
        const res = await fetch("/api/admin/backfill-activities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batchSize: 20 }),
        });
        if (!res.ok) {
          const errBody = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(errBody.error ?? `Backfill failed (${res.status})`);
        }
        const data = (await res.json()) as BatchResult;
        totalUpdated += data.updated;
        totalProcessed += data.processed;
        setProgress(
          `Batch ${batchCount}: +${data.updated} updated, ` +
            `${data.remaining} remaining ` +
            `(running total: ${totalUpdated}/${data.totalNeedsBackfill + totalUpdated})`
        );
        if (data.remaining === 0 || data.processed === 0) break;
      }
      setProgress(
        `Done. ${totalUpdated} orders updated across ${batchCount} batch(es).`
      );
      // Refresh status + admin table so the new data is visible.
      await checkStatus();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Backfill failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
          <Database size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            Backfill activities from trade licenses
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-dark">
            Runs Claude Haiku Vision over every existing order&apos;s trade
            license to pull out the activity + activity code. Idempotent —
            already-backfilled orders are skipped. Cost: ~$0.005 per order.
          </p>

          {checked && status && (
            <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
              <Stat label="Total orders" value={status.totalOrders} />
              <Stat label="Have TL file" value={status.totalWithTL} />
              <Stat
                label="Need backfill"
                value={status.totalNeedsBackfill}
                emphasis={status.totalNeedsBackfill > 0}
              />
            </div>
          )}

          {progress && (
            <p className="mt-3 rounded-lg bg-primary-light/30 px-3 py-2 text-xs font-medium text-primary-dark">
              {progress}
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="mt-3 rounded-lg bg-coral/10 px-3 py-2 text-xs font-medium text-coral"
            >
              {error}
            </p>
          )}

          <div className="mt-3 flex items-center gap-2">
            {!checked && (
              <button
                type="button"
                onClick={checkStatus}
                disabled={running}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs font-medium text-foreground hover:bg-gray-light"
              >
                Check status
              </button>
            )}
            {checked && status && status.totalNeedsBackfill > 0 && (
              <button
                type="button"
                onClick={runBackfill}
                disabled={running}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3 text-xs font-semibold text-white hover:bg-primary disabled:opacity-60"
              >
                {running ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Running…
                  </>
                ) : (
                  `Run on ${status.totalNeedsBackfill} order${status.totalNeedsBackfill === 1 ? "" : "s"}`
                )}
              </button>
            )}
            {checked && (
              <button
                type="button"
                onClick={checkStatus}
                disabled={running}
                className="inline-flex h-8 items-center rounded-lg px-2 text-xs font-medium text-gray hover:text-foreground"
              >
                Refresh
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  return (
    <div className="rounded-lg bg-gray-light/40 px-2.5 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray">
        {label}
      </p>
      <p
        className={`mt-0.5 text-base font-semibold tabular-nums ${
          emphasis ? "text-primary" : "text-foreground"
        }`}
      >
        {value.toLocaleString("en-AE")}
      </p>
    </div>
  );
}
