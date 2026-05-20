"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Database, Loader2, RefreshCw } from "lucide-react";

// Trigger for the activity-backfill route. Two modes:
//   - "Run pending" — only orders without an activity yet (default)
//   - "Re-extract all" (force) — every order with a TL, even already
//     backfilled ones. Useful after a prompt change.
//
// Loops the route until `remaining === 0`. In force mode we pass back
// the `nextOffset` from each response so we don't reprocess the same
// orders forever.

interface Status {
  totalOrders: number;
  totalWithTL: number;
  totalWithActivity: number;
  totalNeedsBackfill: number;
  totalReextract: number;
}

interface BatchResult {
  processed: number;
  updated: number;
  skippedNoFile: number;
  skippedExtractFailed: number;
  nextOffset: number;
  remaining: number;
  totalCandidates: number;
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
      if (data.totalNeedsBackfill === 0 && data.totalWithTL === 0) {
        setProgress("No orders have a trade license uploaded yet.");
      } else if (data.totalNeedsBackfill === 0) {
        setProgress(
          "All trade licenses have been backfilled. Use Re-extract All to re-run with the latest prompt."
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status check failed");
      setChecked(true);
    }
  }

  async function runBackfill(force: boolean) {
    if (running) return;
    setRunning(true);
    setError(null);
    setProgress(null);

    try {
      let totalUpdated = 0;
      let offset = 0;
      let batchCount = 0;
      const SAFETY_CAP = 100; // ~2000 orders at batchSize 20

      while (batchCount < SAFETY_CAP) {
        batchCount++;
        const res = await fetch("/api/admin/backfill-activities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batchSize: 20, force, offset }),
        });
        if (!res.ok) {
          const errBody = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(errBody.error ?? `Backfill failed (${res.status})`);
        }
        const data = (await res.json()) as BatchResult;
        totalUpdated += data.updated;
        offset = data.nextOffset;
        setProgress(
          `Batch ${batchCount}: +${data.updated} updated · ${data.remaining} remaining of ${data.totalCandidates}`
        );
        if (data.remaining === 0 || data.processed === 0) break;
      }
      setProgress(
        `Done. ${totalUpdated} order${totalUpdated === 1 ? "" : "s"} updated across ${batchCount} batch(es).`
      );
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
            Activity extraction (trade licenses)
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-dark">
            Runs Claude Haiku Vision over each order&apos;s uploaded trade
            license to pull out all activities + activity codes. Re-extract
            All is useful after a prompt update — it re-runs even on already
            backfilled orders.
          </p>

          {checked && status && (
            <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
              <Stat label="Total orders" value={status.totalOrders} />
              <Stat label="Have TL file" value={status.totalWithTL} />
              <Stat
                label="Pending backfill"
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

          <div className="mt-3 flex flex-wrap items-center gap-2">
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
                onClick={() => runBackfill(false)}
                disabled={running}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3 text-xs font-semibold text-white hover:bg-primary disabled:opacity-60"
              >
                {running ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Running…
                  </>
                ) : (
                  `Run pending (${status.totalNeedsBackfill})`
                )}
              </button>
            )}
            {checked && status && status.totalWithTL > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `Re-extract activities on all ${status.totalWithTL} orders with a trade license? This will overwrite existing activity data with the latest Vision prompt output.`
                    )
                  ) {
                    void runBackfill(true);
                  }
                }}
                disabled={running}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs font-medium text-foreground hover:bg-gray-light disabled:opacity-60"
              >
                <RefreshCw size={12} />
                Re-extract all ({status.totalWithTL})
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
