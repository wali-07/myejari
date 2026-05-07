"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { whatsappLink } from "@/lib/contact";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-aurora">
      {/* Layered backdrop */}
      <div className="absolute inset-0 bg-grid opacity-60" />

      {/* Animated mesh blobs */}
      <motion.div
        className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-primary/25 blur-[120px]"
        animate={{ scale: [1, 1.08, 1], x: [0, 20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 -right-44 h-[560px] w-[560px] rounded-full bg-amber/25 blur-[120px]"
        animate={{ scale: [1, 1.1, 1], x: [0, -25, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-44 left-1/4 h-[500px] w-[500px] rounded-full bg-coral/30 blur-[120px]"
        animate={{ scale: [1, 1.05, 1], y: [0, -18, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating glass card peeks */}
      <motion.div
        className="absolute right-[6%] top-[18%] hidden lg:block"
        animate={{ y: [0, -16, 0], rotate: [0, 2, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="glass rounded-2xl px-5 py-4 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray">
                Verified
              </p>
              <p className="text-sm font-semibold text-foreground">
                Licensed business centers
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute left-[5%] top-[55%] hidden lg:block"
        animate={{ y: [0, 14, 0], rotate: [0, -2, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="glass rounded-2xl px-5 py-4 shadow-soft">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray">
            Average issuance
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            <span className="text-gradient">30 min</span>
          </p>
          <div className="mt-2 flex gap-1">
            <span className="h-1 w-6 rounded-full bg-primary" />
            <span className="h-1 w-6 rounded-full bg-coral" />
            <span className="h-1 w-3 rounded-full bg-amber" />
          </div>
        </div>
      </motion.div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 pt-20 pb-20 text-center sm:pt-24 sm:pb-24">
        {/* Pill badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/60 px-4 py-1.5 text-xs font-medium text-primary-dark shadow-soft backdrop-blur-md"
        >
          <Sparkles size={14} className="text-primary" />
          Dubai&apos;s fastest Virtual Office Ejari
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-[44px] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.05 }}
        >
          Get your Virtual Office with Ejari in{" "}
          <span className="relative inline-block whitespace-nowrap">
            <span className="text-gradient-aurora">30 min</span>
            <motion.span
              className="absolute -bottom-1.5 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-primary via-coral to-amber"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.9, delay: 0.7, ease: "easeOut" }}
              style={{ transformOrigin: "left" }}
            />
          </span>{" "}
          to issue or renew your trade license
        </motion.h1>

        <motion.p
          className="mx-auto mt-7 max-w-2xl text-lg text-gray sm:text-xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18, ease: "easeOut" }}
        >
          We find the right verified business center for your activity and
          share the issued Ejari with you the same day — all on WhatsApp.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
        >
          <a
            href={whatsappLink("getEjari")}
            target="_blank"
            rel="noopener noreferrer"
            data-track="whatsapp"
            data-source="hero_primary"
            className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-foreground px-7 py-4 text-base font-semibold text-white shadow-[0_8px_24px_-8px_rgba(13,19,26,0.6)] transition-all hover:-translate-y-0.5 hover:bg-primary hover:shadow-[0_12px_32px_-8px_rgba(241,90,36,0.55)]"
          >
            <WhatsAppIcon size={18} />
            Get my Ejari now
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </a>
          <a
            href={whatsappLink("general")}
            target="_blank"
            rel="noopener noreferrer"
            data-track="whatsapp"
            data-source="hero_secondary"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border/80 bg-white/70 px-7 py-4 text-base font-semibold text-foreground backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white"
          >
            Ask a question
          </a>
        </motion.div>

        {/* Trust line */}
        <motion.div
          className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-medium text-gray"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.55 }}
        >
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Across all of Dubai
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Mainland & free zone
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            DLD compliant
          </span>
        </motion.div>
      </div>
    </section>
  );
}
