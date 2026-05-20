"use client";

import { useState } from "react";
import { BellRing, ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import type { RenewalEntry } from "@/lib/admin/orders";
import OrderDetailsModal from "@/components/admin/OrderDetailsModal";

interface Props {
  renewals: RenewalEntry[];
  week: { from: string; to: string };
  /** Known wholesalers — passed through to OrderDetailsModal's edit form. */
  wholesalers: string[];
}

const WEEKDAY_DAY_MONTH = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

const DAY_MONTH = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function shortWeekday(iso: string): string {
  return WEEKDAY_DAY_MONTH.format(parseIso(iso));
}

function shortRange(from: string, to: string): string {
  return `${DAY_MONTH.format(parseIso(from))} – ${DAY_MONTH.format(parseIso(to))}`;
}

function whatsappHref(mobile: string, company: string) {
  const digits = mobile.replace(/\D/g, "");
  const text =
    `Hello - hope all is well.\n\n` +
    `We can see that your Ejari for ${company} is up for renewal, and ` +
    `wanted to check if you would like to issue a new Ejari?\n\n` +
    `Looking forward to your update`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

interface RowProps {
  entry: RenewalEntry;
  wholesalers: string[];
}

// One renewal row. Tapping the info area opens the same OrderDetailsModal
// used by the orders table, so the admin can see who the wholesaler was,
// how much the customer paid, etc. before messaging. WhatsApp is a
// separate sibling click target on the right — it never opens the modal.
function RenewalRow({ entry, wholesalers }: RowProps) {
  const { order, renewalDate } = entry;
  const [detailsOpen, setDetailsOpen] = useState(false);
  const canWhatsapp =
    order.contactMobile.replace(/\D/g, "").length >= 7;

  return (
    <>
      <li className="flex items-center gap-2 px-1 py-1 sm:px-2">
        <button
          type="button"
          onClick={() => setDetailsOpen(true)}
          className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-amber/10"
          aria-label={`View details for ${order.company}`}
        >
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center whitespace-nowrap rounded-full bg-amber/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#a35a00] ring-1 ring-amber/30">
                {shortWeekday(renewalDate)}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-gray-dark">
                {order.invoice}
              </span>
            </div>
            <div className="line-clamp-2 text-sm font-medium leading-snug text-foreground group-hover:text-[#a35a00]">
              {order.company}
            </div>
          </div>
        </button>

        {canWhatsapp ? (
          <a
            href={whatsappHref(order.contactMobile, order.company)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`WhatsApp ${order.company}`}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/10 text-success ring-1 ring-success/20 transition-colors hover:bg-success/20 sm:h-auto sm:w-auto sm:gap-1.5 sm:px-3 sm:py-1 sm:text-xs sm:font-semibold"
          >
            <MessageCircle size={16} className="sm:h-3 sm:w-3" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        ) : (
          <span className="shrink-0 px-2 text-[10px] italic text-gray">
            no mobile
          </span>
        )}
      </li>

      {detailsOpen && (
        <OrderDetailsModal
          order={order}
          open
          onClose={() => setDetailsOpen(false)}
          wholesalers={wholesalers}
        />
      )}
    </>
  );
}

export default function RenewalsBanner({
  renewals,
  week,
  wholesalers,
}: Props) {
  const [open, setOpen] = useState(false);
  if (renewals.length === 0) return null;

  const count = renewals.length;
  const rangeLabel = shortRange(week.from, week.to);

  return (
    <section className="overflow-hidden rounded-2xl border border-amber/30 bg-amber/5 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-amber/10 sm:px-5"
        aria-expanded={open}
        aria-controls="renewals-list"
      >
        <span className="flex min-w-0 items-center gap-2.5 text-sm font-medium text-[#a35a00]">
          <BellRing size={16} className="shrink-0" />
          <span className="flex min-w-0 flex-col gap-0 sm:flex-row sm:items-baseline sm:gap-2">
            <span className="leading-tight">
              {count} {count === 1 ? "renewal" : "renewals"} due this week
            </span>
            <span className="text-[11px] font-normal leading-tight text-[#a35a00]/70 sm:text-xs">
              {rangeLabel}
            </span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#a35a00] sm:text-xs">
          <span className="hidden sm:inline">{open ? "Hide" : "Show"}</span>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {open && (
        <ul
          id="renewals-list"
          className="divide-y divide-amber/20 border-t border-amber/20 bg-white/60 px-2 py-1 sm:px-3"
        >
          {renewals.map((entry) => (
            <RenewalRow
              key={`${entry.order.invoice}-${entry.renewalDate}`}
              entry={entry}
              wholesalers={wholesalers}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
