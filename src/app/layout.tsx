import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { SITE, PRIMARY_KEYWORDS } from "@/lib/seo";

// Root layout — owns the html/body shell and shared font + metadata. Per-area
// chrome (marketing nav/footer/GTM, admin nav, etc.) lives in route-group
// child layouts so admin pages don't carry the marketing JSON-LD or analytics.
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-AE"
      data-scroll-behavior="smooth"
      className={`${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
