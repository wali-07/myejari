"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt } from "lucide-react";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/transactions", label: "Transactions", icon: Receipt },
];

// Mobile/tablet replacement for the desktop sidebar — surfaces the brand
// + the two primary destinations as a horizontal scroll strip. Hidden at
// `lg` and above where the full sidebar takes over.
export default function MobileTopBar() {
  const pathname = usePathname();
  return (
    <div className="lg:hidden border-b border-border bg-white">
      <div className="flex items-center justify-between px-5 py-3">
        <Link href="/admin" className="inline-flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
            M
          </span>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            MyEjari · Admin
          </span>
        </Link>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-dark">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Live
        </span>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-border/70 px-3 py-2 [&::-webkit-scrollbar]:hidden">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-white"
                  : "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground/80"
              }
            >
              <Icon size={13} strokeWidth={2.2} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
