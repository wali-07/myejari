"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  FileText,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  /** When true the link renders as disabled/coming-soon. */
  soon?: boolean;
}

const ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/transactions", label: "Transactions", icon: Receipt },
  { href: "/admin/invoices", label: "Invoices", icon: FileText, soon: true },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-60 shrink-0 border-r border-border bg-white lg:sticky lg:top-0 lg:flex lg:flex-col">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-base font-bold text-white shadow-soft">
          M
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-foreground">MyEjari</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray">
            Admin
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3">
        <p className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray">
          Workspace
        </p>
        <ul className="mt-1 space-y-0.5">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);

            if (item.soon) {
              return (
                <li key={item.href}>
                  <span
                    className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray/70"
                    aria-disabled="true"
                    title="Coming soon"
                  >
                    <Icon size={16} strokeWidth={2} />
                    <span className="flex-1">{item.label}</span>
                    <span className="rounded-full bg-gray-light px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-gray-dark">
                      Soon
                    </span>
                  </span>
                </li>
              );
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={
                    active
                      ? "flex items-center gap-2.5 rounded-lg bg-primary-light/70 px-3 py-2 text-sm font-semibold text-primary-dark"
                      : "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground/75 transition-colors hover:bg-gray-light hover:text-foreground"
                  }
                >
                  <Icon
                    size={16}
                    strokeWidth={active ? 2.4 : 2}
                    className={active ? "text-primary" : ""}
                  />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer / status */}
      <div className="border-t border-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <span className="text-[11px] font-medium text-gray-dark">
            Live · CRM synced
          </span>
        </div>
      </div>
    </aside>
  );
}
