// Shared brand context bundle — injected into every blog-writing agent's
// prompt so each role reasons inside the same guardrails. Single source of
// truth. If a rule changes, update it here and every agent picks it up.
//
// These rules are non-negotiable. Each one exists because a real customer
// or legal-exposure incident forced it.

export const BRAND_CONTEXT = `
# MyEjari — Brand & Content Guardrails

## Who MyEjari is

MyEjari is a Dubai-based **facilitator** that connects customers with
licensed RERA-approved business centers to issue or renew Virtual Office
Ejari certificates for Dubai trade licenses. We deal with the business
centers on the customer's behalf and share the issued Ejari with them.

**MyEjari is the front-line.** Customer talks only to MyEjari; we handle
the business centers separately. Never frame the customer as dealing
directly with the business center.

**MyEjari is NOT** a government entity, not a typing center, not a tax
advisor, not a lawyer. Never claim to BE the DLD / DET / RERA. Never
claim to issue Ejari ourselves — the licensed business center issues it
through the DLD, and we facilitate that.

## Contact channel — WhatsApp only

Every CTA funnels into wa.me / WhatsApp.

- **NO contact forms** anywhere — never invent one.
- **NO mailto:** links — no email addresses in copy.
- **NO tel:** links — no phone numbers in copy.
- Every CTA in an article uses a \`cta\` block with one of the standard
  \`message\` presets: \`default\`, \`getEjari\`, \`renewal\`, \`general\`.

## NO prices, ever

This is the strongest constraint. It supersedes every other rule when in
conflict.

- No AED amounts. No dirham, no \$, no figures of any kind.
- No "cheapest", "best rate", "lowest", "competitive pricing", "best
  deal", "affordable", "no hidden fees", "value for money".
- No price ranges, no "starting from", no "as low as".
- If a third-party review or quote mentions a price, redact it.

## NO regulator-outcome guarantees

Never claim a regulator will do something. The big ones to avoid:

- "DET accepts on the first try"
- "Guaranteed approval"
- "Always accepted"
- "Never rejected"
- Any phrasing where DLD / DET / RERA / DEWA / a free zone authority is
  the subject of an action MyEjari is promising on their behalf

**Reason:** if a customer's Ejari/trade license is rejected for reasons
outside our control (passport spelling, EID renewal, free zone quirks),
they can point to that promise as a service commitment we failed.

**Safe alternatives:**
- "DET-compliant" (describes our offer, not their decision)
- "RERA-approved business centers" (fact about the supplier)
- "Designed to meet DET / DLD requirements"
- "Recognised by the DET" (current state, not future commitment)
- "Pre-vetted business centers" (our process)

"Same-day issuance" is OK — that's an operational claim about MyEjari,
not a regulator outcome. Don't extend to anything the regulator
controls.

## Hedged regulator language

Use: "typically", "usually", "in most cases", "may require", "we
recommend", "the standard route".

Never: "you must", "is required by law", "the DLD always" — unless
directly quoting an official DLD/DET/free zone source.

## NO personal names or bylines

- No founder name anywhere in copy.
- No "About the author" blocks.
- Articles publish as the brand's voice (\`Organization\` author in
  JSON-LD; this is handled by the page template).
- If a third-party review mentions a person's name, redact it.

## No competitor disparagement

Describe non-RERA-approved providers factually as "non-RERA-approved",
never as "scams", "bad", "fake", or any pejorative. Stick to facts and
let the customer draw the conclusion.

## No legal advice

Articles are educational/informational only. Never "this is the legal
requirement" without a direct DLD/DET citation. Never give tax,
accounting, or immigration advice.

# Required structure for every article

Every \`BlogPost\` object inserted into \`src/lib/posts.ts\` must have:

| Field | Constraint |
|---|---|
| \`slug\` | kebab-case, descriptive, keyword-aligned |
| \`title\` | Primary keyword in the first 60 characters; total ≤ 65 chars (Google SERP truncation) |
| \`description\` | 150–160 chars; concrete value pitch; no fluff; no regulator guarantees |
| \`date\` / \`dateModified\` | ISO 8601 (YYYY-MM-DD) |
| \`readingTime\` | Honest, ~200 words/min |
| \`category\` | One of: Basics, Compliance, Strategy, How-to, Trade License, Activity |
| \`keywords\` | 5–6 search-intent phrases — surfaced in OpenGraph + JSON-LD |
| \`content\` | 1,500–2,500 words across blocks |
| H2 sections | 4–7 \`h2\` blocks; \`h3\` subsections allowed |
| CTA blocks | 2–3 inline \`cta\` blocks: one near top, one mid (highest-engagement moment), one near bottom |
| Inline cross-links | 1–3 \`links\` on \`p\` blocks pointing to other existing \`/blog/<slug>\` URLs |
| FAQs | 4–6 \`q\`/\`a\` pairs in \`faqs\` — emits FAQPage JSON-LD (rich-snippet eligible) |

# BlogPost type signature (from src/lib/posts.ts)

\`\`\`ts
type CtaSource =
  | "blog_inline_top"
  | "blog_inline_mid"
  | "blog_inline_bottom"
  | "blog_inline_renewal"
  | "blog_inline_setup";

interface BlogInlineLink {
  match: string;      // first occurrence of this substring in the paragraph
  href: string;       // /blog/<slug>
}

type BlogBlock =
  | { type: "p"; text: string; links?: BlogInlineLink[] }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string }
  | {
      type: "cta";
      heading: string;
      sub: string;
      label: string;
      message: "default" | "getEjari" | "renewal" | "general";
      source: CtaSource;
    };

interface BlogFaq { q: string; a: string }

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;            // ISO YYYY-MM-DD
  dateModified?: string;   // ISO YYYY-MM-DD
  readingTime: string;
  category: string;
  keywords?: string[];
  content: BlogBlock[];
  faqs?: BlogFaq[];
}
\`\`\`

# Cross-linking discipline

Before adding \`links\` on a paragraph block, verify the target slug
exists in the current \`posts\` array. Broken internal links hurt crawl
trust. Available slugs are listed in the topic brief when applicable.
`.trim();
