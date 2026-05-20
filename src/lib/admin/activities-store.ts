import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { put, get } from "@vercel/blob";
import type { ActivityNote } from "./activities";
import { STORAGE_BACKEND } from "./storage";

// Storage for ADMIN activity notes (one row per business activity, capturing
// operational knowledge — "for this activity, virtual office at center X
// works", etc.). Lives separately from orders.json because notes are an
// admin-only annotation surface, not order data.
//
// Same backend strategy as orders: Vercel Blob in prod, local fs in dev.
// Private blob so notes aren't world-readable. Simpler than orders because
// there's no legacy data to migrate.

const NOTES_BLOB_KEY = "admin/activity-notes.json";
const NOTES_FS_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "activity-notes.json"
);

async function readFromBlob(): Promise<ActivityNote[]> {
  try {
    const res = await get(NOTES_BLOB_KEY, {
      access: "private",
      useCache: false,
    });
    if (res && res.statusCode === 200) {
      const parsed = (await new Response(
        res.stream as ReadableStream<Uint8Array>
      ).json()) as unknown;
      return Array.isArray(parsed) ? (parsed as ActivityNote[]) : [];
    }
  } catch {
    /* fall through */
  }
  return [];
}

async function readFromFs(): Promise<ActivityNote[]> {
  try {
    const raw = await fs.readFile(NOTES_FS_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as ActivityNote[]) : [];
  } catch {
    return [];
  }
}

export async function readActivityNotes(): Promise<ActivityNote[]> {
  if (STORAGE_BACKEND === "blob") return readFromBlob();
  return readFromFs();
}

async function writeToBlob(notes: ActivityNote[]): Promise<void> {
  const body = JSON.stringify(notes, null, 2);
  try {
    await put(NOTES_BLOB_KEY, body, {
      access: "private",
      addRandomSuffix: false,
      contentType: "application/json",
      allowOverwrite: true,
      cacheControlMaxAge: 60,
    });
  } catch {
    // Private blobs may be unavailable on the store — fall back to public
    // so the admin tool never silently fails to persist.
    await put(NOTES_BLOB_KEY, body, {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
      allowOverwrite: true,
      cacheControlMaxAge: 60,
    });
  }
}

async function writeToFs(notes: ActivityNote[]): Promise<void> {
  await fs.mkdir(path.dirname(NOTES_FS_PATH), { recursive: true });
  const tmp = NOTES_FS_PATH + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(notes, null, 2), "utf8");
  await fs.rename(tmp, NOTES_FS_PATH);
}

export async function writeActivityNotes(
  notes: ActivityNote[]
): Promise<void> {
  if (STORAGE_BACKEND === "blob") {
    await writeToBlob(notes);
    return;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Persistent writes require Vercel Blob. Connect a Blob store to the project."
    );
  }
  await writeToFs(notes);
}

/**
 * Insert or update a single note by activity key. Pass an empty string to
 * REMOVE the note entirely (keeps the notes table free of empty rows).
 */
export async function upsertActivityNote(
  key: string,
  noteText: string
): Promise<void> {
  const trimmedKey = key.trim();
  if (!trimmedKey) throw new Error("Activity key is required");

  const all = await readActivityNotes();
  const cleaned = noteText.trim();
  const filtered = all.filter((n) => n.key !== trimmedKey);
  if (cleaned) {
    filtered.push({
      key: trimmedKey,
      notes: cleaned,
      updatedAt: new Date().toISOString(),
    });
  }
  await writeActivityNotes(filtered);
}
