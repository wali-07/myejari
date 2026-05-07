"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

interface Props {
  defaultValue?: string;
  placeholder?: string;
  /** Debounce delay before pushing to URL. */
  delayMs?: number;
}

// Live debounced search — updates the URL `q` param 250ms after the last
// keystroke. Clearing the input removes `q` so the table immediately
// shows everything again. Other URL params are preserved.
export default function SearchInput({
  defaultValue = "",
  placeholder = "Search company, invoice, wholesaler…",
  delayMs = 250,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const [value, setValue] = useState(defaultValue);
  const [, startTransition] = useTransition();
  const initialMount = useRef(true);

  useEffect(() => {
    // Skip the very first run so we don't push on mount.
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    const handle = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      const v = value.trim();
      if (v) next.set("q", v);
      else next.delete("q");
      const qs = next.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    }, delayMs);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative w-full sm:w-72">
      <Search
        size={14}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-full border border-border bg-white pl-9 pr-9 text-xs font-medium text-foreground placeholder:font-normal placeholder:text-gray focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setValue("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray transition-colors hover:bg-gray-light hover:text-foreground"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
