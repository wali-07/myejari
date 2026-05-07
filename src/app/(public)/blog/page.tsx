import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, Sparkles } from "lucide-react";
import { getAllPosts } from "@/lib/posts";
import JsonLd from "@/components/seo/JsonLd";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { whatsappLink } from "@/lib/contact";
import { SITE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Ejari Dubai Blog — Trade License & Business Setup Guides",
  description:
    "Practical, plain-English guides on Virtual Office Ejari, trade license issuance and renewal, mainland and free zone setup, and doing business in Dubai. Written by the team at MyEjari.",
  alternates: { canonical: `${SITE.url}/blog` },
  openGraph: {
    type: "website",
    title: "Ejari Dubai Blog — Trade License & Business Setup Guides",
    description:
      "Plain-English guides on Virtual Office Ejari, trade licenses, and running a business in Dubai.",
    url: `${SITE.url}/blog`,
    siteName: SITE.name,
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const [featured, ...rest] = posts;

  const blogLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${SITE.url}/blog#blog`,
    name: "MyEjari Blog",
    description:
      "Guides on Virtual Office Ejari, trade license issuance and renewal, and doing business in Dubai.",
    url: `${SITE.url}/blog`,
    publisher: { "@id": `${SITE.url}/#organization` },
    inLanguage: "en-AE",
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      description: p.description,
      datePublished: p.date,
      dateModified: p.dateModified ?? p.date,
      url: `${SITE.url}/blog/${p.slug}`,
      author: { "@id": `${SITE.url}/#organization` },
      publisher: { "@id": `${SITE.url}/#organization` },
      keywords: p.keywords?.join(", "),
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${SITE.url}/blog`,
      },
    ],
  };

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-light to-white px-6 pt-20 pb-14">
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-amber/15 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-dark backdrop-blur">
            <Sparkles size={12} /> MyEjari Guides
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Virtual Office Ejari in Dubai —{" "}
            <span className="text-gradient-aurora">guides & resources</span>
          </h1>
          <p className="mt-5 text-lg text-gray">
            Plain-English guides on Ejari Dubai, trade license issuance and
            renewal, and the differences between mainland and free zone setup.
            Written by people who do this every day.
          </p>

          {/* Hero-level WhatsApp CTA — funnels readers who already know what they want */}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href={whatsappLink("getEjari")}
              target="_blank"
              rel="noopener noreferrer"
              data-track="whatsapp"
              data-source="blog_index_hero"
              className="group inline-flex items-center gap-2.5 rounded-full bg-foreground px-6 py-3.5 text-sm font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-primary"
            >
              <WhatsAppIcon size={16} />
              Get my Ejari on WhatsApp
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </a>
            <p className="text-xs text-gray">Replies usually within minutes</p>
          </div>
        </div>
      </section>

      {/* ── Posts ────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          {featured && (
            <Link
              href={`/blog/${featured.slug}`}
              className="group relative mb-16 block overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-primary to-primary-dark p-10 text-white transition-shadow hover:shadow-2xl hover:shadow-primary/20 sm:p-14"
            >
              <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-amber/30 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-coral/20 blur-3xl" />

              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">
                  <Sparkles size={12} /> Featured · {featured.category}
                </span>
                <h2 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl">
                  {featured.title}
                </h2>
                <p className="mt-4 max-w-2xl text-white/85 leading-relaxed">
                  {featured.description}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/70">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={14} />
                    <time dateTime={featured.dateModified ?? featured.date}>
                      {formatDate(featured.dateModified ?? featured.date)}
                    </time>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={14} /> {featured.readingTime}
                  </span>
                </div>
                <span className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold transition-transform group-hover:translate-x-1">
                  Read article <ArrowRight size={16} />
                </span>
              </div>
            </Link>
          )}

          <div className="grid gap-8 md:grid-cols-2">
            {rest.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-2xl border border-border/50 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
              >
                <span className="inline-block w-fit rounded-full bg-primary-light px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  {post.category}
                </span>
                <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                  {post.title}
                </h2>
                <p className="mt-3 flex-1 text-gray leading-relaxed">
                  {post.description}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={14} />
                    <time dateTime={post.dateModified ?? post.date}>
                      {formatDate(post.dateModified ?? post.date)}
                    </time>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={14} /> {post.readingTime}
                  </span>
                </div>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-transform group-hover:translate-x-1">
                  Read article <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>

          {/* Mid-list WhatsApp CTA strip — keeps the conversion path open
              even for readers who scroll without clicking through */}
          <div className="mt-16 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary-light via-white to-amber/10 p-8 sm:p-10">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Don&apos;t want to read? We&apos;ll just sort it.
                </h2>
                <p className="mt-2 max-w-xl text-base text-gray-dark">
                  Tell us your activity and your timeline on WhatsApp — we line
                  up a licensed business center and issue your Virtual Office
                  Ejari, usually the same day.
                </p>
              </div>
              <a
                href={whatsappLink("getEjari")}
                target="_blank"
                rel="noopener noreferrer"
                data-track="whatsapp"
                data-source="blog_index_mid"
                className="group inline-flex shrink-0 items-center gap-2.5 rounded-full bg-foreground px-6 py-3.5 text-sm font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-primary"
              >
                <WhatsAppIcon size={16} />
                Chat with us
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </a>
            </div>
          </div>
        </div>
      </section>

      <JsonLd data={[blogLd, breadcrumbLd]} />
    </>
  );
}
