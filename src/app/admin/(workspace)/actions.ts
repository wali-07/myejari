"use server";

import { refresh, revalidatePath } from "next/cache";
import {
  calculateGatewayFees,
  nextInvoiceNumber,
  type Order,
  type PaymentMethod,
  type PaymentStatus,
} from "@/lib/admin/orders";
import {
  deleteOrderByInvoice,
  readOrders,
  updateOrderRecord,
  writeOrders,
} from "@/lib/admin/orders-store";

// Re-render the /admin route everywhere it's cached, then push the fresh
// tree to the client router as part of THIS action's response. Doing both
// from the server means a created/edited/deleted order is visible the
// instant the action resolves — the client no longer has to fire its own
// `router.refresh()` and hope the round-trip lands on fresh data.
function refreshAdmin(): void {
  revalidatePath("/admin");
  refresh();
}

const VALID_PAYMENT_METHODS: PaymentMethod[] = ["Bank Transfer", "Card"];
const VALID_VALIDITIES = ["1 year", "1 month"] as const;

interface CreateOrderInput {
  company: string;
  contactMobile: string;
  serviceLocation: string;
  validity: "1 year" | "1 month";
  inspectionIncluded: boolean;
  paymentMethod: PaymentMethod;
  myEjariPrice: number;
  wholesalePrice: number;
  wholesaler: string;
  tradeLicensePath?: string;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Create a new order from the admin Create Order form. Auto-computes the
 * invoice number, gateway fees, margin, and commission. Defaults the new
 * order to `paymentStatus: "unpaid"` — the admin marks it paid via the
 * status pill once the customer has actually settled.
 */
export async function createOrder(
  input: CreateOrderInput
): Promise<{ ok: true; invoice: string } | { ok: false; error: string }> {
  // Basic validation.
  if (!input.company.trim()) return { ok: false, error: "Company is required" };
  if (!VALID_PAYMENT_METHODS.includes(input.paymentMethod))
    return { ok: false, error: "Invalid payment method" };
  if (!VALID_VALIDITIES.includes(input.validity))
    return { ok: false, error: "Invalid validity" };
  if (!Number.isFinite(input.myEjariPrice) || input.myEjariPrice <= 0)
    return { ok: false, error: "Customer amount must be positive" };
  if (!Number.isFinite(input.wholesalePrice) || input.wholesalePrice < 0)
    return { ok: false, error: "Wholesale price must be ≥ 0" };

  try {
    // Invoice number = max(existing) + 1. Deleting an unpaid order frees
    // up its number — the next created order will reuse it.
    const orders = await readOrders();
    const invoice = nextInvoiceNumber(orders);

    const gatewayFees = calculateGatewayFees(
      input.myEjariPrice,
      input.paymentMethod
    );
    const margin = input.myEjariPrice - input.wholesalePrice;
    const commissionPct =
      input.myEjariPrice > 0 ? margin / input.myEjariPrice : 0;
    const finalProfit = margin - gatewayFees;

    const order: Order = {
      invoice,
      date: todayIso(),
      company: input.company.trim(),
      contactMobile: input.contactMobile.trim(),
      paymentMethod: input.paymentMethod,
      paymentMethodRaw: input.paymentMethod,
      wholesaler: input.wholesaler.trim(),
      wholesalePrice: input.wholesalePrice,
      myEjariPrice: input.myEjariPrice,
      margin,
      commissionPct,
      gatewayFees,
      finalProfit,
      refundStatus: "none",
      paymentStatus: "unpaid",
      serviceLocation: input.serviceLocation.trim() || undefined,
      validity: input.validity,
      inspectionIncluded: input.inspectionIncluded,
      tradeLicensePath: input.tradeLicensePath || undefined,
    };

    await writeOrders([...orders, order]);
    refreshAdmin();
    return { ok: true, invoice };
  } catch {
    // Storage hiccup — surface a friendly message instead of throwing,
    // which would render the Next.js error page and lose the form.
    return {
      ok: false,
      error: "Couldn't save the order — please try again in a moment.",
    };
  }
}

interface UpdateOrderInput {
  company: string;
  contactMobile: string;
  serviceLocation: string;
  validity: "1 year" | "1 month";
  inspectionIncluded: boolean;
  paymentMethod: PaymentMethod;
  myEjariPrice: number;
  wholesalePrice: number;
  wholesaler: string;
  paymentStatus: PaymentStatus;
}

/**
 * Edit an existing order — works for ANY order, paid or unpaid. All
 * money-derived fields (margin, commission, gateway fee, final profit)
 * are recomputed from the edited inputs exactly the way createOrder
 * computes them, so an edited order stays internally consistent. The
 * invoice number, date, refund flag, and uploaded files are preserved.
 */
export async function updateOrder(
  invoice: string,
  input: UpdateOrderInput
): Promise<{ ok: boolean; error?: string }> {
  if (!input.company.trim()) return { ok: false, error: "Company is required" };
  if (!VALID_PAYMENT_METHODS.includes(input.paymentMethod))
    return { ok: false, error: "Invalid payment method" };
  if (!VALID_VALIDITIES.includes(input.validity))
    return { ok: false, error: "Invalid validity" };
  if (!Number.isFinite(input.myEjariPrice) || input.myEjariPrice <= 0)
    return { ok: false, error: "Customer amount must be positive" };
  if (!Number.isFinite(input.wholesalePrice) || input.wholesalePrice < 0)
    return { ok: false, error: "Wholesale price must be ≥ 0" };
  if (input.paymentStatus !== "paid" && input.paymentStatus !== "unpaid")
    return { ok: false, error: "Invalid payment status" };

  try {
    const result = await updateOrderRecord(invoice, (current) => {
      const margin = input.myEjariPrice - input.wholesalePrice;
      const commissionPct =
        input.myEjariPrice > 0 ? margin / input.myEjariPrice : 0;
      const gatewayFees = calculateGatewayFees(
        input.myEjariPrice,
        input.paymentMethod
      );
      const finalProfit = margin - gatewayFees;
      return {
        ...current,
        company: input.company.trim(),
        contactMobile: input.contactMobile.trim(),
        paymentMethod: input.paymentMethod,
        paymentMethodRaw: input.paymentMethod,
        wholesaler: input.wholesaler.trim(),
        wholesalePrice: input.wholesalePrice,
        myEjariPrice: input.myEjariPrice,
        margin,
        commissionPct,
        gatewayFees,
        finalProfit,
        paymentStatus: input.paymentStatus,
        serviceLocation: input.serviceLocation.trim() || undefined,
        validity: input.validity,
        inspectionIncluded: input.inspectionIncluded,
      };
    });
    if (result.ok) refreshAdmin();
    return result;
  } catch {
    return {
      ok: false,
      error: "Couldn't save the changes — please try again in a moment.",
    };
  }
}

/**
 * Delete an order, paid or unpaid. The admin owns this surface and may
 * need to remove a mistaken or test entry even after it was marked paid.
 * The invoice number is NOT reissued; the counter keeps marching forward.
 */
export async function deleteOrder(
  invoice: string
): Promise<{ ok: boolean; error?: string }> {
  const result = await deleteOrderByInvoice(invoice);
  if (result.ok) refreshAdmin();
  return result;
}

/**
 * Quick "mark as paid" shortcut from the details popup. Editing the order
 * can also flip payment status both ways; this is just the one-tap path
 * for the common case. No-ops cleanly if already paid.
 */
export async function markOrderPaid(
  invoice: string
): Promise<{ ok: boolean; error?: string }> {
  const orders = await readOrders();
  const idx = orders.findIndex((o) => o.invoice === invoice);
  if (idx < 0) return { ok: false, error: "Order not found" };
  if (orders[idx].paymentStatus === "paid") {
    return { ok: false, error: "Order is already marked as paid" };
  }
  orders[idx] = { ...orders[idx], paymentStatus: "paid" };
  await writeOrders(orders);
  refreshAdmin();
  return { ok: true };
}
