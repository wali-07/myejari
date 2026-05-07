declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/**
 * Push a `whatsapp_click` event to dataLayer with the source location.
 * GTM picks this up via a Custom Event trigger named `whatsapp_click` and
 * forwards to GA4 + Google Ads as a conversion.
 */
export function trackWhatsAppClick(source: string): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "whatsapp_click",
    whatsapp_source: source,
  });
}
