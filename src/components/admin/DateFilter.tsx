import Link from "next/link";
import { dateRangePresets, type DateRangeKey } from "@/lib/admin/orders";

interface DateFilterProps {
  active: DateRangeKey;
  /** Optional date-range labels to surface alongside the active filter. */
  rangeText?: string;
}

// Server-side filter — clicking a preset just changes the URL search param;
// the page re-renders with the filtered metric set. No client state needed.
export default function DateFilter({ active, rangeText }: DateFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {dateRangePresets().map((preset) => {
        const isActive = preset.key === active;
        const href = preset.key === "all" ? "/admin" : `/admin?range=${preset.key}`;
        return (
          <Link
            key={preset.key}
            href={href}
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
      {rangeText && (
        <span className="ml-2 text-xs text-gray">{rangeText}</span>
      )}
    </div>
  );
}
