import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { readOrders } from "@/lib/admin/orders-store";
import { InvoicePdf } from "@/lib/admin/invoice-pdf";
import { verifyInvoiceToken } from "@/lib/admin/invoice-share";

interface Params {
  params: Promise<{ invoice: string }>;
}

// GET /invoice/[invoice]?t=<token> — PUBLIC, login-free invoice PDF.
//
// This route deliberately lives OUTSIDE /admin so the admin auth middleware
// never sees it — a customer with the link can open the invoice without a
// MyEjari account. What authorises the view is the unguessable HMAC token in
// `t` (see lib/admin/invoice-share). No token / wrong token → 403, so the
// invoice numbers can't simply be enumerated.
export async function GET(request: Request, { params }: Params) {
  const { invoice } = await params;
  const token = new URL(request.url).searchParams.get("t") ?? undefined;

  if (!(await verifyInvoiceToken(invoice, token))) {
    return new NextResponse("This invoice link is invalid or has expired.", {
      status: 403,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

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
      "Content-Disposition": `inline; filename="${order.invoice}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
