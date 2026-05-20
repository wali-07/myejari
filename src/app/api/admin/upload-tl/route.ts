import { NextResponse } from "next/server";
import path from "node:path";
import {
  extractTradeLicense,
  extractTradeLicenseVision,
  isVisionCompatible,
} from "@/lib/admin/tl-extract";
import { putUpload } from "@/lib/admin/storage";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTS = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".heic",
  ".heif",
];

function safeName(original: string): string {
  const ext = path.extname(original).toLowerCase();
  const base = path
    .basename(original, ext)
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .slice(0, 60);
  const stamp = Date.now();
  return `${stamp}-${base}${ext || ".bin"}`;
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart body" },
      { status: 400 }
    );
  }

  const file = form.get("tradeLicense");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "tradeLicense file is required" },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File is larger than 10 MB" },
      { status: 413 }
    );
  }

  const lowerName = file.name.toLowerCase();
  const ext = (path.extname(lowerName) || "").toLowerCase();
  const isPdf = file.type.includes("pdf") || lowerName.endsWith(".pdf");
  const isImage =
    file.type.startsWith("image/") || ALLOWED_EXTS.includes(ext);

  if (!isPdf && !isImage) {
    return NextResponse.json(
      { error: "Upload a PDF or an image of the trade license" },
      { status: 415 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = safeName(file.name);
  const key = `trade-licenses/${fileName}`;
  const stored = await putUpload(key, buffer, file.type || "application/octet-stream");

  // Extraction strategy:
  //   PDF  → pdf2json first (fast/free, gets company name from text-layer
  //          PDFs). THEN Vision regardless, for activity + activity code
  //          (pdf2json doesn't try to parse those). Vision also fills in
  //          the company name if pdf2json found nothing (image-only PDF).
  //   IMG  → Vision directly. pdf2json doesn't speak images.
  //
  // Cost: ~$0.005 per upload regardless of input type. Negligible.
  // Resilience: every code path returns empty fields instead of failing.
  let extraction: {
    companyName: string;
    rawText: string;
    highConfidence: boolean;
    activity?: string;
    activityCode?: string;
  } = { companyName: "", rawText: "", highConfidence: false };
  const mimeType = file.type || "application/octet-stream";

  if (isPdf) {
    try {
      extraction = await extractTradeLicense(buffer);
    } catch (err) {
      console.error("[upload-tl] pdf2json extraction failed:", err);
    }
    // Always run Vision on PDFs to get activity/activityCode. Also
    // backfills companyName if pdf2json came up empty.
    const vision = await extractTradeLicenseVision(
      buffer,
      "application/pdf"
    );
    extraction = {
      // Prefer pdf2json's company name (regex-tuned for DET layout) when
      // both agree it's present; fall back to Vision's.
      companyName: extraction.companyName || vision.companyName,
      rawText: extraction.rawText || vision.rawText,
      highConfidence: extraction.highConfidence || vision.highConfidence,
      activity: vision.activity, // Vision-only
      activityCode: vision.activityCode, // Vision-only
    };
  } else if (isImage && isVisionCompatible(mimeType)) {
    extraction = await extractTradeLicenseVision(buffer, mimeType);
  }

  return NextResponse.json({
    fileName,
    storedPath: stored.ref,
    companyName: extraction.companyName,
    highConfidence: extraction.highConfidence,
    activity: extraction.activity,
    activityCode: extraction.activityCode,
  });
}
