import { NextResponse } from "next/server";
import path from "node:path";
import { readOrders, writeOrders } from "@/lib/admin/orders-store";
import {
  deleteUploadsByPrefix,
  putUpload,
} from "@/lib/admin/storage";

export const runtime = "nodejs";

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
 * Saves through the storage abstraction (fs in dev, Blob in prod) and
 * writes the resulting ref back to the order's `wholesalerInvoicePath`.
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

  // Replace any existing wholesaler invoice for this order.
  await deleteUploadsByPrefix(`orders/${invoice}/wholesaler-invoice`);

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `orders/${invoice}/wholesaler-invoice${ext}`;
  const stored = await putUpload(
    key,
    buffer,
    file.type || "application/octet-stream"
  );

  orders[idx] = { ...orders[idx], wholesalerInvoicePath: stored.ref };
  await writeOrders(orders);

  return NextResponse.json({ ok: true, path: stored.ref });
}
