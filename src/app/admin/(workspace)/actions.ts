"use server";

import { revalidatePath } from "next/cache";
import {
  calculateGatewayFees,
  nextInvoiceNumber,
  type Order,
  type PaymentMethod,
  type PaymentStatus,
} from "@/lib/admin/orders";
import { readOrders, writeOrders } from "@/lib/admin/orders-store";

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

/** Toggle an order's payment status. Used by the Mark Paid / Mark Unpaid pill. */
export async function setPaymentStatus(
  invoice: string,
  status: PaymentStatus
): Promise<{ ok: boolean; error?: string }> {
  if (status !== "paid" && status !== "unpaid")
    return { ok: false, error: "Invalid status" };

  const orders = await readOrders();
  const idx = orders.findIndex((o) => o.invoice === invoice);
  if (idx < 0) return { ok: false, error: "Order not found" };

  orders[idx] = { ...orders[idx], paymentStatus: status };
  await writeOrders(orders);
  revalidatePath("/admin");
  return { ok: true };
}
