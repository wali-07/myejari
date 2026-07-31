import { renderToBuffer } from "@react-pdf/renderer";
import archiver from "archiver";
import path from "node:path";
import { PassThrough, Readable } from "node:stream";
import { readOrders } from "@/lib/admin/orders-store";
import { InvoicePdf } from "@/lib/admin/invoice-pdf";
import { sortOrdersByDate } from "@/lib/admin/orders";
import { fetchUploadBytes } from "@/lib/admin/storage";

export const runtime = "nodejs";

/**
 * GET /admin/invoices/export — streams a ZIP containing every order's
 * documents, organised one folder per invoice. Backend-agnostic: pulls
 * uploaded files via the storage layer (fs in dev, Blob fetch in prod).
 */

function sanitize(name: string): string {
  return (
    name
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 200) || "Untitled"
  );
}

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function extFromRef(ref: string): string {
  // Only a full URL needs URL parsing; pathnames and fs paths use extname.
  if (/^https?:\/\//.test(ref)) {
    try {
      return path.extname(new URL(ref).pathname) || "";
    } catch {
      return "";
    }
  }
  return path.extname(ref) || "";
}

export async function GET() {
  const orders = sortOrdersByDate(await readOrders());

  const archive = archiver("zip", { zlib: { level: 6 } });
  const passthrough = new PassThrough();
  archive.pipe(passthrough);

  (async () => {
    try {
      for (const order of orders) {
        const folder = `${order.invoice} - ${sanitize(order.company)}`;

        // 1. Customer invoice — auto-generated.
        const customerPdf = await renderToBuffer(<InvoicePdf order={order} />);
        archive.append(customerPdf, {
          name: `${folder}/customer-invoice.pdf`,
        });

        // 2. Wholesaler-issued invoice (if uploaded).
        if (order.wholesalerInvoicePath) {
          const buf = await fetchUploadBytes(order.wholesalerInvoicePath);
          if (buf) {
            archive.append(buf, {
              name: `${folder}/wholesaler-invoice${extFromRef(
                order.wholesalerInvoicePath
              )}`,
            });
          }
        }

        // 3. Referral partner's invoice (if uploaded).
        if (order.referralInvoicePath) {
          const buf = await fetchUploadBytes(order.referralInvoicePath);
          if (buf) {
            archive.append(buf, {
              name: `${folder}/referral-invoice${extFromRef(
                order.referralInvoicePath
              )}`,
            });
          }
        }

        // 4. Trade License (if uploaded).
        if (order.tradeLicensePath) {
          const buf = await fetchUploadBytes(order.tradeLicensePath);
          if (buf) {
            archive.append(buf, {
              name: `${folder}/trade-license${extFromRef(
                order.tradeLicensePath
              )}`,
            });
          }
        }
      }
      await archive.finalize();
    } catch (err) {
      console.error("[invoices/export] archive failed:", err);
      passthrough.destroy(err as Error);
    }
  })();

  const webStream = Readable.toWeb(passthrough) as unknown as ReadableStream;
  return new Response(webStream, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="myejari-invoices-${timestamp()}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
