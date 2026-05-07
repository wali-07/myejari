import Link from "next/link";
import { dateRangePresets, type DateRangeKey } from "@/lib/admin/orders";

interface DateFilterProps {
  active: DateRangeKey;
  /** Where filter clicks navigate to. Defaults to `/admin`. */
  basePath?: string;
  /** Other URL params to preserve when changing the date filter (e.g. q, payment). */
  preserveParams?: Record<string, string | undefined>;
}

// Server-side filter — clicking a preset just changes the URL search param;
// the page re-renders with the filtered metric set. No client state needed.
export default function DateFilter({
  active,
  basePath = "/admin",
  preserveParams,
}: DateFilterProps) {
  function buildHref(rangeKey: DateRangeKey) {
    const params = new URLSearchParams();
    if (rangeKey !== "all") params.set("range", rangeKey);
    if (preserveParams) {
      for (const [k, v] of Object.entries(preserveParams)) {
        if (v) params.set(k, v);
      }
    }
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {dateRangePresets().map((preset) => {
        const isActive = preset.key === active;
        return (
          <Link
            key={preset.key}
            href={buildHref(preset.key)}
            scroll={false}
            className={
              isActive
                ? "rounded-full bg-foreground px-3.5 py-1.5 text-xs font-semibold text-white"
                : "rounded-full border border-border bg-white px-3.5 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-primary/30 hover:text-foreground"
            }
          >
            {preset.label}
          </Link>
        );
      })}
    </div>
  );
}
