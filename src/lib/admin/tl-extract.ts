import "server-only";

// Trade-license company-name extractor. Uses pdf2json (pure JS, no worker
// dependency so it works inside Next's bundled server runtime). Walks the
// extracted text with heuristics tuned for Dubai DET licenses, which lay
// text out as `VALUE \t LABEL` (English value first, label after the tab).
// Always returns the raw text alongside so the UI can fall back to a
// manual edit if the guess is wrong.
//
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFParser = require("pdf2json");

type Pdf2JsonText = { R: { T: string }[] };
type Pdf2JsonPage = { Texts: Pdf2JsonText[] };
type Pdf2JsonData = { Pages: Pdf2JsonPage[] };

interface PDFParserType {
  on(event: "pdfParser_dataReady", cb: (data: Pdf2JsonData) => void): void;
  on(event: "pdfParser_dataError", cb: (err: { parserError: Error }) => void): void;
  parseBuffer(buf: Buffer): void;
}

function safeDecode(s: string): string {
  // pdf2json URI-encodes ASCII but leaves Arabic / non-Latin text raw,
  // which makes `decodeURIComponent` throw on malformed sequences. We
  // walk byte-by-byte and only decode valid `%XX` triples.
  return s.replace(/%[0-9A-Fa-f]{2}/g, (match) => {
    try {
      return decodeURIComponent(match);
    } catch {
      return match;
    }
  });
}

function parsePdfText(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser(null, true) as PDFParserType;
    parser.on("pdfParser_dataReady", (data) => {
      const lines: string[] = [];
      for (const page of data.Pages ?? []) {
        const rowMap = new Map<number, { x: number; t: string }[]>();
        const pageWithCoords = page as Pdf2JsonPage & {
          Texts: (Pdf2JsonText & { x: number; y: number })[];
        };
        for (const tx of pageWithCoords.Texts ?? []) {
          const y = Math.round(tx.y * 10) / 10;
          const fragment = tx.R.map((r) => safeDecode(r.T)).join("");
          const row = rowMap.get(y) ?? [];
          row.push({ x: tx.x, t: fragment });
          rowMap.set(y, row);
        }
        const ys = Array.from(rowMap.keys()).sort((a, b) => a - b);
        for (const y of ys) {
          const row = rowMap.get(y)!.sort((a, b) => a.x - b.x);
          // Insert tabs between fragments that have a clear horizontal gap.
          let line = "";
          let prevX = -Infinity;
          for (const seg of row) {
            if (line && seg.x - prevX > 4) line += "\t";
            line += seg.t;
            prevX = seg.x + seg.t.length * 0.5;
          }
          lines.push(line);
        }
      }
      resolve(lines.join("\n"));
    });
    parser.on("pdfParser_dataError", (err) => reject(err.parserError));
    parser.parseBuffer(buffer);
  });
}

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
  "S.P.C",
  "SPC",
];

const LABEL_TOKENS =
  "trade\\s*name|company\\s*name|business\\s*name|name\\s*of\\s*establishment|licensee\\s*name";

// Pattern A: VALUE <tab/spaces> LABEL  ← the DET TL layout
const VALUE_THEN_LABEL = new RegExp(
  `^(.+?)[\\s\\t]+(?:${LABEL_TOKENS})\\s*$`,
  "i"
);
// Pattern B: LABEL : / spaces VALUE   ← classic label-first
const LABEL_THEN_VALUE = new RegExp(
  `(?:${LABEL_TOKENS})\\s*\\(?\\s*english?\\s*\\)?[:\\s\\t]+(.+)`,
  "i"
);

function cleanLine(line: string): string {
  return line
    .replace(/\s+/g, " ")
    .replace(/^[\s|·•:\-–—]+/, "")
    .replace(/[\s|·•:\-–—]+$/, "")
    .trim();
}

function looksLikeCompany(line: string): boolean {
  if (line.length < 4 || line.length > 140) return false;
  const upper = line.toUpperCase();
  return ENTITY_SUFFIXES.some((suffix) => {
    const re = new RegExp(`\\b${suffix.replace(/\./g, "\\.")}\\b`);
    return re.test(upper);
  });
}

function tryExtract(line: string): string | null {
  const valueLabel = line.match(VALUE_THEN_LABEL);
  if (valueLabel?.[1]) {
    const candidate = cleanLine(valueLabel[1]);
    if (candidate && candidate.length >= 4) return candidate;
  }
  const labelValue = line.match(LABEL_THEN_VALUE);
  if (labelValue?.[1]) {
    const candidate = cleanLine(labelValue[1]);
    if (candidate && candidate.length >= 4) return candidate;
  }
  return null;
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
  const text = await parsePdfText(buffer);
  const lines = text.split(/\r?\n/).map((l) => l.trimEnd());
  const cleanedLines = lines.map(cleanLine).filter((l) => l.length > 0);

  // 1. Walk each line with both label/value patterns.
  for (const line of lines) {
    const candidate = tryExtract(line);
    if (candidate) {
      return { companyName: candidate, rawText: text, highConfidence: true };
    }
  }

  // 2. Fall back: any line ending in a known entity suffix.
  for (const line of cleanedLines) {
    if (looksLikeCompany(line)) {
      return { companyName: line, rawText: text, highConfidence: false };
    }
  }

  // 3. Final fallback — first sufficiently long line.
  const fallback = cleanedLines.find((l) => l.length >= 6) ?? "";
  return { companyName: fallback, rawText: text, highConfidence: false };
}
