/* eslint-disable jsx-a11y/alt-text */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Order } from "@/lib/admin/orders";

// Colours mirror src/app/globals.css. We hardcode them here because react-pdf
// renders entirely outside the browser and can't resolve CSS variables.
const COLOURS = {
  text: "#0d131a",
  textMuted: "#56585e",
  textFaint: "#9ba0a8",
  primary: "#f15a24",
  primaryLight: "#fde4d8",
  border: "#e5e7eb",
  bgSubtle: "#f7f8fa",
  coral: "#e75951",
};

const FROM = {
  name: "My Ejari (FZC)",
  addressLine1: "Sharjah Research, Technology",
  addressLine2: "and Innovation Park, Sharjah",
  phone: "+971 58 554 0076",
  email: "admin@myejari.com",
  web: "myejari.ae",
};

const PAYMENT_DETAILS = {
  accountName: "MyEjari (FZC)",
  bank: "Al Maryah Community Bank",
  iban: "AE10 0973 0033 9498 0000 001",
};

const DISCLAIMER =
  "By proceeding with the issuance of the Ejari certificate, the undersigned acknowledges and agrees that MyEjari is acting solely as a facilitator in the process of obtaining the Ejari. MyEjari is not responsible for any delays, cancellations, or disputes that may occur due to actions taken by third-party entities.";

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 60,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: COLOURS.text,
  },

  // ── Header ───────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandBadge: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: COLOURS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandBadgeText: { color: "white", fontSize: 14, fontFamily: "Helvetica-Bold" },
  brandName: { fontSize: 13, fontFamily: "Helvetica-Bold" },

  invoiceTitleBlock: { alignItems: "flex-end" },
  invoiceLabel: {
    fontSize: 8,
    letterSpacing: 1.4,
    color: COLOURS.textMuted,
  },
  invoiceNumber: {
    marginTop: 4,
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
  },

  // ── Meta row (issue / due / amount) ─────────────────────
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 36,
    paddingBottom: 18,
    borderBottomWidth: 0.6,
    borderBottomColor: COLOURS.border,
  },
  metaCol: { flexDirection: "column", flex: 1 },
  metaColRight: {
    flexDirection: "column",
    flex: 1,
    alignItems: "flex-end",
  },
  metaLabel: {
    fontSize: 8,
    letterSpacing: 1.2,
    color: COLOURS.textMuted,
  },
  metaValue: {
    marginTop: 5,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },

  // ── From / Billed-to ────────────────────────────────────
  partiesRow: {
    flexDirection: "row",
    marginTop: 22,
    paddingBottom: 18,
    borderBottomWidth: 0.6,
    borderBottomColor: COLOURS.border,
  },
  partyCol: { flex: 1, paddingRight: 12 },
  partyLabel: {
    fontSize: 8,
    letterSpacing: 1.2,
    color: COLOURS.textMuted,
    marginBottom: 5,
  },
  partyName: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  partyLine: { fontSize: 10, color: COLOURS.textMuted, lineHeight: 1.4 },

  // ── Line items ──────────────────────────────────────────
  lineHeader: {
    flexDirection: "row",
    paddingTop: 18,
    paddingBottom: 8,
    borderBottomWidth: 0.6,
    borderBottomColor: COLOURS.border,
  },
  colDescription: { flex: 4 },
  colRate: { flex: 1, textAlign: "right" },
  colQty: { flex: 0.7, textAlign: "right" },
  colAmount: { flex: 1.4, textAlign: "right" },
  colHeader: {
    fontSize: 8,
    letterSpacing: 1.2,
    color: COLOURS.textMuted,
    fontFamily: "Helvetica-Bold",
  },

  lineRow: {
    flexDirection: "row",
    paddingTop: 14,
    paddingBottom: 14,
    alignItems: "flex-start",
  },
  lineDescTitle: { fontSize: 11, fontFamily: "Helvetica-Bold" },

  tagsRow: { flexDirection: "row", marginTop: 8, gap: 6 },
  tag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    fontSize: 8.5,
  },
  tagPrimary: { backgroundColor: COLOURS.primaryLight, color: COLOURS.primary },
  tagNeutral: { backgroundColor: "#f1f2f4", color: COLOURS.textMuted },

  lineCellNum: { fontSize: 11 },

  // ── Totals ──────────────────────────────────────────────
  totalsBlock: {
    flexDirection: "column",
    alignItems: "flex-end",
    marginTop: 4,
    paddingTop: 14,
    borderTopWidth: 0.6,
    borderTopColor: COLOURS.border,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: "100%",
    paddingVertical: 4,
  },
  totalsLabel: {
    fontSize: 10,
    color: COLOURS.textMuted,
    width: 90,
    textAlign: "right",
    paddingRight: 14,
  },
  totalsValue: {
    fontSize: 11,
    width: 110,
    textAlign: "right",
  },
  totalDueLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLOURS.text,
    width: 90,
    textAlign: "right",
    paddingRight: 14,
  },
  totalDueValue: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    width: 110,
    textAlign: "right",
  },

  // ── Payment details box ─────────────────────────────────
  payBox: {
    marginTop: 30,
    padding: 18,
    borderRadius: 6,
    backgroundColor: COLOURS.bgSubtle,
  },
  payTitle: {
    fontSize: 8.5,
    letterSpacing: 1.4,
    fontFamily: "Helvetica-Bold",
    color: COLOURS.text,
    marginBottom: 12,
  },
  payCols: { flexDirection: "row" },
  payCol: { flex: 1 },
  payColLabel: {
    fontSize: 8.5,
    color: COLOURS.textMuted,
    marginBottom: 3,
  },
  payColValue: { fontSize: 10.5, fontFamily: "Helvetica-Bold" },
  payIban: { marginTop: 12 },

  // ── Disclaimer ──────────────────────────────────────────
  disclaimer: {
    marginTop: 22,
    fontSize: 8.5,
    color: COLOURS.textMuted,
    lineHeight: 1.5,
  },
  disclaimerLabel: { fontFamily: "Helvetica-Bold", color: COLOURS.text },
});

const AED = (amount: number) =>
  amount.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatLongDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

interface InvoicePdfProps {
  order: Order;
}

/**
 * Pixel-accurate recreation of the existing INV0123 invoice template using
 * built-in PDF fonts. Renders entirely server-side via @react-pdf/renderer.
 */
export function InvoicePdf({ order }: InvoicePdfProps) {
  const validity = order.validity ?? "1 year";
  const inspectionLabel =
    order.inspectionIncluded === false ? "No inspection" : "With inspection";
  const location = order.serviceLocation || "Dubai";
  const amount = order.myEjariPrice;

  return (
    <Document title={`Invoice ${order.invoice}`} author="MyEjari">
      <Page size="A4" style={styles.page}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>M</Text>
            </View>
            <Text style={styles.brandName}>MyEjari</Text>
          </View>
          <View style={styles.invoiceTitleBlock}>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{order.invoice}</Text>
          </View>
        </View>

        {/* ── Meta row ── */}
        <View style={styles.metaRow}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>ISSUE DATE</Text>
            <Text style={styles.metaValue}>{formatLongDate(order.date)}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>DUE</Text>
            <Text style={styles.metaValue}>On receipt</Text>
          </View>
          <View style={styles.metaColRight}>
            <Text style={styles.metaLabel}>AMOUNT DUE</Text>
            <Text style={styles.metaValue}>AED {AED(amount)}</Text>
          </View>
        </View>

        {/* ── Parties ── */}
        <View style={styles.partiesRow}>
          <View style={styles.partyCol}>
            <Text style={styles.partyLabel}>FROM</Text>
            <Text style={styles.partyName}>{FROM.name}</Text>
            <Text style={styles.partyLine}>{FROM.addressLine1}</Text>
            <Text style={styles.partyLine}>{FROM.addressLine2}</Text>
            <Text style={styles.partyLine}>{FROM.phone}</Text>
            <Text style={styles.partyLine}>{FROM.email}</Text>
            <Text style={styles.partyLine}>{FROM.web}</Text>
          </View>
          <View style={styles.partyCol}>
            <Text style={styles.partyLabel}>BILLED TO</Text>
            <Text style={styles.partyName}>{order.company}</Text>
            {order.contactMobile ? (
              <Text style={styles.partyLine}>{order.contactMobile}</Text>
            ) : null}
          </View>
        </View>

        {/* ── Line items header ── */}
        <View style={styles.lineHeader}>
          <Text style={[styles.colHeader, styles.colDescription]}>
            DESCRIPTION
          </Text>
          <Text style={[styles.colHeader, styles.colRate]}>RATE</Text>
          <Text style={[styles.colHeader, styles.colQty]}>QTY</Text>
          <Text style={[styles.colHeader, styles.colAmount]}>AMOUNT</Text>
        </View>

        {/* ── Line item ── */}
        <View style={styles.lineRow}>
          <View style={styles.colDescription}>
            <Text style={styles.lineDescTitle}>
              Virtual Office with Ejari Facilitation
            </Text>
            <View style={styles.tagsRow}>
              <Text style={[styles.tag, styles.tagPrimary]}>{location}</Text>
              <Text style={[styles.tag, styles.tagNeutral]}>
                {validity} validity
              </Text>
              <Text style={[styles.tag, styles.tagNeutral]}>
                {inspectionLabel}
              </Text>
            </View>
          </View>
          <Text style={[styles.lineCellNum, styles.colRate]}>{AED(amount)}</Text>
          <Text style={[styles.lineCellNum, styles.colQty]}>1</Text>
          <Text style={[styles.lineCellNum, styles.colAmount]}>
            {AED(amount)}
          </Text>
        </View>

        {/* ── Totals ── */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{AED(amount)}</Text>
          </View>
          <View style={[styles.totalsRow, { marginTop: 6 }]}>
            <Text style={styles.totalDueLabel}>Total due</Text>
            <Text style={styles.totalDueValue}>AED {AED(amount)}</Text>
          </View>
        </View>

        {/* ── Payment details ── */}
        <View style={styles.payBox}>
          <Text style={styles.payTitle}>PAYMENT DETAILS</Text>
          <View style={styles.payCols}>
            <View style={styles.payCol}>
              <Text style={styles.payColLabel}>Account name</Text>
              <Text style={styles.payColValue}>
                {PAYMENT_DETAILS.accountName}
              </Text>
            </View>
            <View style={styles.payCol}>
              <Text style={styles.payColLabel}>Bank</Text>
              <Text style={styles.payColValue}>{PAYMENT_DETAILS.bank}</Text>
            </View>
          </View>
          <View style={styles.payIban}>
            <Text style={styles.payColLabel}>IBAN</Text>
            <Text style={styles.payColValue}>{PAYMENT_DETAILS.iban}</Text>
          </View>
        </View>

        {/* ── Disclaimer ── */}
        <Text style={styles.disclaimer}>
          <Text style={styles.disclaimerLabel}>Disclaimer. </Text>
          {DISCLAIMER}
        </Text>
      </Page>
    </Document>
  );
}
