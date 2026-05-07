import type { ReactNode } from "react";

interface LegalShellProps {
  title: string;
  subtitle?: string;
  lastUpdated: string;
  children: ReactNode;
}

export default function LegalShell({
  title,
  subtitle,
  lastUpdated,
  children,
}: LegalShellProps) {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-light to-white px-6 pt-20 pb-14">
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 text-lg text-foreground/60">{subtitle}</p>
          )}
          <p className="mt-4 text-sm text-foreground/50">
            Last updated: {lastUpdated}
          </p>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-6 py-16">
        <div className="prose-legal space-y-8 text-foreground/75 leading-relaxed">
          {children}
        </div>
      </article>
    </>
  );
}
