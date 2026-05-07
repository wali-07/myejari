"use client";

import { useEffect } from "react";

/**
 * Global click delegator that pushes a `whatsapp_click` event to dataLayer
 * whenever an element marked with `data-track="whatsapp"` is clicked.
 * Works for any anchor or button site-wide, including elements rendered
 * in server components (no onClick handler required).
 *
 * Each tracked element should also set `data-source="..."` (e.g. "hero",
 * "header", "cta_banner") so GA4 / Google Ads can attribute conversions
 * to the surface that drove them.
 */
export default function WhatsAppTracker() {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const el = target.closest<HTMLElement>('[data-track="whatsapp"]');
      if (!el) return;
      const source = el.getAttribute("data-source") || "unknown";
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "whatsapp_click",
        whatsapp_source: source,
      });
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () =>
      document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  return null;
}
