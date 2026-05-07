import Link from "next/link";
import Image from "next/image";
import { whatsappLink } from "@/lib/contact";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { SITE } from "@/lib/seo";

function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  );
}

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

const resourceLinks = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-aurora-dark text-white">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          {/* Brand Column */}
          <div>
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/logo-white.png"
                alt="MyEjari logo"
                width={520}
                height={180}
                className="h-12 w-auto"
                priority={false}
              />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/65">
              Dubai&apos;s fastest path to a Virtual Office Ejari. We find you
              the right licensed business center and stay with you on
              WhatsApp from the first message until the certificate lands in
              your inbox.
            </p>

            <a
              href={whatsappLink("default")}
              target="_blank"
              rel="noopener noreferrer"
              data-track="whatsapp"
              data-source="footer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              <WhatsAppIcon size={16} />
              Chat on WhatsApp
            </a>
          </div>

          {/* Resources Column */}
          <div>
            <h3 className="mb-5 text-xs font-semibold uppercase tracking-wider text-white/45">
              Resources
            </h3>
            <ul className="space-y-3">
              {resourceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/75 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Follow Column */}
          <div>
            <h3 className="mb-5 text-xs font-semibold uppercase tracking-wider text-white/45">
              Follow
            </h3>
            <p className="text-sm leading-relaxed text-white/65">
              We hang out on Instagram and Facebook for tips on Dubai
              business setup.
            </p>
            <div className="mt-5 flex gap-3">
              <a
                href={SITE.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="MyEjari on Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition-all hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                <FacebookIcon size={16} />
              </a>
              <a
                href={SITE.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="MyEjari on Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition-all hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                <InstagramIcon size={16} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="mt-14 flex flex-col gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-white/50">
            MyEjari is a comparison platform. Ejari certificates are issued by
            licensed business centers, not by us.
          </p>
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} MyEjari. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
