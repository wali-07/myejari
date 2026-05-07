import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { readOrders } from "@/lib/admin/orders-store";
import { InvoicePdf } from "@/lib/admin/invoice-pdf";

interface Params {
  params: Promise<{ invoice: string }>;
}

// GET /admin/invoices/[invoice] — streams the invoice PDF inline.
// Auth-gated by the global /admin middleware.
export async function GET(_request: Request, { params }: Params) {
  const { invoice } = await params;
  const orders = await readOrders();
  const order = orders.find(
    (o) => o.invoice.toLowerCase() === invoice.toLowerCase()
  );
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const buffer = await renderToBuffer(<InvoicePdf order={order} />);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      // `inline` so the browser displays it; switch to `attachment` if you want
      // a force-download default.
      "Content-Disposition": `inline; filename="${order.invoice}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
