import Script from "next/script";

interface Props {
  containerId: string;
}

/**
 * Loads GTM if a container ID is provided. Renders nothing without one
 * (e.g., local dev without env var). Use Next.js `next/script` for SSR
 * compatibility and proper hydration order.
 */
export default function GoogleTagManager({ containerId }: Props) {
  if (!containerId) return null;

  return (
    <>
      <Script
        id="gtm-base"
        strategy="afterInteractive"
      >{`
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${containerId}');
      `}</Script>

      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${containerId}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
    </>
  );
}
