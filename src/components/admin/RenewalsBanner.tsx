"use client";

import { useState } from "react";
import { BellRing, ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import type { RenewalEntry } from "@/lib/admin/orders";

interface Props {
  renewals: RenewalEntry[];
  week: { from: string; to: string };
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

export default function RenewalsBanner({ renewals, week }: Props) {
  const [open, setOpen] = useState(false);
  if (renewals.length === 0) return null;

  const count = renewals.length;

  return (
    <section className="overflow-hidden rounded-2xl border border-amber/30 bg-amber/5 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors hover:bg-amber/10"
      >
        <span className="flex items-center gap-2.5 text-sm font-medium text-[#a35a00]">
          <BellRing size={16} />
          <span>
            {count} {count === 1 ? "renewal" : "renewals"} due this week
            <span className="ml-2 text-xs font-normal text-[#a35a00]/70">
              ({shortRange(week.from, week.to)})
            </span>
          </span>
        </span>
        <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[#a35a00]">
          {open ? "Hide" : "Show"}
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {open && (
        <ul className="divide-y divide-amber/20 border-t border-amber/20 bg-white/60">
          {renewals.map(({ order, renewalDate }) => {
            const canWhatsapp = order.contactMobile.replace(/\D/g, "").length >= 7;
            return (
              <li
                key={`${order.invoice}-${renewalDate}`}
                className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-[#a35a00]">
                      {shortWeekday(renewalDate)}
                    </span>
                    <span className="truncate text-sm font-medium text-foreground">
                      {order.company}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-gray-dark">
                    {order.invoice} · issued {DAY_MONTH.format(parseIso(order.date))}{" "}
                    {parseIso(order.date).getFullYear()}
                  </div>
                </div>
                {canWhatsapp ? (
                  <a
                    href={whatsappHref(order.contactMobile, order.company)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success ring-1 ring-success/20 transition-colors hover:bg-success/20 sm:self-auto"
                  >
                    <MessageCircle size={12} />
                    WhatsApp
                  </a>
                ) : (
                  <span className="text-xs italic text-gray">no mobile</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
