"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { MapPin, FileCheck, Clock, Star } from "lucide-react";
import { REVIEW_AGGREGATE } from "@/lib/reviews";

interface Stat {
  icon: React.ReactNode;
  label: string;
  target: number;
  suffix: string;
  decimals?: number;
}

const stats: Stat[] = [
  {
    icon: <MapPin size={20} strokeWidth={2.2} />,
    label: "Locations available",
    target: 10,
    suffix: "+",
  },
  {
    icon: <FileCheck size={20} strokeWidth={2.2} />,
    label: "Ejaris issued",
    target: 100,
    suffix: "+",
  },
  {
    icon: <Clock size={20} strokeWidth={2.2} />,
    label: "Average issuance",
    target: 30,
    suffix: "min",
  },
  {
    icon: <Star size={20} strokeWidth={2.2} />,
    label: "Google rating",
    target: REVIEW_AGGREGATE.rating,
    suffix: "",
    decimals: 1,
  },
];

const marqueeItems = [
  "Trade license renewal",
  "New license issuance",
  "Mainland Ejari",
  "Free zone Ejari",
  "Same-day turnaround",
  "DLD compliant",
  "WhatsApp support",
  "Across all of Dubai",
];

function AnimatedNumber({
  target,
  suffix,
  inView,
  delay,
  decimals = 0,
}: {
  target: number;
  suffix: string;
  inView: boolean;
  delay: number;
  decimals?: number;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1600;
    const start = performance.now() + delay;
    let raf = 0;
    const step = (now: number) => {
      const elapsed = Math.max(0, now - start);
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, delay]);

  const display =
    decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();

  return (
    <span className="inline-flex items-baseline whitespace-nowrap tabular-nums">
      <span>{display}</span>
      {suffix && (
        <span className="ml-0.5 text-2xl font-semibold text-foreground/40 sm:text-3xl">
          {suffix}
        </span>
      )}
    </span>
  );
}

export default function TrustBar() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative px-6 pt-6 pb-16">
      <div ref={ref} className="mx-auto max-w-6xl">
        {/* Unified bento strip */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="relative overflow-hidden rounded-3xl border border-border bg-white shadow-soft"
        >
          {/* Subtle gradient wash */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-light/30 via-transparent to-transparent" />
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-amber/15 blur-3xl" />

          <div className="relative grid grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: 0.1 + i * 0.07 }}
                className={`group relative flex min-h-[180px] flex-col items-center justify-center gap-3 px-5 py-8 text-center sm:min-h-[200px] sm:px-7 ${
                  i < stats.length - 1 ? "lg:border-r lg:border-border/70" : ""
                } ${i < 2 ? "border-b border-border/70 lg:border-b-0" : ""} ${
                  i % 2 === 0 ? "border-r border-border/70 lg:border-r" : ""
                }`}
              >
                {/* Icon tile */}
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary transition-transform duration-300 group-hover:-translate-y-0.5">
                  {stat.icon}
                </span>

                {/* Big number */}
                <div className="text-4xl font-semibold leading-none tracking-[-0.02em] text-foreground sm:text-5xl lg:text-6xl">
                  <AnimatedNumber
                    target={stat.target}
                    suffix={stat.suffix}
                    inView={inView}
                    delay={i * 100}
                    decimals={stat.decimals ?? 0}
                  />
                </div>

                {/* Label */}
                <p className="text-sm font-medium text-foreground/70 sm:text-base">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Marquee */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="relative mt-10 overflow-hidden"
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent" />
          <div className="flex w-max animate-marquee gap-3">
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span
                key={i}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-white/80 px-5 py-2 text-sm font-medium text-gray-dark backdrop-blur-sm"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {item}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
