import type { BlogFaq } from "@/lib/posts";

interface FaqSectionProps {
  faqs: BlogFaq[];
}

export default function FaqSection({ faqs }: FaqSectionProps) {
  if (faqs.length === 0) return null;

  return (
    <section
      aria-labelledby="article-faq-heading"
      className="not-prose mt-14 rounded-3xl border border-border/70 bg-white p-6 sm:p-10"
    >
      <h2
        id="article-faq-heading"
        className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
      >
        Frequently asked questions
      </h2>

      <div className="mt-6 divide-y divide-border/70">
        {faqs.map((faq, i) => (
          <details
            key={i}
            className="group py-5"
            // First two open by default — they're the highest-intent answers
            // and crawlers index the visible state preferentially.
            open={i < 2}
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-base font-semibold text-foreground sm:text-lg">
              <span>{faq.q}</span>
              <span
                aria-hidden="true"
                className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-base text-gray transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-base leading-relaxed text-gray-dark">
              {faq.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
