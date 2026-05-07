"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { whatsappLink } from "@/lib/contact";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";

export default function CTABanner() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="px-6 pb-20">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-primary via-primary-dark to-foreground px-8 py-16 sm:px-16 sm:py-20">
          {/* Static mesh — same rationale as Hero (mobile perf). */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-amber/40 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-coral/40 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10"
          />

          <div className="relative z-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md"
              >
                Same-day Ejari
              </motion.span>

              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl"
              >
                Ready to get your Ejari sorted?
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mt-4 max-w-xl text-lg text-white/75"
              >
                One WhatsApp message, one curated quote, one stamped
                certificate — usually inside the same business hour.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="mt-9 flex flex-col gap-3 sm:flex-row sm:gap-4"
              >
                <a
                  href={whatsappLink("getEjari")}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-track="whatsapp"
                  data-source="cta_banner_primary"
                  className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-white px-7 py-4 text-base font-semibold text-foreground shadow-xl transition-all hover:-translate-y-0.5 hover:bg-white/95"
                >
                  <WhatsAppIcon size={18} className="text-[#128C7E]" />
                  Chat with us
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </a>
                <a
                  href={whatsappLink("renewal")}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-track="whatsapp"
                  data-source="cta_banner_renewal"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 py-4 text-base font-semibold text-white backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/15"
                >
                  Renewing? Tap here
                </a>
              </motion.div>
            </div>

            {/* Side preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative ml-auto w-full max-w-xs rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366] text-white">
                    <WhatsAppIcon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">MyEjari</p>
                    <p className="text-[11px] text-white/55">
                      typically replies in minutes
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="rounded-2xl rounded-bl-sm bg-white/15 px-3 py-2 text-xs text-white">
                    Hi MyEjari, I&apos;d like a Virtual Office Ejari for my
                    trade license.
                  </div>
                  <div className="ml-4 rounded-2xl rounded-br-sm bg-success/30 px-3 py-2 text-xs text-white">
                    Welcome! Could you share your business activity so we can
                    line up the best quote for you?
                  </div>
                  <div className="rounded-2xl rounded-bl-sm bg-white/15 px-3 py-2 text-xs text-white">
                    Sure — trading and general consultancy.
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/60" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/60 [animation-delay:200ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/60 [animation-delay:400ms]" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
