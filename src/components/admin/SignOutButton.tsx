"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.replace("/admin/login");
      router.refresh();
    } catch {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-white px-3 text-xs font-medium text-foreground/80 transition-colors hover:border-foreground/20 hover:text-foreground disabled:opacity-60"
    >
      <LogOut size={14} />
      <span className="hidden sm:inline">Sign out</span>
    </button>
  );
}
