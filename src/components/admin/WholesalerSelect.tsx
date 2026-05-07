"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** Wholesalers ranked from most-used to least-used. */
  options: string[];
  placeholder?: string;
}

// Custom combobox: trigger button → popover with searchable list.
// Lets the admin pick from existing wholesalers (sorted by usage) but
// still type a new one if needed (handy for first-time vendors).
export default function WholesalerSelect({
  value,
  onChange,
  options,
  placeholder = "Select a wholesaler",
}: Props) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setFilter("");
    queueMicrotask(() => inputRef.current?.focus());
    function onClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const trimmedFilter = filter.trim().toLowerCase();
  const filtered = options.filter((o) =>
    o.toLowerCase().includes(trimmedFilter)
  );
  const showAddNew =
    trimmedFilter.length > 0 &&
    !options.some((o) => o.toLowerCase() === trimmedFilter);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-xl border border-border bg-white px-3 text-left text-sm text-foreground transition-colors hover:border-foreground/20 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15"
      >
        <span className={value ? "" : "text-gray"}>
          {value || placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`text-gray transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-border bg-white shadow-[0_18px_36px_-12px_rgba(13,19,26,0.16)]"
          role="listbox"
        >
          <div className="flex items-center gap-2 border-b border-border bg-gray-light/40 px-3">
            <Search size={13} className="text-gray" />
            <input
              ref={inputRef}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter or type new…"
              className="h-9 w-full bg-transparent text-xs text-foreground placeholder:text-gray focus:outline-none"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto p-1">
            {filtered.map((opt) => {
              const selected = opt === value;
              return (
                <li key={opt}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                    className={
                      selected
                        ? "flex w-full items-center justify-between rounded-lg bg-primary-light/70 px-2.5 py-2 text-xs font-semibold text-primary-dark"
                        : "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-foreground/80 hover:bg-gray-light"
                    }
                  >
                    <span className="truncate">{opt}</span>
                    {selected && <Check size={13} className="text-primary" />}
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && !showAddNew && (
              <li className="px-2.5 py-3 text-center text-[11px] text-gray">
                No matches
              </li>
            )}
            {showAddNew && (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onChange(filter.trim());
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-foreground/80 hover:bg-gray-light"
                >
                  <span>
                    Use{" "}
                    <span className="font-semibold text-foreground">
                      “{filter.trim()}”
                    </span>
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-gray">
                    new
                  </span>
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
