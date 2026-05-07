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

export default function KpiTile({
  label,
  value,
  sub,
  icon: Icon,
  tone = "neutral",
}: KpiTileProps) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-gray sm:text-xs">
            {label}
          </p>
          <p className="mt-2 break-words text-xl font-semibold tracking-tight tabular-nums text-foreground sm:mt-3 sm:text-2xl lg:text-3xl">
            {value}
          </p>
          {sub && (
            <p className="mt-1.5 text-xs text-gray-dark">{sub}</p>
          )}
        </div>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${TONE_CLASSES[tone]}`}
        >
          <Icon size={16} strokeWidth={2.2} className="sm:hidden" />
          <Icon
            size={18}
            strokeWidth={2.2}
            className="hidden sm:inline-block"
          />
        </span>
      </div>
    </div>
  );
}
