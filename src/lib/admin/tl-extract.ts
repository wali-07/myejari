import "server-only";

import Anthropic from "@anthropic-ai/sdk";

// Trade-license company-name extractor. Two paths:
//
//   1. pdf2json (fast/free) — walks the PDF's text layer with regex tuned
//      for Dubai DET licenses. Works for digitally-generated PDFs; useless
//      for screenshots or scanned image-only PDFs.
//   2. Claude Haiku Vision — handles screenshots, photos, and image-only
//      PDFs. Costs ~$0.005 per call. Used as primary path for images and
//      as a fallback for PDFs whose text layer is empty.
//
// Both paths return a TradeLicenseExtraction; the UI's manual-edit field
// is always shown so the admin can override a wrong guess.
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
  /**
   * Business activity (or activities, comma-separated) printed on the
   * trade license. Vision-only — pdf2json doesn't try to parse this.
   */
  activity?: string;
  /**
   * Activity code(s) from the trade license, comma-separated if multiple.
   * Vision-only.
   */
  activityCode?: string;
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

// ─── Vision path ─────────────────────────────────────────────────────
//
// Single-shot Claude Haiku call. Returns structured JSON so we can pull
// company name, activity, and activity code in one round-trip. JSON
// output is more brittle than a single string but the savings on round-
// trips and the structured-output reliability of Haiku 4.5 make it worth
// it. Defensive parsing handles the occasional fence/preamble.

const VISION_MODEL = "claude-haiku-4-5";
const VISION_SYSTEM = `
You extract structured data from UAE trade license documents.

Return ONLY a valid JSON object with EXACTLY these three fields. No
markdown fences, no commentary, no extra fields:

{
  "companyName": "<English trade name as printed, no quotes, or UNKNOWN>",
  "activity": "<ALL English activities printed on the license, comma-separated, in the order they appear, or UNKNOWN>",
  "activityCode": "<ALL activity codes printed on the license, comma-separated in the SAME order as the activities, or UNKNOWN>"
}

Important rules:

- UAE trade licenses typically list 1–5 business activities, sometimes
  more. **You MUST include every activity that is clearly printed on the
  license**, not just the first one. Look for them in the activities /
  business activities section — they are often numbered or listed in a
  table with their codes alongside.
- If you can identify N activities, the activityCode field should have
  N codes in the same order. If only some have codes printed, write
  the missing code as a literal "—" placeholder so the count still
  matches (e.g. "Trading, Consulting, Software" + "1234, —, 5678").
- Use the English names exactly as printed on the license. Do not
  translate Arabic-only activities — skip them.
- Do NOT invent activities. Only include what is actually printed.
- If a field is not clearly readable on the license, use "UNKNOWN" for
  that field.
`.trim();

const VISION_IMAGE_MIME = new Set<
  "image/jpeg" | "image/png" | "image/gif" | "image/webp"
>(["image/jpeg", "image/png", "image/gif", "image/webp"]);

type VisionMime =
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/webp"
  | "application/pdf";

/** True when the file's MIME is one Claude Vision can accept directly. */
export function isVisionCompatible(mimeType: string): boolean {
  return (
    mimeType === "application/pdf" ||
    VISION_IMAGE_MIME.has(mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp")
  );
}

/**
 * Defensive JSON extractor — pulls the first `{...}` block from a string.
 * Handles cases where the model wrapped the JSON in markdown fences or
 * preamble, which Haiku 4.5 occasionally still does despite instructions.
 */
function parseVisionJson(text: string): {
  companyName?: string;
  activity?: string;
  activityCode?: string;
} | null {
  if (!text) return null;
  // Try direct parse first (clean output)
  try {
    return JSON.parse(text);
  } catch {
    /* fall through */
  }
  // Strip fences / preamble — look for first { and last }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function normaliseField(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const cleaned = raw.trim().replace(/^["']|["']$/g, "");
  if (!cleaned || /^unknown\.?$/i.test(cleaned)) return undefined;
  return cleaned;
}

/**
 * Run the uploaded file through Claude Haiku Vision and return the
 * extracted company name, activity, and activity code. Resilient by
 * design — every error path returns an empty-name extraction so the
 * upload itself never fails because of an OCR hiccup; the admin can
 * always type the values manually.
 */
export async function extractTradeLicenseVision(
  buffer: Buffer,
  mimeType: string
): Promise<TradeLicenseExtraction> {
  const empty: TradeLicenseExtraction = {
    companyName: "",
    rawText: "",
    highConfidence: false,
  };

  if (!process.env.ANTHROPIC_API_KEY) return empty;
  if (!isVisionCompatible(mimeType)) return empty;

  const data = buffer.toString("base64");
  const mime = mimeType as VisionMime;

  const block =
    mime === "application/pdf"
      ? {
          type: "document" as const,
          source: {
            type: "base64" as const,
            media_type: "application/pdf" as const,
            data,
          },
        }
      : {
          type: "image" as const,
          source: { type: "base64" as const, media_type: mime, data },
        };

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: VISION_MODEL,
      max_tokens: 800, // structured output needs more headroom than name-only
      system: VISION_SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            block,
            {
              type: "text",
              text:
                "Extract the company name and ALL activities (with their " +
                "codes if printed) from this UAE trade license. Most " +
                "licenses list multiple activities — make sure you include " +
                "every one that appears, not just the first. Return only " +
                "the JSON object described in the system prompt.",
            },
          ],
        },
      ],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    const parsed = parseVisionJson(text);
    if (!parsed) return { ...empty, rawText: text };

    const companyName = normaliseField(parsed.companyName) ?? "";
    const activity = normaliseField(parsed.activity);
    const activityCode = normaliseField(parsed.activityCode);

    return {
      companyName,
      rawText: text,
      highConfidence: companyName.length > 0,
      activity,
      activityCode,
    };
  } catch (err) {
    console.error("[tl-extract] vision call failed:", err);
    return empty;
  }
}
