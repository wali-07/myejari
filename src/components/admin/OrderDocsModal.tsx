"use client";

import {
  CheckCircle2,
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  ReplaceAll,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Order } from "@/lib/admin/orders";

interface Props {
  order: Pick<
    Order,
    | "invoice"
    | "company"
    | "tradeLicensePath"
    | "wholesalerInvoicePath"
  >;
}

// Storage paths look like `data/admin-uploads/orders/INV0123/foo.pdf`.
// Files are served by the `/admin/uploads/[...path]` route — strip the
// `data/admin-uploads/` prefix to get the URL segments.
function storagePathToUrl(storagePath: string): string {
  const cleaned = storagePath.replace(/\\/g, "/");
  const stripped = cleaned.replace(/^data\/admin-uploads\//, "");
  return `/admin/uploads/${stripped}`;
}

// Small per-order docs sheet. Shows the customer invoice (always
// available — generated on demand), the trade license (if uploaded
// during order creation), and the wholesaler invoice (uploaded ad-hoc
// from a phone). Mobile-first — full-screen on small viewports.
export default function OrderDocsModal({ order }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !uploading) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, uploading]);

  const hasWholesalerInvoice = !!order.wholesalerInvoicePath;
  const hasTradeLicense = !!order.tradeLicensePath;
  const attachmentCount = (hasWholesalerInvoice ? 1 : 0) + (hasTradeLicense ? 1 : 0);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("invoice", order.invoice);
      fd.append("wholesalerInvoice", file);
      const res = await fetch("/api/admin/upload-wholesaler-invoice", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Upload failed");
      }
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = "";
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`Documents — ${attachmentCount} attached`}
        className={`relative inline-flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
          attachmentCount > 0
            ? "text-primary hover:bg-primary-light/60"
            : "text-gray-dark hover:bg-gray-light hover:text-foreground"
        }`}
      >
        <Paperclip size={14} />
        {attachmentCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
            {attachmentCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:p-4">
          <div
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => !uploading && setOpen(false)}
          />
          <div
            role="dialog"
            aria-label={`Documents for ${order.invoice}`}
            className="relative flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[88vh] sm:w-full sm:max-w-[480px] sm:rounded-3xl"
          >
            <header className="flex items-center justify-between border-b border-border px-5 py-3.5 sm:px-6 sm:py-4">
              <div className="min-w-0">
                <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                  {order.invoice}
                </h2>
                <p
                  className="truncate text-[11px] text-gray-dark"
                  title={order.company}
                >
                  {order.company}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !uploading && setOpen(false)}
                className="-mr-1.5 inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray transition-colors hover:bg-gray-light hover:text-foreground"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
              {/* Customer invoice — always available */}
              <DocRow
                title="Customer invoice"
                subtitle={`Auto-generated · ${order.invoice}.pdf`}
                icon={<FileText size={16} />}
                href={`/admin/invoices/${order.invoice}`}
                actionLabel="View / download"
                state="ready"
              />

              <div className="my-3 h-px bg-border" />

              {/* Wholesaler invoice — uploadable */}
              <DocRow
                title="Wholesaler invoice"
                subtitle={
                  hasWholesalerInvoice
                    ? "Uploaded · receipt from the business center"
                    : "Upload the receipt the business center sent you"
                }
                icon={<FileText size={16} />}
                state={hasWholesalerInvoice ? "ready" : "missing"}
                href={
                  hasWholesalerInvoice
                    ? storagePathToUrl(order.wholesalerInvoicePath!)
                    : undefined
                }
                actionLabel={
                  hasWholesalerInvoice ? "View" : undefined
                }
                rightSlot={
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className={
                      hasWholesalerInvoice
                        ? "inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-white px-2.5 text-[11px] font-medium text-foreground/80 transition-colors hover:text-foreground disabled:opacity-60"
                        : "inline-flex h-8 items-center gap-1 rounded-lg bg-foreground px-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-primary disabled:opacity-60"
                    }
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        Uploading…
                      </>
                    ) : hasWholesalerInvoice ? (
                      <>
                        <ReplaceAll size={12} />
                        Replace
                      </>
                    ) : (
                      <>
                        <Upload size={12} />
                        Upload
                      </>
                    )}
                  </button>
                }
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf,image/*,.png,.jpg,.jpeg,.webp,.heic,.heif"
                onChange={onPick}
                className="hidden"
              />

              <div className="my-3 h-px bg-border" />

              {/* Trade license — readonly view (uploaded during create order) */}
              <DocRow
                title="Trade license"
                subtitle={
                  hasTradeLicense
                    ? "Uploaded during order creation"
                    : "Not uploaded"
                }
                icon={<ImageIcon size={16} />}
                state={hasTradeLicense ? "ready" : "missing"}
                href={
                  hasTradeLicense
                    ? storagePathToUrl(order.tradeLicensePath!)
                    : undefined
                }
                actionLabel={hasTradeLicense ? "View" : undefined}
              />

              {error && (
                <p
                  role="alert"
                  className="mt-4 rounded-xl bg-coral/10 px-3 py-2 text-xs font-medium text-coral"
                >
                  {error}
                </p>
              )}
            </div>

            <footer className="border-t border-border bg-gray-light/30 px-5 py-3 text-center sm:px-6">
              <p className="text-[10px] text-gray">
                Files are stored locally and included in bulk export.
              </p>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}

interface DocRowProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  state: "ready" | "missing";
  href?: string;
  actionLabel?: string;
  rightSlot?: React.ReactNode;
}

function DocRow({
  title,
  subtitle,
  icon,
  state,
  href,
  actionLabel,
  rightSlot,
}: DocRowProps) {
  const ready = state === "ready";
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          ready
            ? "bg-success/10 text-success"
            : "bg-gray-light text-gray-dark"
        }`}
      >
        {ready ? <CheckCircle2 size={16} /> : icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="truncate text-[11px] text-gray-dark">{subtitle}</p>
      </div>
      <div className="shrink-0">
        {rightSlot ??
          (href && actionLabel ? (
            <a
              href={href}
              target="_blank"
              rel="noopener"
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-white px-2.5 text-[11px] font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              <Download size={12} />
              {actionLabel}
            </a>
          ) : null)}
      </div>
    </div>
  );
}
