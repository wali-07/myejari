interface TocItem {
  id: string;
  text: string;
}

interface TableOfContentsProps {
  items: TocItem[];
}

/** Slugify a heading the same way the article renderer does. */
export function headingSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function TableOfContents({ items }: TableOfContentsProps) {
  if (items.length < 3) return null;

  return (
    <nav
      aria-label="Article contents"
      className="not-prose mb-10 rounded-2xl border border-border/70 bg-gray-light/40 p-5 sm:p-6"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-gray">
        In this article
      </p>
      <ol className="mt-3 space-y-1.5 text-sm">
        {items.map((item, i) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="group flex items-baseline gap-3 rounded-md px-1 py-0.5 text-foreground/80 transition-colors hover:text-primary"
            >
              <span className="tabular-nums text-[11px] font-semibold text-gray group-hover:text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="leading-snug">{item.text}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
