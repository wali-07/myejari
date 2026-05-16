import { NextResponse } from "next/server";
import { calculateGatewayFees, type Order } from "@/lib/admin/orders";
import { readOrders, writeOrders } from "@/lib/admin/orders-store";
import { backupOrdersJson } from "@/lib/admin/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONFIRM_TOKEN = "recalc-card-fees";

/**
 * GET /admin/maintenance/recalc-card-fees
 *
 * One-time, admin-only (gated by the /admin middleware), IDEMPOTENT
 * maintenance op. Recomputes `gatewayFees` + `finalProfit` for every
 * Card order using the corrected Ziina formula: (amount·2.6% + AED 1)
 * × 1.05 VAT. Bank Transfer / Other orders are left untouched.
 *
 *   - No `?confirm=` → PREVIEW only. Reports what would change, writes
 *     nothing. Safe to open and refresh.
 *   - `?confirm=recalc-card-fees` → APPLY. Backs up the current orders
 *     document first (private, immutable), then writes the recalc.
 *
 * Recompute is from `myEjariPrice`, so running it more than once is
 * harmless — it always converges to the same values.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const apply = url.searchParams.get("confirm") === CONFIRM_TOKEN;

  const orders = (await readOrders()) as Order[];

  let cardCount = 0;
  let changed = 0;
  const sample: Array<{
    invoice: string;
    customerPaid: number;
    oldFee: number;
    newFee: number;
    oldProfit: number;
    newProfit: number;
  }> = [];

  const next = orders.map((o) => {
    if (o.paymentMethod !== "Card") return o;
    cardCount++;
    const margin = o.myEjariPrice - o.wholesalePrice;
    const gatewayFees = calculateGatewayFees(o.myEjariPrice, "Card");
    const finalProfit = margin - gatewayFees;
    const isChange =
      o.gatewayFees !== gatewayFees ||
      o.finalProfit !== finalProfit ||
      o.margin !== margin;
    if (isChange) {
      changed++;
      if (sample.length < 10) {
        sample.push({
          invoice: o.invoice,
          customerPaid: o.myEjariPrice,
          oldFee: o.gatewayFees,
          newFee: gatewayFees,
          oldProfit: o.finalProfit,
          newProfit: finalProfit,
        });
      }
    }
    return { ...o, margin, gatewayFees, finalProfit };
  });

  if (!apply) {
    return NextResponse.json({
      mode: "preview",
      message:
        "Preview only — nothing was written. To apply, open this URL again with ?confirm=recalc-card-fees",
      totalOrders: orders.length,
      cardOrders: cardCount,
      wouldChange: changed,
      sample,
    });
  }

  // APPLY — back up the current document first (irreversible op).
  const backup = await backupOrdersJson(orders);
  if (!backup) {
    return NextResponse.json(
      {
        mode: "aborted",
        error:
          "Could not write a backup of orders.json — aborting without changes.",
      },
      { status: 500 }
    );
  }

  await writeOrders(next);

  return NextResponse.json({
    mode: "applied",
    message: "Recalculation applied. A backup was saved first.",
    totalOrders: orders.length,
    cardOrders: cardCount,
    changed,
    backup,
    sample,
  });
}
