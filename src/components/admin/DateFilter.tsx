import Link from "next/link";
import { dateRangePresets, type DateRangeKey } from "@/lib/admin/orders";
import CustomDateRange from "@/components/admin/CustomDateRange";

interface DateFilterProps {
  active: DateRangeKey | "custom";
  basePath?: string;
  /** Custom-range values when active = "custom". */
  customFrom?: string;
  customTo?: string;
  /** Other URL params to preserve when changing the date filter. */
  preserveParams?: Record<string, string | undefined>;
}

// Server component shell — preset chips + a client-side custom-range
// picker. Selecting a preset clears any custom from/to so the table
// snaps back to the preset window. Selecting custom dates clears the
// preset.
export default function DateFilter({
  active,
  basePath = "/admin",
  customFrom,
  customTo,
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
      <div className="inline-flex items-center rounded-full border border-border bg-white p-0.5 text-xs font-medium">
        {dateRangePresets().map((preset) => {
          const isActive = preset.key === active;
          return (
            <Link
              key={preset.key}
              href={buildHref(preset.key)}
              scroll={false}
              className={
                isActive
                  ? "rounded-full bg-foreground px-3 py-1.5 text-white"
                  : "rounded-full px-3 py-1.5 text-foreground/70 transition-colors hover:text-foreground"
              }
            >
              {preset.label}
            </Link>
          );
        })}
      </div>
      <CustomDateRange from={customFrom} to={customTo} />
    </div>
  );
}
