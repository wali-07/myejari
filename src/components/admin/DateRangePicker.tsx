"use client";

import { Calendar, Check, ChevronDown } from "lucide-react";
import Link from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  dateRangePresets,
  type DateRangeKey,
} from "@/lib/admin/orders";
import { formatDate } from "@/lib/admin/format";

interface Props {
  active: DateRangeKey | "custom";
  customFrom?: string;
  customTo?: string;
  basePath?: string;
  /** Other URL params to preserve when changing the date filter. */
  preserveParams?: Record<string, string | undefined>;
}

// Single-button date range picker with a dropdown popover containing presets
// + a custom from/to picker. Closes on outside click or after a preset is
// selected. Custom date inputs commit live (debounced via the URL push).
export default function DateRangePicker({
  active,
  customFrom,
  customTo,
  basePath = "/admin",
  preserveParams,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [, startTransition] = useTransition();

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function buildPresetHref(key: DateRangeKey) {
    const next = new URLSearchParams();
    if (key !== "all") next.set("range", key);
    if (preserveParams) {
      for (const [k, v] of Object.entries(preserveParams)) {
        if (v) next.set(k, v);
      }
    }
    const qs = next.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  function pushCustom(nextFrom: string, nextTo: string) {
    const next = new URLSearchParams(params.toString());
    if (nextFrom && nextTo) {
      next.set("from", nextFrom);
      next.set("to", nextTo);
      next.delete("range");
    } else {
      next.delete("from");
      next.delete("to");
    }
    const qs = next.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  // Label shown on the trigger button.
  const triggerLabel = (() => {
    if (active === "custom" && customFrom && customTo) {
      return `${formatDate(customFrom)} – ${formatDate(customTo)}`;
    }
    return (
      dateRangePresets().find((p) => p.key === active)?.label ?? "All time"
    );
  })();

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white pl-3 pr-2.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:border-foreground/20"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Calendar size={14} className="text-gray-dark" />
        <span className="tabular-nums">{triggerLabel}</span>
        <ChevronDown
          size={14}
          className={`text-gray transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Filter by date"
          className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-border bg-white shadow-[0_24px_48px_-16px_rgba(13,19,26,0.15)]"
        >
          <div className="p-1.5">
            <p className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray">
              Quick range
            </p>
            <ul className="space-y-0.5">
              {dateRangePresets().map((preset) => {
                const selected = active === preset.key;
                return (
                  <li key={preset.key}>
                    <Link
                      href={buildPresetHref(preset.key)}
                      onClick={() => setOpen(false)}
                      scroll={false}
                      className={
                        selected
                          ? "flex items-center justify-between rounded-lg bg-primary-light/70 px-2.5 py-2 text-xs font-semibold text-primary-dark"
                          : "flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-foreground/80 transition-colors hover:bg-gray-light/70 hover:text-foreground"
                      }
                    >
                      <span>{preset.label}</span>
                      {selected && (
                        <Check size={13} className="text-primary" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="border-t border-border bg-gray-light/30 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray">
              Custom range
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input
                type="date"
                value={customFrom ?? ""}
                onChange={(e) => pushCustom(e.target.value, customTo ?? "")}
                max={customTo || undefined}
                aria-label="From date"
                className="h-9 rounded-lg border border-border bg-white px-2 text-xs text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
              <input
                type="date"
                value={customTo ?? ""}
                onChange={(e) => pushCustom(customFrom ?? "", e.target.value)}
                min={customFrom || undefined}
                aria-label="To date"
                className="h-9 rounded-lg border border-border bg-white px-2 text-xs text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
            </div>
            {active === "custom" && customFrom && customTo && (
              <button
                type="button"
                onClick={() => pushCustom("", "")}
                className="mt-2 inline-flex items-center text-[11px] font-medium text-gray-dark hover:text-foreground"
              >
                Clear custom range
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
