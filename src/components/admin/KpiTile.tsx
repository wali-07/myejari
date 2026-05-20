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

// Compact on mobile, generous on desktop. Mobile drops the icon since
// the colored badge isn't load-bearing — saves ~36px per tile.
export default function KpiTile({
  label,
  value,
  sub,
  icon: Icon,
  tone = "neutral",
}: KpiTileProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white p-3 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-gray sm:text-xs">
          {label}
        </p>
        <span
          className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:flex ${TONE_CLASSES[tone]}`}
        >
          <Icon size={18} strokeWidth={2.2} />
        </span>
      </div>
      <p className="mt-1.5 truncate whitespace-nowrap text-xl font-semibold tracking-tight tabular-nums text-foreground sm:mt-4 sm:text-2xl lg:text-3xl">
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 truncate text-[11px] text-gray-dark sm:mt-1.5 sm:text-xs">
          {sub}
        </p>
      )}
    </div>
  );
}
