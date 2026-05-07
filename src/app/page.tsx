import Hero from "@/components/home/Hero";
import TrustBar from "@/components/home/TrustBar";
import GoogleReviews from "@/components/home/GoogleReviews";
import HowItWorks from "@/components/home/HowItWorks";
import WhyMyEjari from "@/components/home/WhyMyEjari";
import FAQ from "@/components/home/FAQ";
import CTABanner from "@/components/home/CTABanner";
import JsonLd from "@/components/seo/JsonLd";
import { faqs } from "@/lib/faqs";
import { SITE } from "@/lib/seo";
import { getReviews } from "@/lib/google-reviews";

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.answer,
    },
  })),
};

const serviceLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Virtual Office Ejari for Trade License",
  provider: { "@id": `${SITE.url}/#organization` },
  areaServed: { "@type": "City", name: "Dubai" },
  audience: {
    "@type": "BusinessAudience",
    audienceType:
      "Founders, freelancers, and SMEs setting up or renewing a trade license in Dubai",
  },
  description:
    "MyEjari connects you with DLD-licensed business centers in Dubai to issue or renew a Virtual Office Ejari for your trade license. Same-day issuance, all on WhatsApp.",
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "MyEjari services",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "New Virtual Office Ejari",
          description:
            "Match with a licensed business center to issue a fresh Ejari certificate for new trade license applications in Dubai.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Ejari renewal for trade license",
          description:
            "Renew your existing Ejari for trade license renewal across Dubai mainland and free zones.",
        },
      },
    ],
  },
};

const howToLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to get a Virtual Office Ejari in Dubai with MyEjari",
  description:
    "Three steps to get a Virtual Office Ejari for trade license issuance or renewal in Dubai — all on WhatsApp.",
  totalTime: "PT30M",
  inLanguage: "en-AE",
  supply: [
    { "@type": "HowToSupply", name: "Existing trade license (for renewal)" },
    {
      "@type": "HowToSupply",
      name: "Initial Approval and Trade Name Reservation (for new issuance)",
    },
  ],
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Message MyEjari on WhatsApp",
      text: "Tell us your trade license type and business activity. Takes a minute, no forms required.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "We find your match",
      text: "Anywhere across Dubai — we line up verified options that fit your activity.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Get your Ejari, same day",
      text: "Drop your documents in the chat and the certificate lands inside 30 minutes.",
    },
  ],
};

export default async function Home() {
  const reviewBundle = await getReviews();

  return (
    <>
      <Hero />
      <TrustBar />
      <GoogleReviews
        reviews={reviewBundle.reviews}
        additionalReviews={reviewBundle.additionalReviews}
        aggregate={reviewBundle.aggregate}
      />
      <HowItWorks />
      <WhyMyEjari />
      <FAQ />
      <CTABanner />
      <JsonLd data={[faqLd, serviceLd, howToLd]} />
    </>
  );
}
