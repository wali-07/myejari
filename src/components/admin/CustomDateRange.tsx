"use client";

import { Calendar } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";

interface Props {
  from?: string;
  to?: string;
}

// Custom date-range picker — two native date inputs that submit through
// the existing URL state. Pushes `?from=YYYY-MM-DD&to=YYYY-MM-DD` and
// drops the `range` preset so the page falls into custom-range mode.
// Clearing both inputs returns to the active preset.
export default function CustomDateRange({ from, to }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  function pushUpdate(nextFrom: string, nextTo: string) {
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

  function onFromChange(e: React.ChangeEvent<HTMLInputElement>) {
    pushUpdate(e.target.value, to ?? "");
  }
  function onToChange(e: React.ChangeEvent<HTMLInputElement>) {
    pushUpdate(from ?? "", e.target.value);
  }

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground/80">
      <Calendar size={12} className="text-gray" />
      <input
        type="date"
        value={from ?? ""}
        onChange={onFromChange}
        max={to || undefined}
        className="border-none bg-transparent p-0 text-xs text-foreground focus:outline-none"
        aria-label="From date"
      />
      <span className="text-gray">→</span>
      <input
        type="date"
        value={to ?? ""}
        onChange={onToChange}
        min={from || undefined}
        className="border-none bg-transparent p-0 text-xs text-foreground focus:outline-none"
        aria-label="To date"
      />
    </div>
  );
}
