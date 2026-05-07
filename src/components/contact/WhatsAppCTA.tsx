"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Clock, FileText, Sparkles } from "lucide-react";
import { whatsappLink, WHATSAPP_MESSAGES } from "@/lib/contact";

const intents: {
  key: keyof typeof WHATSAPP_MESSAGES;
  title: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "getEjari",
    title: "Get a new Ejari",
    description:
      "Issuing a new trade license or starting fresh? Tap to start a chat with the right info pre-filled.",
    icon: <Sparkles size={24} />,
  },
  {
    key: "renewal",
    title: "Renew an existing license",
    description:
      "Trade license up for renewal? We'll line up your Ejari options.",
    icon: <FileText size={24} />,
  },
  {
    key: "general",
    title: "Just have a question",
    description:
      "Not sure where to start? Ask us anything about Ejari, free zones, or trade licensing.",
    icon: <Clock size={24} />,
  },
];

function WhatsAppGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.516 5.26l.36.572-1 3.654 3.612-.948.001.763zM17.36 14.5c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.496.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01a1.094 1.094 0 0 0-.793.372c-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.073.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413z" />
    </svg>
  );
}

export default function WhatsAppCTA() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        {/* Big primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#25D366] to-[#128C7E] p-10 text-center text-white sm:p-14"
        >
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/5" />

          <div className="relative z-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <WhatsAppGlyph size={32} />
            </div>
            <h2 className="mt-6 text-3xl font-bold sm:text-4xl">
              Chat with us
            </h2>
            <p className="mt-3 text-white/85 max-w-xl mx-auto">
              We typically reply within minutes during business hours, and the
              same thread carries through your full Ejari journey.
            </p>
            <a
              href={whatsappLink("default")}
              target="_blank"
              rel="noopener noreferrer"
              data-track="whatsapp"
              data-source="contact_main"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-[#128C7E] shadow-lg transition hover:-translate-y-0.5 hover:bg-white/95"
            >
              <WhatsAppGlyph />
              Chat with us on WhatsApp
            </a>
          </div>
        </motion.div>

        {/* Intent cards */}
        <div className="mt-12">
          <h3 className="text-center text-sm font-semibold uppercase tracking-wider text-foreground/45">
            Or pick what you need help with
          </h3>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            {intents.map((intent, i) => (
              <motion.a
                key={intent.key}
                href={whatsappLink(intent.key)}
                target="_blank"
                rel="noopener noreferrer"
                data-track="whatsapp"
                data-source={`contact_intent_${intent.key}`}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                className="group flex flex-col rounded-2xl border border-border/50 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  {intent.icon}
                </div>
                <h4 className="mt-5 text-lg font-semibold text-foreground">
                  {intent.title}
                </h4>
                <p className="mt-2 flex-1 text-sm text-foreground/55 leading-relaxed">
                  {intent.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-transform group-hover:translate-x-1">
                  Open WhatsApp →
                </span>
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
