"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";

// Trigger for the private-uploads migration. Moves trade licenses and
// wholesaler invoices that were uploaded to public storage into private
// storage. Loops the route until nothing remains — or until a batch
// makes no progress (the leftovers are permanently un-migratable).

interface Status {
  totalOrders: number;
  totalCandidates: number;
  totalFiles: number;
}

interface BatchResult {
  processed: number;
  migrated: number;
  failed: number;
  remaining: number;
  totalCandidates: number;
  errors: string[];
}

export default function SecureUploadsButton() {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);
  const [checked, setChecked] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkStatus() {
    setError(null);
    try {
      const res = await fetch("/api/admin/backfill-private-uploads");
      if (!res.ok) throw new Error(`Status check failed (${res.status})`);
      const data = (await res.json()) as Status;
      setStatus(data);
      setChecked(true);
      setProgress(
        data.totalCandidates === 0
          ? "All uploaded documents are already private."
          : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status check failed");
      setChecked(true);
    }
  }

  async function run() {
    if (running) return;
    setRunning(true);
    setError(null);
    setProgress(null);

    try {
      let migrated = 0;
      let failed = 0;
      let batches = 0;
      let remaining = Infinity;
      const SAFETY_CAP = 100;

      while (batches < SAFETY_CAP && remaining > 0) {
        batches++;
        const res = await fetch("/api/admin/backfill-private-uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batchSize: 10 }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error ?? `Migration failed (${res.status})`);
        }
        const data = (await res.json()) as BatchResult;
        migrated += data.migrated;
        failed += data.failed;
        remaining = data.remaining;
        setProgress(
          `Batch ${batches}: ${migrated} secured · ${remaining} remaining` +
            (failed ? ` · ${failed} failed` : "")
        );
        // A batch that secured nothing means the rest are stuck — stop.
        if (data.migrated === 0) break;
      }

      setProgress(
        `Done. ${migrated} document${migrated === 1 ? "" : "s"} secured` +
          (failed
            ? ` · ${failed} could not be migrated (see server logs).`
            : ".")
      );
      await checkStatus();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Migration failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
          <ShieldCheck size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            Secure customer documents
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-dark">
            Moves trade licenses and wholesaler invoices that were uploaded
            to public storage into private storage — served only to the
            signed-in admin. New uploads are already private.
          </p>

          {checked && status && (
            <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
              <Stat label="Total orders" value={status.totalOrders} />
              <Stat
                label="Orders to secure"
                value={status.totalCandidates}
                emphasis={status.totalCandidates > 0}
              />
              <Stat
                label="Public files"
                value={status.totalFiles}
                emphasis={status.totalFiles > 0}
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
            {checked && status && status.totalCandidates > 0 && (
              <button
                type="button"
                onClick={run}
                disabled={running}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3 text-xs font-semibold text-white hover:bg-primary disabled:opacity-60"
              >
                {running ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Securing…
                  </>
                ) : (
                  `Secure ${status.totalCandidates} order${
                    status.totalCandidates === 1 ? "" : "s"
                  }`
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
