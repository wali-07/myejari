import SignOutButton from "@/components/admin/SignOutButton";
import {
  AdminBottomTabBar,
  AdminHeaderNav,
} from "@/components/admin/AdminTabBar";

// Admin shell — top header strip + main content + mobile bottom tab bar.
// Three top-level sections: KPI dashboard (/admin), Orders (/admin/orders),
// Specs / Business activities (/admin/specs). Desktop renders nav links
// inline in the header; mobile gets a fixed bottom tab bar.
export default function AdminWorkspaceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#f7f8fa] text-foreground antialiased">
      <header className="sticky top-0 z-30 border-b border-border bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-2.5">
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
          <AdminHeaderNav />
          <SignOutButton />
        </div>
      </header>
      <main>
        {/* Bottom padding on mobile so the fixed tab bar doesn't cover
            content. ~64px tab bar + safe-area inset on iOS. */}
        <div className="mx-auto w-full max-w-[1600px] px-5 pb-24 pt-5 sm:px-8 sm:pb-10 sm:pt-8">
          {children}
        </div>
      </main>
      <AdminBottomTabBar />
    </div>
  );
}
