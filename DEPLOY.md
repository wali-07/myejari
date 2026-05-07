# MyEjari — Deploy Cheatsheet

One-page reference for getting the new Next.js site live on Vercel while domains stay at Hostinger and email keeps working.

## Topology

| Concern  | Where                                           |
| -------- | ----------------------------------------------- |
| Domains  | Registered at **Hostinger**                     |
| DNS      | Managed at **Hostinger**                        |
| Web      | Hosted on **Vercel** (this repo)                |
| Email    | Hosted on **Hostinger** — MX records load-bearing |
| Canonical| `myejari.ae` (`.com` redirects to `.ae`)        |

## Phase 1 — Push to GitHub

```bash
git status                    # confirm clean working tree
git remote add origin <repo>  # e.g. git@github.com:<you>/myejari-web.git
git push -u origin main
```

## Phase 2 — Connect Vercel

1. vercel.com → "Add New Project" → Import the GitHub repo
2. Framework: Next.js (auto-detected). Leave defaults.
3. Project → Settings → **Environment Variables** — copy from `.env.example`.
   For dev only, leave `GOOGLE_PLACES_*` blank — site falls back to curated reviews.
4. Click Deploy. You'll get a preview URL like `myejari-xxx.vercel.app`.

## Phase 3 — QA on the Vercel preview URL

- [ ] Click through all pages (home, blog index, 5 articles, contact, privacy, terms, hit any 404)
- [ ] Legacy redirects: `…vercel.app/virtual-office-ejari-dubai` → 308 → `/blog/virtual-office-ejari-dubai` (also try the other 4 legacy slugs and `/privacy-policy`, `/blog-virtual-office-ejari-dubai`)
- [ ] Every "Chat with us" CTA opens `wa.me/971585540076`
- [ ] Mobile QA on a real phone
- [ ] Each article's OG image renders unique at `…/blog/<slug>/opengraph-image` (paste the article URL into https://www.opengraph.xyz/)
- [ ] Lighthouse score ≥90 across all four metrics
- [ ] GTM/GA4 firing (Google Tag Assistant Companion extension)
- [ ] `/sitemap.xml` and `/robots.txt` accessible
- [ ] Rich Results Test passes for an article: https://search.google.com/test/rich-results
- [ ] 21 reviews on home; sr-only block contains the additional 17

## Phase 4 — DNS prep (24–48h before cutover)

In **Hostinger DNS panel** for both `myejari.ae` and `myejari.com`:

1. Screenshot every record (rollback baseline). Specifically:
   - All `A` / `AAAA` records
   - All `CNAME` records (`www`, etc.)
   - All `MX` records (**EMAIL — DO NOT MODIFY**)
   - All `TXT` records (SPF, DKIM, DMARC, GSC verification — **DO NOT MODIFY**)
   - Any `CAA` records
2. Lower **TTL** on the apex `A` record and the `www` `CNAME` to **300** (5 min) on both domains.
3. In Vercel → Project → Domains → **Add** `myejari.ae`, then add `myejari.com`. Vercel shows the exact records to set.
4. In Vercel → Domains → for `myejari.com`, set it to **redirect to** `myejari.ae` (Vercel has a built-in redirect setting).

## Phase 5 — Cutover

Pick a low-traffic window (early morning UAE time, weekday).

In Hostinger DNS for **`myejari.ae`**:

```
A     @    76.76.21.21              (Vercel — confirm in Vercel's domain panel)
CNAME www  cname.vercel-dns.com.    (with the trailing dot if Hostinger requires)
```

In Hostinger DNS for **`myejari.com`**: same two records.

**LEAVE UNCHANGED:** all `MX`, `SPF`, `DKIM`, `DMARC` `TXT` records, GSC verification `TXT` records, `CAA` records.

Wait 5–15 min for propagation (TTL is 300s). Vercel auto-provisions SSL within a couple of minutes after the records resolve.

## Phase 6 — Smoke test (within 5 min of cutover)

- [ ] `https://myejari.ae` loads the new site in incognito
- [ ] `https://myejari.com` 308-redirects to `https://myejari.ae`
- [ ] Each legacy URL 308-redirects to its `/blog/<slug>` equivalent
- [ ] Send yourself a test email at `admin@myejari.com` from Gmail → confirm received
- [ ] Open Vercel → Logs → no 500-class errors
- [ ] Hit any of the legacy URLs in browser, confirm they 308 to `/blog/<slug>`

## Phase 7 — Search Console (within 24h)

1. Google Search Console → property `myejari.ae` (existing property — verification TXT is preserved)
2. Sitemaps → submit `https://myejari.ae/sitemap.xml`
3. URL Inspection → for each new article, click "Request indexing"
4. Coverage → watch for new 404s over the next week. Anything legitimate gets added to `next.config.ts` redirects + redeployed.

## Phase 8 — Hold

- Keep TTL at 300s for **one week** post-launch
- Keep the old Hostinger web hosting plan active for **at least 2 weeks** as rollback safety
- Watch GA4 for traffic continuity (no sudden drops)

## Rollback

If something breaks badly within 24h:

1. Hostinger DNS → restore the original `A` and `CNAME` records (from the screenshots)
2. Within 5–15 min traffic flips back to the old site
3. Old site is untouched throughout — it just resumes serving
