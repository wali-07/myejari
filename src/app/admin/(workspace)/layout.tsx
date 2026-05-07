import SignOutButton from "@/components/admin/SignOutButton";

// Single-page admin shell — top header strip + main content. The sidebar
// was removed once the workspace collapsed to a single Orders page.
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
          <SignOutButton />
        </div>
      </header>
      <main>
        <div className="mx-auto w-full max-w-[1600px] px-5 py-7 sm:px-8 sm:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
