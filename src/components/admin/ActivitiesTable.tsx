"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Pencil,
  Search,
  X,
} from "lucide-react";
import type { AggregatedActivity } from "@/lib/admin/activities";
import { filterActivities } from "@/lib/admin/activities";
import type { OfficeType } from "@/lib/admin/orders";

interface Props {
  activities: AggregatedActivity[];
}

const OFFICE_TONE: Record<OfficeType, string> = {
  "Business Center": "bg-primary-light/70 text-primary-dark ring-primary/15",
  Coworking: "bg-amber/10 text-[#a35a00] ring-amber/30",
  "Separate Office": "bg-success/10 text-success ring-success/20",
  "Shop Ejari": "bg-coral/10 text-coral ring-coral/20",
  Warehouse: "bg-gray-dark/10 text-gray-dark ring-gray-dark/20",
  Other: "bg-gray-light text-gray-dark ring-border",
};

export default function ActivitiesTable({ activities }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () => filterActivities(activities, query),
    [activities, query]
  );

  function startEdit(activity: AggregatedActivity) {
    setEditingKey(activity.key);
    setEditValue(activity.notes ?? "");
    setOpenKey(activity.key);
    setError(null);
  }

  function cancelEdit() {
    setEditingKey(null);
    setEditValue("");
    setError(null);
  }

  async function saveEdit() {
    if (!editingKey) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: editingKey, notes: editValue }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? `Save failed (${res.status})`);
      }
      setEditingKey(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (activities.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-foreground">
          No activities yet
        </p>
        <p className="mt-1 text-xs text-gray">
          Upload trade licenses on new orders, or run the activity backfill
          on existing orders. Activities will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search
          size={14}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search activities by name, code, or notes…"
          className="h-10 w-full rounded-full border border-border bg-white pl-9 pr-9 text-sm font-medium text-foreground placeholder:font-normal placeholder:text-gray focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray hover:bg-gray-light hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <p className="text-[11px] font-medium text-gray">
        {filtered.length} of {activities.length} {activities.length === 1 ? "activity" : "activities"}
        {query && " matching"}
      </p>

      <div className="overflow-clip rounded-2xl border border-border bg-white shadow-sm">
        {/* Mobile: card list */}
        <ul className="divide-y divide-border/60 sm:hidden">
          {filtered.map((a) => {
            const isOpen = openKey === a.key;
            return (
              <li key={a.key} className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => setOpenKey(isOpen ? null : a.key)}
                  className="flex w-full items-start justify-between gap-3 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {a.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-dark">
                      {a.orderCount} order{a.orderCount === 1 ? "" : "s"}
                      {a.codes.length > 0 && ` · ${a.codes.join(", ")}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-gray">
                    {isOpen ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </span>
                </button>
                {isOpen && (
                  <DetailBlock
                    activity={a}
                    editing={editingKey === a.key}
                    editValue={editValue}
                    setEditValue={setEditValue}
                    onStartEdit={() => startEdit(a)}
                    onCancel={cancelEdit}
                    onSave={saveEdit}
                    saving={saving}
                    error={editingKey === a.key ? error : null}
                  />
                )}
              </li>
            );
          })}
        </ul>

        {/* Desktop: table */}
        <div className="hidden sm:block">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-light/40 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-dark">
                <th className="w-8 px-3 py-2.5"></th>
                <th className="px-3 py-2.5">Activity</th>
                <th className="px-3 py-2.5">Codes</th>
                <th className="px-3 py-2.5 text-right">Orders</th>
                <th className="px-3 py-2.5">Primary office type</th>
                <th className="px-3 py-2.5">Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const isOpen = openKey === a.key;
                return (
                  <RowGroup
                    key={a.key}
                    activity={a}
                    isOpen={isOpen}
                    toggleOpen={() =>
                      setOpenKey(isOpen ? null : a.key)
                    }
                    editing={editingKey === a.key}
                    editValue={editValue}
                    setEditValue={setEditValue}
                    onStartEdit={() => startEdit(a)}
                    onCancel={cancelEdit}
                    onSave={saveEdit}
                    saving={saving}
                    error={editingKey === a.key ? error : null}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface RowGroupProps {
  activity: AggregatedActivity;
  isOpen: boolean;
  toggleOpen: () => void;
  editing: boolean;
  editValue: string;
  setEditValue: (v: string) => void;
  onStartEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  error: string | null;
}

function RowGroup({
  activity: a,
  isOpen,
  toggleOpen,
  editing,
  editValue,
  setEditValue,
  onStartEdit,
  onCancel,
  onSave,
  saving,
  error,
}: RowGroupProps) {
  return (
    <>
      <tr
        onClick={toggleOpen}
        className="cursor-pointer border-t border-border/60 transition-colors hover:bg-primary-light/10"
      >
        <td className="px-3 py-2.5 text-gray">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </td>
        <td className="px-3 py-2.5 text-foreground">{a.name}</td>
        <td className="px-3 py-2.5 text-[11px] text-gray-dark tabular-nums">
          {a.codes.length > 0 ? a.codes.join(", ") : "—"}
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums text-foreground">
          {a.orderCount}
        </td>
        <td className="px-3 py-2.5">
          {a.primaryOfficeType ? (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${OFFICE_TONE[a.primaryOfficeType]}`}
            >
              {a.primaryOfficeType}
            </span>
          ) : (
            <span className="text-[11px] text-gray">—</span>
          )}
        </td>
        <td className="max-w-[280px] truncate px-3 py-2.5 text-[12px] text-gray-dark">
          {a.notes || (
            <span className="italic text-gray">No notes</span>
          )}
        </td>
      </tr>
      {isOpen && (
        <tr className="border-t border-border/30 bg-gray-light/20">
          <td colSpan={6} className="px-5 py-4">
            <DetailBlock
              activity={a}
              editing={editing}
              editValue={editValue}
              setEditValue={setEditValue}
              onStartEdit={onStartEdit}
              onCancel={onCancel}
              onSave={onSave}
              saving={saving}
              error={error}
            />
          </td>
        </tr>
      )}
    </>
  );
}

interface DetailProps {
  activity: AggregatedActivity;
  editing: boolean;
  editValue: string;
  setEditValue: (v: string) => void;
  onStartEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  error: string | null;
}

function DetailBlock({
  activity: a,
  editing,
  editValue,
  setEditValue,
  onStartEdit,
  onCancel,
  onSave,
  saving,
  error,
}: DetailProps) {
  const breakdown = Object.entries(a.officeTypeCounts).sort(
    (x, y) => (y[1] ?? 0) - (x[1] ?? 0)
  );

  return (
    <div className="space-y-4 text-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray">
            Office types placed ({a.orderCount})
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {breakdown.length === 0 ? (
              <span className="text-[11px] italic text-gray">
                No office type recorded for any order
              </span>
            ) : (
              breakdown.map(([type, count]) => (
                <span
                  key={type}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${OFFICE_TONE[type as OfficeType]}`}
                >
                  {type}
                  <span className="tabular-nums opacity-70">{count}</span>
                </span>
              ))
            )}
            {a.officeTypeUnknown > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-light px-2 py-0.5 text-[11px] font-medium text-gray-dark ring-1 ring-border">
                Not set
                <span className="tabular-nums opacity-70">
                  {a.officeTypeUnknown}
                </span>
              </span>
            )}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray">
            Activity range
          </p>
          <p className="mt-1.5 text-[12px] text-foreground/85">
            First placed {a.firstSeen}
            {a.firstSeen !== a.lastSeen && ` · last ${a.lastSeen}`}
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray">
            Operational notes
          </p>
          {!editing && (
            <button
              type="button"
              onClick={onStartEdit}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
            >
              <Pencil size={11} />
              {a.notes ? "Edit" : "Add notes"}
            </button>
          )}
        </div>
        {editing ? (
          <div className="mt-1.5">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={3}
              placeholder="e.g. Virtual office works through center X but not Y. RERA approval needed before submission."
              className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
            {error && (
              <p className="mt-1.5 text-[11px] font-medium text-coral">
                {error}
              </p>
            )}
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3 text-xs font-semibold text-white hover:bg-primary disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save"
                )}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                className="inline-flex h-8 items-center rounded-lg px-3 text-xs font-medium text-gray hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/85">
            {a.notes || (
              <span className="italic text-gray">No notes yet</span>
            )}
          </p>
        )}
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray">
          Linked orders
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {a.orderInvoices.slice(0, 24).map((invoice) => (
            <Link
              key={invoice}
              href={`/admin?q=${encodeURIComponent(invoice)}`}
              className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-gray-dark ring-1 ring-border hover:bg-primary-light/30 hover:text-primary-dark"
            >
              {invoice}
            </Link>
          ))}
          {a.orderInvoices.length > 24 && (
            <span className="text-[11px] italic text-gray">
              +{a.orderInvoices.length - 24} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
