import { NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

export const runtime = "nodejs";

// Files under data/admin-uploads/ are served by this gated route.
// Path traversal is impossible because we resolve the requested path
// and reject anything that escapes the uploads directory.
const ROOT = path.resolve(process.cwd(), "data", "admin-uploads");

const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".heif": "image/heif",
};

interface Params {
  params: Promise<{ path: string[] }>;
}

export async function GET(_request: Request, { params }: Params) {
  const { path: segments } = await params;
  if (!segments?.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const requested = path.resolve(ROOT, ...segments);
  if (!requested.startsWith(ROOT + path.sep) && requested !== ROOT) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let stat;
  try {
    stat = await fs.stat(requested);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!stat.isFile()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = path.extname(requested).toLowerCase();
  const mime = MIME_BY_EXT[ext] ?? "application/octet-stream";

  const nodeStream = createReadStream(requested);
  // Bridge Node's Readable to a Web ReadableStream so it works as a
  // Response body in the App Router.
  const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream;

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Content-Length": String(stat.size),
      "Content-Disposition": `inline; filename="${path.basename(requested)}"`,
      "Cache-Control": "no-store",
    },
  });
}
