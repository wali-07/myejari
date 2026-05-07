import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { readOrders, writeOrders } from "@/lib/admin/orders-store";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "data", "admin-uploads", "orders");
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB — phone screenshots can be big

const ALLOWED_EXT = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".heic",
  ".heif",
];

/**
 * POST /api/admin/upload-wholesaler-invoice
 *
 * Multipart body:
 *   `invoice`            — the order invoice number (e.g. "INV0123")
 *   `wholesalerInvoice`  — the file from the wholesaler (PDF or image)
 *
 * Saves it to `data/admin-uploads/orders/<INVxxxx>/wholesaler-invoice.<ext>`
 * and writes the path back to the order's `wholesalerInvoicePath`.
 */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart body" },
      { status: 400 }
    );
  }

  const invoice = (form.get("invoice") || "").toString().trim();
  const file = form.get("wholesalerInvoice");
  if (!invoice) {
    return NextResponse.json(
      { error: "invoice is required" },
      { status: 400 }
    );
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "wholesalerInvoice file is required" },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File is larger than 15 MB" },
      { status: 413 }
    );
  }
  const ext = (path.extname(file.name) || "").toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) {
    return NextResponse.json(
      { error: "Upload a PDF or image (PNG, JPG, WEBP, HEIC)" },
      { status: 415 }
    );
  }

  // Verify the order exists.
  const orders = await readOrders();
  const idx = orders.findIndex(
    (o) => o.invoice.toLowerCase() === invoice.toLowerCase()
  );
  if (idx < 0) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Write to data/admin-uploads/orders/<invoice>/wholesaler-invoice.<ext>.
  const orderDir = path.join(UPLOAD_DIR, invoice);
  await fs.mkdir(orderDir, { recursive: true });

  // Clean up any existing wholesaler invoice (different ext) so we have one
  // canonical file per order.
  for (const old of ALLOWED_EXT) {
    const existing = path.join(orderDir, `wholesaler-invoice${old}`);
    if (existing !== path.join(orderDir, `wholesaler-invoice${ext}`)) {
      await fs.unlink(existing).catch(() => {});
    }
  }

  const fullPath = path.join(orderDir, `wholesaler-invoice${ext}`);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(fullPath, buffer);

  // Persist the new path on the order.
  const relPath = path.relative(process.cwd(), fullPath).replace(/\\/g, "/");
  orders[idx] = { ...orders[idx], wholesalerInvoicePath: relPath };
  await writeOrders(orders);

  return NextResponse.json({ ok: true, path: relPath });
}
