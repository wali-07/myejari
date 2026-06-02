/**
 * Public invoice share tokens.
 *
 * A customer should be able to open the invoice PDF from a link the admin
 * sends them WITHOUT logging into the MyEjari admin app. We don't want the
 * invoice fully public either (the URL would be guessable: `INV0123`,
 * `INV0124`, …). So the public `/invoice/[invoice]` route is gated by an
 * HMAC token derived from the invoice number and the shared session secret.
 *
 *   - Anyone holding the link can view the PDF — no account, no login.
 *   - Nobody can forge a link for an invoice they weren't given, because the
 *     token is an HMAC they can't compute without the server secret.
 *
 * The token is deterministic (no expiry), so the same invoice always yields
 * the same link — safe to copy, resend, or bookmark.
 */
import { hmacBase64, safeEqual } from "./auth";

function payload(invoice: string): string {
  return `invoice-share:${invoice.trim().toLowerCase()}`;
}

/** Sign a share token for an invoice number. Returns a base64url string. */
export async function signInvoiceToken(invoice: string): Promise<string> {
  return hmacBase64(payload(invoice));
}

/** Verify a share token against an invoice number. */
export async function verifyInvoiceToken(
  invoice: string,
  token: string | undefined
): Promise<boolean> {
  if (!token) return false;
  const expected = await hmacBase64(payload(invoice));
  return safeEqual(expected, token);
}
