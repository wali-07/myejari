import { ArrowRight } from "lucide-react";
import { whatsappLink } from "@/lib/contact";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";

interface InlineCTAProps {
  heading: string;
  sub: string;
  label: string;
  message: "default" | "getEjari" | "renewal" | "general";
  source: string;
}

export default function InlineCTA({
  heading,
  sub,
  label,
  message,
  source,
}: InlineCTAProps) {
  return (
    <aside
      className="not-prose my-10 overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary-light via-white to-primary-light/40 p-6 shadow-soft sm:p-8"
      aria-label="Talk to MyEjari on WhatsApp"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-soft">
            <WhatsAppIcon size={20} />
          </span>
          <div>
            <p className="text-base font-semibold leading-tight text-foreground sm:text-lg">
              {heading}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-dark">
              {sub}
            </p>
          </div>
        </div>
        <a
          href={whatsappLink(message)}
          target="_blank"
          rel="noopener noreferrer"
          data-track="whatsapp"
          data-source={source}
          className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-primary"
        >
          <WhatsAppIcon size={14} />
          {label}
          <ArrowRight
            size={14}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </a>
      </div>
    </aside>
  );
}
