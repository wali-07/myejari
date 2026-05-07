import { Download } from "lucide-react";

// Plain anchor — the export endpoint streams a ZIP and the browser
// handles the download via Content-Disposition. No client state needed.
export default function ExportAllButton() {
  return (
    <a
      href="/admin/invoices/export"
      download
      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-white px-3 text-xs font-medium text-foreground/80 transition-colors hover:border-foreground/20 hover:text-foreground"
      title="Download every order's documents as a ZIP"
    >
      <Download size={14} />
      <span className="hidden sm:inline">Export all</span>
    </a>
  );
}
