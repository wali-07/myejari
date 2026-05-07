import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { extractTradeLicense } from "@/lib/admin/tl-extract";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "data", "admin-uploads");
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function safeName(original: string): string {
  const ext = path.extname(original).toLowerCase();
  const base = path
    .basename(original, ext)
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .slice(0, 60);
  const stamp = Date.now();
  // Default to .pdf extension only if none was provided.
  return `${stamp}-${base}${ext || ".bin"}`;
}

// POST /api/admin/upload-tl
// Accepts a multipart/form-data with `tradeLicense` file, saves it to
// data/admin-uploads/, and returns the extracted company name plus the
// stored file path so the form can submit it alongside the order.
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
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "tradeLicense file is required" },
      { status: 400 }
    );
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File is larger than 10 MB" },
      { status: 413 }
    );
  }
  // Accept PDFs and common image formats. PDFs go through pdf2json;
  // images are stored as-is and the admin types the company name in
  // (image OCR isn't wired up yet).
  const lowerName = file.name.toLowerCase();
  const isPdf = file.type.includes("pdf") || lowerName.endsWith(".pdf");
  const isImage =
    file.type.startsWith("image/") ||
    /\.(png|jpg|jpeg|webp|heic|heif)$/i.test(lowerName);

  if (!isPdf && !isImage) {
    return NextResponse.json(
      { error: "Upload a PDF or an image of the trade license" },
      { status: 415 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Save the file before parsing so we have a record even if extraction fails.
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const fileName = safeName(file.name);
  const fullPath = path.join(UPLOAD_DIR, fileName);
  await fs.writeFile(fullPath, buffer);

  let extraction = { companyName: "", rawText: "", highConfidence: false };
  if (isPdf) {
    try {
      extraction = await extractTradeLicense(buffer);
    } catch (err) {
      console.error("[upload-tl] extraction failed:", err);
    }
  }

  return NextResponse.json({
    fileName,
    storedPath: path.relative(process.cwd(), fullPath),
    companyName: extraction.companyName,
    highConfidence: extraction.highConfidence,
  });
}
