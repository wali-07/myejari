// Resolve the site's canonical URL at build time. Order of preference:
//   1. NEXT_PUBLIC_SITE_URL — explicit override, set per environment in Vercel.
//      Use this on the staging deployment so OG/canonical/JSON-LD URLs
//      resolve to the live Vercel host (myejari-web.vercel.app) instead of
//      the production .ae domain (which still serves the old site until
//      DNS cutover).
//   2. https://myejari.ae — the production canonical, used after DNS
//      cutover when the env var is unset (or set to the .ae URL).
// The NEXT_PUBLIC_ prefix lets this string be inlined into the client
// bundle, so client components that import SITE.url get the right value
// without re-reading process.env at runtime.
const RESOLVED_SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://myejari.ae"
).replace(/\/$/, "");

export const SITE = {
  name: "MyEjari",
  url: RESOLVED_SITE_URL,
  description:
    "Get your Virtual Office Ejari in Dubai in 30 min. MyEjari matches you with licensed business centers across Dubai for fast trade license issuance and renewal — all on WhatsApp.",
  whatsapp: "+971585540076",
  email: "admin@myejari.com",
  ogImage: "/opengraph-image",
  facebook: "https://www.facebook.com/profile.php?id=61572952420935",
  instagram: "https://www.instagram.com/myejari/",
} as const;

export const PRIMARY_KEYWORDS = [
  "virtual office ejari dubai",
  "ejari dubai",
  "virtual ejari",
  "ejari for trade license",
  "trade license ejari dubai",
  "ejari renewal dubai",
  "ejari issuance dubai",
  "business center ejari",
  "free zone ejari",
  "mainland ejari",
  "dubai trade license",
  "dld ejari",
  "ejari certificate dubai",
] as const;
