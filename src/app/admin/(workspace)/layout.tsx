import Sidebar from "@/components/admin/Sidebar";
import MobileTopBar from "@/components/admin/MobileTopBar";

// Sleek tech-dashboard shell — fixed left sidebar on desktop, compact top
// bar on mobile. Wraps every authenticated admin route. The unauthenticated
// /admin/login route lives outside this group and gets a minimal layout.
export default function AdminWorkspaceLayout({
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
