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
  //   PDF  → pdf2json first (fast/free, works on text-layer PDFs).
  //          Fall back to Vision if it returned nothing.
  //   IMG  → Vision directly. pdf2json doesn't speak images.
  //
  // Both paths log errors and return an empty companyName instead of
  // failing — the admin can always type the name manually.
  let extraction = { companyName: "", rawText: "", highConfidence: false };
  const mimeType = file.type || "application/octet-stream";

  if (isPdf) {
    try {
      extraction = await extractTradeLicense(buffer);
    } catch (err) {
      console.error("[upload-tl] pdf2json extraction failed:", err);
    }
    // Image-only PDF (no text layer) → Vision fallback.
    if (!extraction.companyName) {
      const vision = await extractTradeLicenseVision(
        buffer,
        "application/pdf"
      );
      if (vision.companyName) extraction = vision;
    }
  } else if (isImage && isVisionCompatible(mimeType)) {
    extraction = await extractTradeLicenseVision(buffer, mimeType);
  }

  return NextResponse.json({
    fileName,
    storedPath: stored.ref,
    companyName: extraction.companyName,
    highConfidence: extraction.highConfidence,
  });
}
