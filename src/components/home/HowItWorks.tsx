"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { MessageSquare, ListChecks, FileCheck2, ArrowRight } from "lucide-react";
import { whatsappLink } from "@/lib/contact";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";

const steps = [
  {
    number: "01",
    title: "Message us on WhatsApp",
    description:
      "Tell us your trade license type and activity. Takes a minute, no forms required.",
    icon: <MessageSquare size={22} strokeWidth={2.2} />,
  },
  {
    number: "02",
    title: "We find your match",
    description:
      "Anywhere across Dubai — we line up verified options that fit your activity.",
    icon: <ListChecks size={22} strokeWidth={2.2} />,
  },
  {
    number: "03",
    title: "Get your Ejari, same day",
    description:
      "Drop your docs in the chat and your certificate lands inside 30 minutes.",
    icon: <FileCheck2 size={22} strokeWidth={2.2} />,
  },
];

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-gray-light px-6 py-20 sm:py-24"
    >
      {/* Subtle dot grid */}
      <div className="absolute inset-0 bg-dots opacity-50" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary-light/60 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-dark"
          >
            How it works
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-5 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
          >
            Three steps. <span className="text-gradient-aurora">No paperwork.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg text-gray"
          >
            From your first WhatsApp message to a stamped Ejari certificate.
          </motion.p>
        </div>

        {/* Steps — horizontally scrollable on mobile (first card aligned with content), grid on desktop */}
        <div className="relative mt-12 -mr-6 md:mr-0">
          {/* Connecting line (desktop only) */}
          <motion.div
            className="pointer-events-none absolute left-0 right-0 top-9 hidden h-px md:block"
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
            style={{ transformOrigin: "left" }}
          >
            <div className="mx-[12%] h-px bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10" />
          </motion.div>

          <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pr-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:overflow-visible md:pr-0 md:pb-0">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: 0.15 + i * 0.12 }}
                className="group relative w-[80%] shrink-0 snap-start rounded-3xl border border-border bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft md:w-auto md:shrink"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light text-primary ring-1 ring-primary/15">
                    {step.icon}
                  </div>
                  <span className="text-3xl font-semibold tracking-tight text-foreground/10 transition-colors group-hover:text-foreground/20">
                    {step.number}
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-semibold tracking-tight text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Mobile swipe hint */}
          <p className="mt-2 text-center text-[11px] font-medium uppercase tracking-wider text-gray md:hidden">
            ← swipe to see all 3 steps →
          </p>
        </div>

        {/* Inline CTA — funnels people the moment they understand the flow */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-14 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <a
            href={whatsappLink("getEjari")}
            target="_blank"
            rel="noopener noreferrer"
            data-track="whatsapp"
            data-source="how_it_works"
            className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-foreground px-7 py-3.5 text-sm font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-primary"
          >
            <WhatsAppIcon size={16} />
            Get Ejari Now
            <ArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </a>
          <p className="text-xs text-gray">
            Replies usually within minutes
          </p>
        </motion.div>
      </div>
    </section>
  );
}
