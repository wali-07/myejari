import type { Metadata } from "next";
import Sidebar from "@/components/admin/Sidebar";
import MobileTopBar from "@/components/admin/MobileTopBar";

// Admin app shell — sleek tech-dashboard layout with a fixed left sidebar
// on desktop and a compact top bar on mobile. `noindex` so this never
// accidentally lands in search results pre-auth.
export const metadata: Metadata = {
  title: "MyEjari Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#f7f8fa] text-foreground antialiased">
      <div className="flex">
        <Sidebar />
        <div className="flex w-full min-w-0 flex-1 flex-col">
          <MobileTopBar />
          <main className="flex-1">
            <div className="mx-auto w-full max-w-7xl px-5 py-7 sm:px-8 sm:py-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
