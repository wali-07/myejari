import { renderToBuffer } from "@react-pdf/renderer";
import archiver from "archiver";
import { existsSync, createReadStream } from "node:fs";
import path from "node:path";
import { PassThrough, Readable } from "node:stream";
import { readOrders } from "@/lib/admin/orders-store";
import { InvoicePdf } from "@/lib/admin/invoice-pdf";
import { sortOrdersByDate } from "@/lib/admin/orders";

export const runtime = "nodejs";

/**
 * GET /admin/invoices/export
 *
 * Streams a ZIP archive to the browser containing every order's
 * documents, organised one folder per invoice:
 *
 *   INV0123 - Company Name/
 *     customer-invoice.pdf       (auto-generated from order data)
 *     wholesaler-invoice.pdf     (uploaded receipt — if present)
 *     trade-license.pdf          (uploaded TL — if present)
 *
 * Streaming so we don't have to fit 100+ PDFs in memory.
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

export async function GET() {
  const orders = sortOrdersByDate(await readOrders());

  const archive = archiver("zip", { zlib: { level: 6 } });
  const passthrough = new PassThrough();
  archive.pipe(passthrough);

  // Build the archive in the background; the body streams to the client
  // as bytes are added.
  (async () => {
    try {
      for (const order of orders) {
        const folder = `${order.invoice} - ${sanitize(order.company)}`;

        // 1. Auto-generated customer invoice.
        const customerPdf = await renderToBuffer(<InvoicePdf order={order} />);
        archive.append(customerPdf, {
          name: `${folder}/customer-invoice.pdf`,
        });

        // 2. Wholesaler-issued invoice / receipt (if uploaded).
        if (order.wholesalerInvoicePath) {
          const fp = path.resolve(process.cwd(), order.wholesalerInvoicePath);
          if (existsSync(fp)) {
            archive.append(createReadStream(fp), {
              name: `${folder}/wholesaler-invoice${path.extname(fp)}`,
            });
          }
        }

        // 3. Trade License (if uploaded).
        if (order.tradeLicensePath) {
          const fp = path.resolve(process.cwd(), order.tradeLicensePath);
          if (existsSync(fp)) {
            archive.append(createReadStream(fp), {
              name: `${folder}/trade-license${path.extname(fp)}`,
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
