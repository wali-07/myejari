import type { Metadata } from "next";

// Top-level admin shell — strictly minimal so the /admin/login page can
// render without sidebar/top-bar chrome. The authenticated workspace
// layout lives under app/admin/(workspace)/layout.tsx.
export const metadata: Metadata = {
  title: "MyEjari Admin",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
