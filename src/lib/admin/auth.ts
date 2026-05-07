/**
 * Admin authentication — single-account email/password gate with a signed,
 * HTTP-only session cookie. Designed to run in both Edge (middleware) and
 * Node runtimes by relying on Web Crypto for HMAC.
 *
 * Production hardening checklist (do before public deploy):
 *   - Set `ADMIN_PASSWORD` to a long random value via Vercel env vars
 *   - Set `SESSION_SECRET` to a high-entropy random string (≥32 bytes)
 *   - Consider switching to a hashed password (bcryptjs is edge-friendly)
 *   - Add a rate limiter on /api/admin/login
 */

export const SESSION_COOKIE_NAME = "mye_admin_session";
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

const DEFAULT_PASSWORD = "Ejari123!!!";
const DEFAULT_SECRET = "myejari-local-dev-session-secret-change-in-prod";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "admin@myejari.com")
  .trim()
  .toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? DEFAULT_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET ?? DEFAULT_SECRET;

// Refuse to authenticate in production if either secret is still the
// dev default. Stops a missed env-var from leaving the admin wide open
// after a Vercel deploy. Marketing site stays unaffected.
function isProductionMisconfigured(): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  return (
    ADMIN_PASSWORD === DEFAULT_PASSWORD || SESSION_SECRET === DEFAULT_SECRET
  );
}

/** Constant-time-ish equality for email/password comparison. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function verifyCredentials(email: string, password: string): boolean {
  if (isProductionMisconfigured()) {
    console.error(
      "[admin/auth] Refusing login: ADMIN_PASSWORD and/or SESSION_SECRET still at default values in production."
    );
    return false;
  }
  const normalizedEmail = email.trim().toLowerCase();
  return (
    safeEqual(normalizedEmail, ADMIN_EMAIL) &&
    safeEqual(password, ADMIN_PASSWORD)
  );
}

async function hmacBase64(message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  const bytes = new Uint8Array(sig);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

/** Sign a session token for the given email. Returns a base64url string. */
export async function signSession(email: string): Promise<string> {
  const expires = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = `${email.trim().toLowerCase()}|${expires}`;
  const sig = await hmacBase64(payload);
  return `${btoa(payload)
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")}.${sig}`;
}

/** Verify a session cookie. Returns the signed-in email or null. */
export async function verifySession(
  token: string | undefined
): Promise<string | null> {
  if (isProductionMisconfigured()) return null;
  if (!token) return null;
  try {
    const dot = token.indexOf(".");
    if (dot < 0) return null;
    const payloadB64 = token.slice(0, dot);
    const sig = token.slice(dot + 1);

    // Decode payload (base64url → standard base64)
    const padded = payloadB64
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(
        payloadB64.length + ((4 - (payloadB64.length % 4)) % 4),
        "="
      );
    const payload = atob(padded);
    const sep = payload.indexOf("|");
    if (sep < 0) return null;
    const email = payload.slice(0, sep);
    const expires = Number(payload.slice(sep + 1));
    if (!Number.isFinite(expires) || expires < Date.now()) return null;

    const expectedSig = await hmacBase64(payload);
    if (!safeEqual(expectedSig, sig)) return null;
    return email;
  } catch {
    return null;
  }
}
