import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import JsonLd from "@/components/seo/JsonLd";
import GoogleTagManager from "@/components/seo/GoogleTagManager";
import WhatsAppTracker from "@/components/seo/WhatsAppTracker";
import { SITE, PRIMARY_KEYWORDS } from "@/lib/seo";
import { getReviews } from "@/lib/google-reviews";

// MyEjari's GTM container — handles GA4 (G-KG7L9EK7H9) and the Google Ads
// conversion (ID 16933501253, label OA1zCJONsasaEMXywoo_) via the existing
// Click URL trigger that fires when a link starting with
// https://api.whatsapp.com/ is clicked. All wa.me links on the site use the
// api.whatsapp.com canonical URL (see lib/contact.ts) so the trigger fires.
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-MBSNLQ4L";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Virtual Office Ejari Dubai in 30 Min | MyEjari",
    template: "%s | MyEjari — Virtual Office Ejari Dubai",
  },
  description: SITE.description,
  keywords: [...PRIMARY_KEYWORDS],
  authors: [{ name: "MyEjari", url: SITE.url }],
  creator: "MyEjari",
  publisher: "MyEjari",
  applicationName: "MyEjari",
  generator: "Next.js",
  category: "Business Services",
  openGraph: {
    type: "website",
    locale: "en_AE",
    url: SITE.url,
    siteName: SITE.name,
    title: "Virtual Office Ejari Dubai in 30 Min | MyEjari",
    description: SITE.description,
    images: [
      {
        url: SITE.ogImage,
        width: 1200,
        height: 630,
        alt: "MyEjari — Virtual Office Ejari Dubai",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Virtual Office Ejari Dubai in 30 Min | MyEjari",
    description:
      "Match with licensed business centers in Dubai and get your Ejari certificate the same day, all on WhatsApp.",
    images: [SITE.ogImage],
  },
  alternates: {
    canonical: SITE.url,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    title: "MyEjari",
    capable: true,
    statusBarStyle: "default",
  },
};

export const viewport = {
  themeColor: "#f15a24",
  width: "device-width",
  initialScale: 1,
};

function buildLocalBusinessLd(reviewBundle: Awaited<ReturnType<typeof getReviews>>) {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "ProfessionalService"],
    "@id": `${SITE.url}/#organization`,
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    image: `${SITE.url}${SITE.ogImage}`,
    logo: `${SITE.url}${SITE.ogImage}`,
    telephone: SITE.whatsapp,
    email: SITE.email,
    areaServed: [
      { "@type": "City", name: "Dubai" },
      { "@type": "Country", name: "United Arab Emirates" },
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dubai",
      addressRegion: "Dubai",
      addressCountry: "AE",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: SITE.whatsapp,
        contactType: "customer service",
        contactOption: "TollFree",
        availableLanguage: ["English", "Arabic"],
        areaServed: "AE",
      },
    ],
    sameAs: [SITE.facebook, SITE.instagram],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: reviewBundle.aggregate.rating.toFixed(1),
      bestRating: "5",
      reviewCount: reviewBundle.aggregate.count,
    },
    review: reviewBundle.allReviews.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.name },
      datePublished: r.datePublished,
      reviewBody: r.text,
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
    })),
    knowsAbout: [
      "Virtual Office Ejari",
      "Trade License Issuance",
      "Trade License Renewal",
      "Dubai Land Department Ejari",
      "Mainland Business Setup",
      "Free Zone Business Setup",
    ],
    serviceType: "Virtual Office Ejari for Trade License",
  };
}

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE.url}/#website`,
  url: SITE.url,
  name: SITE.name,
  description: SITE.description,
  publisher: { "@id": `${SITE.url}/#organization` },
  inLanguage: "en-AE",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const reviewBundle = await getReviews();
  const localBusinessLd = buildLocalBusinessLd(reviewBundle);

  return (
    <html
      lang="en-AE"
      data-scroll-behavior="smooth"
      className={`${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <GoogleTagManager containerId={GTM_ID} />
        <WhatsAppTracker />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppButton />
        <JsonLd data={[localBusinessLd, websiteLd]} />
      </body>
    </html>
  );
}
