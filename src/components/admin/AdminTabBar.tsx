"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Receipt, FileBadge2 } from "lucide-react";

// Two-surface admin navigation:
//   - Mobile (default): fixed bottom tab bar, iOS/Android-app style
//   - Desktop (sm+): inline link group in the page header (rendered by
//     the layout). On desktop the bottom bar is hidden.
//
// Routes:
//   /admin         → KPI dashboard
//   /admin/orders  → orders table
//   /admin/specs   → activities table

interface Tab {
  href: string;
  label: string;
  icon: typeof BarChart3;
  /** Routes where this tab counts as "active" (handles sub-routes). */
  match: (pathname: string) => boolean;
}

const TABS: Tab[] = [
  {
    href: "/admin",
    label: "KPI",
    icon: BarChart3,
    match: (p) => p === "/admin",
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: Receipt,
    match: (p) => p.startsWith("/admin/orders"),
  },
  {
    href: "/admin/specs",
    label: "Specs",
    icon: FileBadge2,
    match: (p) => p.startsWith("/admin/specs"),
  },
];

/** Mobile-only fixed bottom tab bar. */
export function AdminBottomTabBar() {
  const pathname = usePathname() || "/admin";
  return (
    <nav
      aria-label="Admin sections"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 backdrop-blur-md sm:hidden"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom), 0px)",
      }}
    >
      <ul className="grid grid-cols-3">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "flex flex-col items-center justify-center gap-0.5 py-2.5 text-primary"
                    : "flex flex-col items-center justify-center gap-0.5 py-2.5 text-gray-dark hover:text-foreground"
                }
              >
                <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider ${active ? "text-primary" : ""}`}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Desktop-only inline nav rendered in the page header. */
export function AdminHeaderNav() {
  const pathname = usePathname() || "/admin";
  return (
    <nav
      aria-label="Admin sections"
      className="hidden items-center gap-1 sm:flex"
    >
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "inline-flex items-center gap-1.5 rounded-xl bg-foreground px-3 py-1.5 text-xs font-semibold text-white"
                : "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-gray-dark transition-colors hover:bg-gray-light hover:text-foreground"
            }
          >
            <Icon size={14} strokeWidth={active ? 2.4 : 2} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
