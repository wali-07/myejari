import type { MonthlyBucket } from "@/lib/admin/orders";
import { formatAED } from "@/lib/admin/format";

interface Props {
  data: MonthlyBucket[];
  /** Which series to plot — 'gmv' = customer-paid, 'profit' = final profit. */
  metric?: "gmv" | "profit";
  height?: number;
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function shortMonth(yyyymm: string): string {
  const [, m] = yyyymm.split("-").map(Number);
  return MONTH_LABELS[(m ?? 1) - 1] ?? yyyymm;
}

// Bars-with-y-axis SVG chart. No JS chart lib — keeps the bundle tight and
// gives precise control over the look. Scales linearly from zero to the
// max value in the series, with three reference grid lines.
export default function MonthlyTrendChart({
  data,
  metric = "gmv",
  height = 180,
}: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-[180px] items-center justify-center rounded-xl border border-dashed border-border/70 bg-gray-light/30 text-sm text-gray">
        No data in this range.
      </div>
    );
  }

  const values = data.map((d) => (metric === "gmv" ? d.gmv : d.profit));
  const max = Math.max(1, ...values);
  const total = values.reduce((s, v) => s + v, 0);

  const w = 680;
  const h = height;
  const padLeft = 56;
  const padRight = 12;
  const padTop = 20;
  const padBottom = 28;
  const chartW = w - padLeft - padRight;
  const chartH = h - padTop - padBottom;

  const barGap = 6;
  const barW = Math.max(8, (chartW - barGap * (data.length - 1)) / data.length);

  const yTicks = [0, 0.5, 1].map((f) => ({
    f,
    value: max * f,
    y: padTop + chartH - chartH * f,
  }));

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray">
          {metric === "gmv" ? "Monthly GMV" : "Monthly profit"}
        </p>
        <p className="text-xs text-gray-dark">
          Total: <span className="font-semibold text-foreground">{formatAED(total)}</span>
        </p>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-auto w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label="Monthly trend"
      >
        {/* Grid lines */}
        {yTicks.map((t) => (
          <g key={t.f}>
            <line
              x1={padLeft}
              x2={w - padRight}
              y1={t.y}
              y2={t.y}
              stroke="currentColor"
              className="text-border"
              strokeWidth={1}
              strokeDasharray={t.f === 0 ? "0" : "3 4"}
            />
            <text
              x={padLeft - 8}
              y={t.y + 4}
              textAnchor="end"
              className="fill-gray text-[10px] tabular-nums"
            >
              {t.value >= 1000
                ? `${Math.round(t.value / 1000)}k`
                : Math.round(t.value).toString()}
            </text>
          </g>
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const v = metric === "gmv" ? d.gmv : d.profit;
          const barH = (Math.max(0, v) / max) * chartH;
          const x = padLeft + i * (barW + barGap);
          const y = padTop + chartH - barH;
          return (
            <g key={d.month}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(barH, 2)}
                rx={3}
                className="fill-primary"
                opacity={0.9}
              >
                <title>{`${d.month}\n${formatAED(v)} · ${d.orders} orders`}</title>
              </rect>
              <text
                x={x + barW / 2}
                y={h - 8}
                textAnchor="middle"
                className="fill-gray text-[10px]"
              >
                {shortMonth(d.month)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
