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
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray">
            {label}
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground tabular-nums sm:text-3xl">
            {value}
          </p>
          {sub && (
            <p className="mt-1.5 text-xs text-gray-dark">{sub}</p>
          )}
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONE_CLASSES[tone]}`}
        >
          <Icon size={18} strokeWidth={2.2} />
        </span>
      </div>
    </div>
  );
}
