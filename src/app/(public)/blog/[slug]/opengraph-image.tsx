import { ImageResponse } from "next/og";
import { getAllPosts, getPostBySlug } from "@/lib/posts";

// Static generation at build time → one PNG per article served from CDN.
// (Next 16 disallows `runtime = "edge"` together with `generateStaticParams`,
//  and we'd rather have the static PNGs.)
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Pre-generate one OG image per article at build time. With this in place
// every blog URL has a unique, branded social card AND a unique `image`
// value in its BlogPosting structured data — material for image search,
// Discover, and rich social previews.
export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export const alt = "MyEjari guide";

interface Props {
  params: Promise<{ slug: string }>;
}

// Pick a category-themed gradient pair so each article reads as visually
// distinct in feeds, while still living inside the brand palette.
function paletteForCategory(category: string): {
  from: string;
  to: string;
  accent: string;
} {
  const c = category.toLowerCase();
  if (c.includes("compliance"))
    return { from: "#1f1147", to: "#3b1d6e", accent: "#ffb547" };
  if (c.includes("strategy"))
    return { from: "#0d131a", to: "#3a1c47", accent: "#f15a24" };
  if (c.includes("how"))
    return { from: "#7d2818", to: "#f15a24", accent: "#ffd07a" };
  if (c.includes("trade"))
    return { from: "#11243b", to: "#0d6f7a", accent: "#ffb547" };
  // Basics / default
  return { from: "#f15a24", to: "#ffb547", accent: "#ffffff" };
}

export default async function OgImage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  const title = post?.title ?? "MyEjari Guide";
  const category = post?.category ?? "Guides";
  const { from, to, accent } = paletteForCategory(category);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
          padding: "72px",
          fontFamily: "system-ui, sans-serif",
          color: "#ffffff",
          position: "relative",
        }}
      >
        {/* Decorative blob */}
        <div
          style={{
            position: "absolute",
            top: -180,
            right: -180,
            width: 520,
            height: 520,
            borderRadius: "999px",
            background: accent,
            opacity: 0.18,
            filter: "blur(40px)",
            display: "flex",
          }}
        />

        {/* Top row: brand + category */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "10px 22px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.95)",
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: "#f15a24",
                display: "flex",
              }}
            />
            <div
              style={{
                fontSize: 30,
                fontWeight: 700,
                color: "#0d131a",
                letterSpacing: "-0.02em",
              }}
            >
              MyEjari
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 20px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.3)",
              fontSize: 22,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {category}
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 28,
            maxWidth: 1060,
          }}
        >
          <div
            style={{
              fontSize: title.length > 70 ? 64 : 76,
              fontWeight: 700,
              lineHeight: 1.06,
              letterSpacing: "-0.025em",
              color: "#ffffff",
              display: "flex",
            }}
          >
            {title}
          </div>

          <div
            style={{
              fontSize: 26,
              color: "rgba(255,255,255,0.75)",
              maxWidth: 900,
              display: "flex",
            }}
          >
            Plain-English Dubai Ejari guides — written by people who do this
            every day.
          </div>
        </div>

        {/* Footer URL */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 24,
            color: "rgba(255,255,255,0.85)",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: accent,
              display: "flex",
            }}
          />
          myejari.ae/blog/{slug}
        </div>
      </div>
    ),
    { ...size }
  );
}
