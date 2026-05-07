import { ArrowRight, CheckCircle2 } from "lucide-react";
import { whatsappLink } from "@/lib/contact";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";

interface StickyCTAProps {
  /** WhatsApp message preset to use. */
  message: "default" | "getEjari" | "renewal" | "general";
  /** Source label for analytics (data-source attribute). */
  source?: string;
}

const bullets = [
  "Same-day Ejari issuance",
  "RERA-approved business centers",
  "We talk to the centers, you don't",
];

export default function StickyCTA({
  message,
  source = "blog_sticky_sidebar",
}: StickyCTAProps) {
  return (
    <aside
      aria-label="Get your Ejari on WhatsApp"
      className="sticky top-24 hidden w-full max-w-xs lg:block"
    >
      <div className="relative overflow-hidden rounded-3xl border border-border bg-white p-6 shadow-soft">
        <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#25D366]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#128C7E]">
            <WhatsAppIcon size={12} />
            On WhatsApp
          </span>

          <h3 className="mt-4 text-xl font-semibold leading-tight tracking-tight text-foreground">
            Get your Ejari sorted today.
          </h3>

          <p className="mt-2 text-sm leading-relaxed text-gray-dark">
            One chat. We match you with a licensed business center, register
            the Ejari, and deliver the certificate to you.
          </p>

          <ul className="mt-5 space-y-2.5">
            {bullets.map((b) => (
              <li
                key={b}
                className="flex items-start gap-2 text-sm text-foreground/80"
              >
                <CheckCircle2
                  size={16}
                  className="mt-0.5 shrink-0 text-primary"
                />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <a
            href={whatsappLink(message)}
            target="_blank"
            rel="noopener noreferrer"
            data-track="whatsapp"
            data-source={source}
            className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-primary"
          >
            <WhatsAppIcon size={14} />
            Chat with us
            <ArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </a>

          <p className="mt-3 text-center text-[11px] text-gray">
            Replies usually within minutes
          </p>
        </div>
      </div>
    </aside>
  );
}
