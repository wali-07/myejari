"use server";

import { refresh, revalidatePath } from "next/cache";
import {
  calculateGatewayFees,
  nextInvoiceNumber,
  OFFICE_TYPES,
  type OfficeType,
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
import { signInvoiceToken } from "@/lib/admin/invoice-share";

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
  /** Fee paid to a referral partner, deducted from profit. Defaults to 0. */
  referralFee: number;
  wholesaler: string;
  tradeLicensePath?: string;
  /** Business activity from the trade license (Vision-extracted or manual). */
  activity?: string;
  /** Activity code from the trade license, if present. */
  activityCode?: string;
  /** Type of office space sold (Business Center / Separate Office / Shop / ...). */
  officeType?: OfficeType;
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
  if (!Number.isFinite(input.referralFee) || input.referralFee < 0)
    return { ok: false, error: "Referral fee must be ≥ 0" };

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
    const finalProfit = margin - gatewayFees - input.referralFee;

    const officeType =
      input.officeType && OFFICE_TYPES.includes(input.officeType)
        ? input.officeType
        : undefined;

    const order: Order = {
      invoice,
      date: todayIso(),
      company: input.company.trim(),
      contactMobile: input.contactMobile.trim(),
      paymentMethod: input.paymentMethod,
      paymentMethodRaw: input.paymentMethod,
      wholesaler: input.wholesaler.trim(),
      wholesalePrice: input.wholesalePrice,
      referralFee: input.referralFee || undefined,
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
      activity: input.activity?.trim() || undefined,
      activityCode: input.activityCode?.trim() || undefined,
      officeType,
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
  /** Fee paid to a referral partner, deducted from profit. Defaults to 0. */
  referralFee: number;
  wholesaler: string;
  paymentStatus: PaymentStatus;
  activity?: string;
  activityCode?: string;
  officeType?: OfficeType;
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
  if (!Number.isFinite(input.referralFee) || input.referralFee < 0)
    return { ok: false, error: "Referral fee must be ≥ 0" };
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
      const finalProfit = margin - gatewayFees - input.referralFee;
      const officeType =
        input.officeType && OFFICE_TYPES.includes(input.officeType)
          ? input.officeType
          : undefined;
      return {
        ...current,
        company: input.company.trim(),
        contactMobile: input.contactMobile.trim(),
        paymentMethod: input.paymentMethod,
        paymentMethodRaw: input.paymentMethod,
        wholesaler: input.wholesaler.trim(),
        wholesalePrice: input.wholesalePrice,
        referralFee: input.referralFee || undefined,
        myEjariPrice: input.myEjariPrice,
        margin,
        commissionPct,
        gatewayFees,
        finalProfit,
        paymentStatus: input.paymentStatus,
        serviceLocation: input.serviceLocation.trim() || undefined,
        validity: input.validity,
        inspectionIncluded: input.inspectionIncluded,
        activity: input.activity?.trim() || undefined,
        activityCode: input.activityCode?.trim() || undefined,
        officeType,
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
 * Build a public, login-free share link for a customer invoice. Returns a
 * RELATIVE path — the client prepends the current origin — carrying an HMAC
 * token that the public `/invoice/[invoice]` route verifies. Anyone with the
 * link can open the PDF without logging in; nobody can forge one for an
 * invoice they weren't given.
 */
export async function getInvoiceShareLink(
  invoice: string
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const orders = await readOrders();
  const order = orders.find(
    (o) => o.invoice.toLowerCase() === invoice.toLowerCase()
  );
  if (!order) return { ok: false, error: "Order not found" };
  const token = await signInvoiceToken(order.invoice);
  return {
    ok: true,
    path: `/invoice/${encodeURIComponent(order.invoice)}?t=${token}`,
  };
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
