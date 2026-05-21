import { NextResponse } from "next/server";
import { openUploadForServing } from "@/lib/admin/storage";

export const runtime = "nodejs";

// Auth-gated file server for uploaded customer documents (trade licenses,
// wholesaler invoices). Every /admin/* path — this route included — is
// gated by the session-cookie middleware, so reaching here means the
// request is authenticated.
//
// The bytes live either on the local filesystem (dev) or as PRIVATE
// Vercel Blobs (prod); `openUploadForServing` resolves whichever backend
// applies. Private blobs are never exposed at a public URL — they are
// only ever streamed through this route.

interface Params {
  params: Promise<{ path: string[] }>;
}

export async function GET(_request: Request, { params }: Params) {
  const { path: segments } = await params;
  if (!segments?.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // The full stored ref is the joined catch-all segments.
  const ref = segments.join("/");
  const result = await openUploadForServing(ref);

  if (result.kind === "not-found") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (result.kind === "redirect") {
    return NextResponse.redirect(result.url);
  }

  return new NextResponse(result.stream, {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      ...(result.contentLength !== undefined
        ? { "Content-Length": String(result.contentLength) }
        : {}),
      "Content-Disposition": `inline; filename="${result.filename}"`,
      // Private customer document — never let a shared cache keep it.
      "Cache-Control": "private, no-store",
    },
  });
}
