import { NextResponse } from "next/server";
import {
  readActivityNotes,
  upsertActivityNote,
  writeActivityNotes,
} from "@/lib/admin/activities-store";
import { revalidatePath } from "next/cache";

// Activity notes API — admin-only annotations on business activities.
//
// GET    → list all notes
// POST   → upsert a single note (key + notes; empty notes deletes)
// PUT    → replace the full list (bulk import / restore)
//
// Activities themselves are computed from orders at render time — see
// src/lib/admin/activities.ts. This API is just the notes surface.

export const runtime = "nodejs";

export async function GET() {
  const notes = await readActivityNotes();
  return NextResponse.json({ notes });
}

export async function POST(request: Request) {
  let body: { key?: string; notes?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
  const key = body.key?.trim();
  if (!key) {
    return NextResponse.json(
      { error: "key is required" },
      { status: 400 }
    );
  }
  try {
    await upsertActivityNote(key, body.notes ?? "");
    revalidatePath("/admin/specs");
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Save failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  let body: { notes?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
  if (!Array.isArray(body.notes)) {
    return NextResponse.json(
      { error: "notes must be an array" },
      { status: 400 }
    );
  }
  // Light validation: keep only entries with key + string notes.
  const cleaned = (body.notes as unknown[])
    .filter(
      (n): n is { key: string; notes: string; updatedAt?: string } =>
        typeof n === "object" &&
        n !== null &&
        typeof (n as { key?: unknown }).key === "string" &&
        typeof (n as { notes?: unknown }).notes === "string"
    )
    .map((n) => ({
      key: n.key.trim(),
      notes: n.notes.trim(),
      updatedAt: n.updatedAt ?? new Date().toISOString(),
    }))
    .filter((n) => n.key.length > 0 && n.notes.length > 0);

  try {
    await writeActivityNotes(cleaned);
    revalidatePath("/admin/specs");
    return NextResponse.json({ ok: true, count: cleaned.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Save failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
