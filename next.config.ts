import type { NextConfig } from "next";

// Permanent (301) redirects from the legacy myejari.ae URL structure to the
// new /blog/* structure. These preserve any existing backlinks, search-engine
// rankings, and social shares pointing at the old paths.
//
// Add to this list any time the canonical path of a public page changes.
const legacyBlogRedirects = [
  "virtual-office-dubai",
  "virtual-office-ejari-dubai",
  "dubai-business-setup",
  "how-to-renew-ejari-dubai",
  "trade-license-renewal-dubai-virtual-office-ejari",
];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Legacy bare-slug article URLs → /blog/<slug>
      ...legacyBlogRedirects.map((slug) => ({
        source: `/${slug}`,
        destination: `/blog/${slug}`,
        permanent: true,
      })),
      // Malformed legacy URL (hyphen instead of /blog/ path separator).
      // Google indexed it and it accrued impressions on virtual-office
      // queries, so send it to the money article — not the blog index —
      // to consolidate that authority onto the page we want ranking.
      {
        source: "/blog-virtual-office-ejari-dubai",
        destination: "/blog/virtual-office-ejari-dubai",
        permanent: true,
      },
      // Legacy privacy URL → /privacy
      {
        source: "/privacy-policy",
        destination: "/privacy",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
