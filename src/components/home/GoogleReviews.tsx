"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Star, ArrowRight } from "lucide-react";
import { GOOGLE_REVIEWS_URL, type Review } from "@/lib/reviews";

const PREVIEW_CHARS = 140;

interface GoogleReviewsProps {
  reviews: Review[];
  /**
   * Reviews beyond the four featured visually — rendered into a sr-only
   * block so crawlers and AI bots that don't parse JSON-LD still see every
   * review's text, author, rating, and date.
   */
  additionalReviews?: Review[];
  aggregate: { rating: number; count: number };
}

function GoogleG({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={
            i <= Math.round(rating)
              ? "fill-amber text-amber"
              : "fill-gray-light text-gray-light"
          }
        />
      ))}
    </div>
  );
}

function avatarGradient(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const palette = [
    "from-primary to-coral",
    "from-coral to-amber",
    "from-amber to-primary",
    "from-primary-dark to-primary",
  ];
  return palette[Math.abs(hash) % palette.length];
}

function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = review.text.length > PREVIEW_CHARS;
  const previewText = needsTruncation
    ? review.text.slice(0, PREVIEW_CHARS).trimEnd() + "…"
    : review.text;

  return (
    <article className="group relative flex flex-col rounded-2xl border border-border bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(
              review.name
            )} text-sm font-semibold text-white`}
          >
            {review.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {review.name}
            </p>
            <div className="mt-0.5">
              <StarRow rating={review.rating} size={12} />
            </div>
          </div>
        </div>
        <GoogleG size={16} />
      </div>

      <p className="mt-4 flex-1 text-sm leading-relaxed text-gray-dark">
        &ldquo;{expanded ? review.text : previewText}&rdquo;
      </p>

      {needsTruncation && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 inline-flex w-fit items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary-dark"
          aria-expanded={expanded}
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      )}
    </article>
  );
}

export default function GoogleReviews({
  reviews,
  additionalReviews = [],
  aggregate,
}: GoogleReviewsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="relative px-6 py-20 sm:py-24"
      id="reviews"
    >
      <div className="mx-auto max-w-6xl">
        {/* Header — rating summary */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary-light/60 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-dark"
          >
            <GoogleG size={14} /> Google Reviews
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-5 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
          >
            Loved by founders{" "}
            <span className="text-gradient-aurora">across Dubai</span>
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-7 inline-flex items-center gap-4 rounded-2xl border border-border bg-white px-6 py-4 shadow-soft"
          >
            <div className="flex items-center gap-2">
              <span className="text-3xl font-semibold tracking-tight text-foreground">
                {aggregate.rating.toFixed(1)}
              </span>
              <StarRow rating={aggregate.rating} size={18} />
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex items-center gap-2">
              <GoogleG size={18} />
              <p className="text-sm font-medium text-foreground">
                Google rating
              </p>
            </div>
          </motion.div>
        </div>

        {/* Review grid — horizontal scroll on mobile (first card aligned with content, right side bleeds) */}
        <div className="mt-14 -mr-6 md:mr-0">
          <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pr-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-2 md:overflow-visible md:pr-0 md:pb-0 lg:grid-cols-4">
            {reviews.map((review, i) => (
              <motion.div
                key={review.name + i}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.08 }}
                className="w-[85%] shrink-0 snap-start md:w-auto md:shrink"
              >
                <ReviewCard review={review} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-10 flex justify-center"
        >
          <a
            href={GOOGLE_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2.5 rounded-full border border-border bg-white px-6 py-3 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft"
          >
            <GoogleG size={16} />
            Read all reviews on Google
            <ArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </a>
        </motion.div>

        {additionalReviews.length > 0 && (
          <div className="sr-only" aria-label="Additional Google reviews">
            <h3>More Google reviews of MyEjari</h3>
            <ul>
              {additionalReviews.map((review, i) => (
                <li key={review.name + i}>
                  <p>
                    <strong>{review.name}</strong> — {review.rating} out of 5
                    stars, {review.date}.
                  </p>
                  <blockquote cite={GOOGLE_REVIEWS_URL}>
                    {review.text}
                  </blockquote>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
