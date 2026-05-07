import "server-only";

import { PDFParse } from "pdf-parse";

// Trade-license company-name extractor. Runs the PDF through pdf-parse,
// then walks the text with a small set of heuristics tuned for UAE DET
// licenses. Always returns the raw text alongside so the UI can fall
// back to a manual edit if our guess is wrong.

const ENTITY_SUFFIXES = [
  "L.L.C",
  "LLC",
  "F.Z.C",
  "FZC",
  "F.Z.E",
  "FZE",
  "L.L.C-FZ",
  "LLC-FZ",
  "EST",
  "EST.",
  "CO.",
  "CO",
  "S.P.C",
  "SPC",
];

const LABEL_PATTERNS = [
  /trade\s*name\s*\(?\s*english?\s*\)?[:\s]+(.+)/i,
  /trade\s*name[:\s]+(.+)/i,
  /company\s*name[:\s]+(.+)/i,
  /name\s*of\s*establishment[:\s]+(.+)/i,
  /licensee\s*name[:\s]+(.+)/i,
];

function cleanLine(line: string): string {
  return line
    .replace(/\s+/g, " ")
    .replace(/^[\s|·•:\-–—]+/, "")
    .replace(/[\s|·•:\-–—]+$/, "")
    .trim();
}

function looksLikeCompany(line: string): boolean {
  if (line.length < 4 || line.length > 120) return false;
  const upper = line.toUpperCase();
  return ENTITY_SUFFIXES.some((suffix) => upper.includes(suffix));
}

export interface TradeLicenseExtraction {
  /** Best-guess company name (may be empty if nothing matched). */
  companyName: string;
  /** Raw extracted text — surfaced so the admin can sanity-check. */
  rawText: string;
  /** True when one of the labelled patterns hit; lets the UI signal confidence. */
  highConfidence: boolean;
}

export async function extractTradeLicense(
  buffer: Buffer
): Promise<TradeLicenseExtraction> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  const text =
    typeof result === "string"
      ? result
      : ((result as { text?: string })?.text ?? "");
  const lines = text
    .split(/\r?\n/)
    .map(cleanLine)
    .filter((l) => l.length > 0);

  // 1. Look for explicit labels.
  for (const line of lines) {
    for (const pattern of LABEL_PATTERNS) {
      const match = line.match(pattern);
      if (match && match[1]) {
        const candidate = cleanLine(match[1]);
        if (candidate) {
          return { companyName: candidate, rawText: text, highConfidence: true };
        }
      }
    }
  }

  // 2. Look for a clean line that ends with a known entity suffix.
  for (const line of lines) {
    if (looksLikeCompany(line)) {
      return { companyName: line, rawText: text, highConfidence: false };
    }
  }

  // 3. Fall back: first non-trivial line.
  const fallback = lines.find((l) => l.length >= 6) ?? "";
  return { companyName: fallback, rawText: text, highConfidence: false };
}
