import type { LucideIcon } from "lucide-react";

interface KpiTileProps {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  tone?: "primary" | "neutral" | "success" | "warning";
}

const TONE_CLASSES: Record<NonNullable<KpiTileProps["tone"]>, string> = {
  primary: "bg-primary-light text-primary",
  neutral: "bg-gray-light text-foreground/70",
  success: "bg-success/15 text-success",
  warning: "bg-amber/15 text-amber",
};

// Layout: label + icon on the top row, value below using the full card
// width. Keeps long AED amounts (e.g. "AED 296,205") on a single line on
// every viewport instead of wrapping a single digit onto its own line.
export default function KpiTile({
  label,
  value,
  sub,
  icon: Icon,
  tone = "neutral",
}: KpiTileProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-gray sm:text-xs">
          {label}
        </p>
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 ${TONE_CLASSES[tone]}`}
        >
          <Icon size={14} strokeWidth={2.2} className="sm:hidden" />
          <Icon
            size={18}
            strokeWidth={2.2}
            className="hidden sm:inline-block"
          />
        </span>
      </div>
      <p className="mt-3 truncate whitespace-nowrap text-xl font-semibold tracking-tight tabular-nums text-foreground sm:mt-4 sm:text-2xl lg:text-3xl">
        {value}
      </p>
      {sub && <p className="mt-1.5 truncate text-xs text-gray-dark">{sub}</p>}
    </div>
  );
}
