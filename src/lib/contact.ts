export const WHATSAPP_NUMBER = "971585540076";

// Canonical api.whatsapp.com URL — required by the existing GTM trigger
// (Click URL starts with https://api.whatsapp.com/) which fires the
// Google Ads conversion + GA4 event for WhatsApp clicks.
const BASE = "https://api.whatsapp.com/send";

export const WHATSAPP_MESSAGES = {
  default: "Hi MyEjari, I'd like to know more about Virtual Office Ejari.",
  getEjari:
    "Hi MyEjari, I'd like to get a Virtual Office Ejari for my trade license.",
  renewal: "Hi MyEjari, I need help renewing my trade license / Ejari.",
  general: "Hi MyEjari, I have a question about your service.",
} as const;

export function whatsappLink(
  message: keyof typeof WHATSAPP_MESSAGES | string = "default"
): string {
  const text =
    message in WHATSAPP_MESSAGES
      ? WHATSAPP_MESSAGES[message as keyof typeof WHATSAPP_MESSAGES]
      : message;
  const params = new URLSearchParams({
    phone: WHATSAPP_NUMBER,
    text,
  });
  return `${BASE}?${params.toString()}`;
}
