import type { Metadata } from "next";
import WhatsAppCTA from "@/components/contact/WhatsAppCTA";
import JsonLd from "@/components/seo/JsonLd";
import { SITE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Contact MyEjari on WhatsApp — Virtual Office Ejari Dubai",
  description:
    "Chat with MyEjari on WhatsApp for help with Virtual Office Ejari in Dubai, trade license issuance, and renewal. Fast replies, no forms.",
  alternates: { canonical: `${SITE.url}/contact` },
  openGraph: {
    type: "website",
    title: "Contact MyEjari on WhatsApp — Virtual Office Ejari Dubai",
    description:
      "Chat with MyEjari on WhatsApp for help with Ejari in Dubai. Fast replies, no forms.",
    url: `${SITE.url}/contact`,
  },
};

const contactLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "@id": `${SITE.url}/contact#contact`,
  name: "Contact MyEjari",
  url: `${SITE.url}/contact`,
  description:
    "WhatsApp is MyEjari's primary contact channel for Virtual Office Ejari, trade license issuance, and renewal in Dubai.",
  mainEntity: { "@id": `${SITE.url}/#organization` },
  inLanguage: "en-AE",
};

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
    {
      "@type": "ListItem",
      position: 2,
      name: "Contact",
      item: `${SITE.url}/contact`,
    },
  ],
};

export default function ContactPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-light to-white px-6 pt-20 pb-16">
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/2 -right-48 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Contact MyEjari for Virtual Office Ejari in{" "}
            <span className="text-gradient-aurora">Dubai</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-gray">
            We do all our customer conversations on WhatsApp — it&apos;s
            faster, easier to share documents, and you keep the full thread
            from quote to certificate. Tap the button below to start a chat.
          </p>
        </div>
      </section>

      <WhatsAppCTA />

      <JsonLd data={[contactLd, breadcrumbLd]} />
    </>
  );
}
