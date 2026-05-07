import LoginForm from "@/components/admin/LoginForm";

interface Props {
  searchParams: Promise<{ from?: string }>;
}

export default async function AdminLoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const from =
    sp.from && sp.from.startsWith("/admin") ? sp.from : "/admin";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-white shadow-soft">
            M
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              MyEjari Admin
            </h1>
            <p className="mt-1 text-xs text-gray-dark">
              Sign in to access the workspace.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-sm">
          <LoginForm from={from} />
        </div>

        <p className="mt-6 text-center text-[11px] text-gray">
          Authorised personnel only · MyEjari (FZC)
        </p>
      </div>
    </div>
  );
}
