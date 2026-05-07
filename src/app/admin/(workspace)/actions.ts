"use server";

import { revalidatePath } from "next/cache";
import {
  calculateGatewayFees,
  nextInvoiceNumber,
  type Order,
  type PaymentMethod,
} from "@/lib/admin/orders";
import {
  deleteUnpaidOrder,
  readOrders,
  writeOrders,
} from "@/lib/admin/orders-store";

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

  // Invoice number = max(existing) + 1. Deleting an unpaid order frees up
  // its number — the next created order will reuse it.
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
  revalidatePath("/admin");
  return { ok: true, invoice };
}

/**
 * Delete an order. Only unpaid orders can be deleted — paid orders are
 * locked because they represent collected revenue. The invoice number
 * is NOT reissued; the counter keeps marching forward.
 */
export async function deleteOrder(
  invoice: string
): Promise<{ ok: boolean; error?: string }> {
  const result = await deleteUnpaidOrder(invoice);
  if (result.ok) revalidatePath("/admin");
  return result;
}

/**
 * Mark an order as paid. Paid is a one-way transition — once an order is
 * marked paid, it can't be reverted to unpaid (paid invoices represent
 * collected revenue and shouldn't be quietly walked back).
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
  revalidatePath("/admin");
  return { ok: true };
}
