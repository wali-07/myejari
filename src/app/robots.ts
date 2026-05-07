import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

const SITE_URL = SITE.url;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
