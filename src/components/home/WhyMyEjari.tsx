"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { whatsappLink } from "@/lib/contact";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";

const promises = [
  {
    title: "Licensed business centers",
    description:
      "Every provider on our roster is DLD-compliant and vetted by us — no middlemen, no surprises.",
  },
  {
    title: "All on WhatsApp",
    description:
      "Quotes, documents, certificate — one chat thread with us, from start to finish.",
  },
  {
    title: "Same-day issuance",
    description:
      "30-min turnaround once your documents are in. Not an upsell — that's the default.",
  },
  {
    title: "Transparency",
    description:
      "Clear options, clear trade-offs, clear next steps. No fine print, no hidden conditions.",
  },
  {
    title: "Support throughout",
    description:
      "We stay with you from your first message until the certificate is in your inbox — and after.",
  },
];

export default function WhyMyEjari() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-aurora-dark px-6 py-20 text-white sm:py-24"
    >
      {/* Static mesh blobs — see Hero.tsx for the perf rationale. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-32 h-[480px] w-[480px] rounded-full bg-primary/40 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-32 h-[520px] w-[520px] rounded-full bg-amber/30 blur-[120px]"
      />

      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-start gap-14 lg:grid-cols-[1fr_1.15fr]">
        {/* Text column */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="lg:sticky lg:top-28"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
            <Sparkles size={12} /> Built for founders
          </span>

          <h2 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            Why <span className="text-amber">MyEjari</span>?
          </h2>

          <p className="mt-5 text-lg leading-relaxed text-white/90">
            We&apos;re young, fresh, and straightforward — no fluff, no
            formalities.
          </p>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/70">
            We connect you with licensed business centers, making it easy to
            compare prices and choose the best option for your Ejari needs at
            the best rates.
          </p>

          <p className="mt-4 max-w-lg text-base leading-relaxed text-white/70">
            Think of us as your Ejari matchmakers, helping you find the right
            Virtual Office for a smooth, hassle-free process.
          </p>

          <a
            href={whatsappLink("getEjari")}
            target="_blank"
            rel="noopener noreferrer"
            data-track="whatsapp"
            data-source="why_myejari"
            className="group mt-9 inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-foreground shadow-xl transition-all hover:-translate-y-0.5"
          >
            <WhatsAppIcon size={16} className="text-[#128C7E]" />
            Chat with us
            <ArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </a>
        </motion.div>

        {/* Promises — clean numbered list, no nested boxes */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
            Our promises
          </span>
          <h3 className="mt-3 text-xl font-semibold leading-tight tracking-tight text-white sm:text-2xl">
            What we&apos;ll never compromise on.
          </h3>

          <ul className="mt-8 divide-y divide-white/10">
            {promises.map((p, i) => (
              <motion.li
                key={p.title}
                initial={{ opacity: 0, y: 8 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.25 + i * 0.07 }}
                className="grid grid-cols-[auto_1fr] items-start gap-5 py-5 first:pt-0"
              >
                <span className="font-mono text-sm font-semibold tracking-tight text-amber">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h4 className="text-base font-semibold text-white sm:text-lg">
                    {p.title}
                  </h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/65 sm:text-[15px]">
                    {p.description}
                  </p>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
