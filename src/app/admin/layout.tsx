import type { Metadata } from "next";
import Link from "next/link";

// Admin app shell — minimal, no marketing chrome (no Header/Footer/GTM).
// `noindex` so this never accidentally lands in search results even before
// the production auth gate is in place.
export const metadata: Metadata = {
  title: "MyEjari Admin",
  robots: { index: false, follow: false },
};

const NAV_ITEMS: { href: string; label: string; soon?: boolean }[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders", soon: true },
  { href: "/admin/invoices", label: "Invoices", soon: true },
];

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-light/40 text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-tight text-foreground"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-base font-bold text-white">
              M
            </span>
            MyEjari · Admin
          </Link>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) =>
              item.soon ? (
                <span
                  key={item.href}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-gray"
                  aria-disabled="true"
                  title="Coming soon"
                >
                  {item.label}
                  <span className="rounded-full bg-gray-light px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-dark">
                    Soon
                  </span>
                </span>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-gray-light hover:text-foreground"
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
