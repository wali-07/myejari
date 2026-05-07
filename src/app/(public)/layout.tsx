import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import JsonLd from "@/components/seo/JsonLd";
import GoogleTagManager from "@/components/seo/GoogleTagManager";
import WhatsAppTracker from "@/components/seo/WhatsAppTracker";
import { SITE } from "@/lib/seo";
import { getReviews } from "@/lib/google-reviews";

// Public-facing chrome — wraps every marketing page (home, blog, contact,
// privacy, terms). Lives outside `app/admin/*` so the admin dashboard
// doesn't ship the LocalBusiness JSON-LD or fire GTM/GA events.
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-MBSNLQ4L";

function buildLocalBusinessLd(
  reviewBundle: Awaited<ReturnType<typeof getReviews>>
) {
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

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const reviewBundle = await getReviews();
  const localBusinessLd = buildLocalBusinessLd(reviewBundle);

  return (
    <>
      <GoogleTagManager containerId={GTM_ID} />
      <WhatsAppTracker />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppButton />
      <JsonLd data={[localBusinessLd, websiteLd]} />
    </>
  );
}
