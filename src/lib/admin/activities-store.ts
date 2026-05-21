import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import type { ActivityNote } from "./activities";
import { STORAGE_BACKEND, createVersionedBlobDoc } from "./storage";

// Storage for ADMIN activity notes (one row per business activity, capturing
// operational knowledge — "for this activity, virtual office at center X
// works", etc.). Lives separately from the orders document because notes
// are an admin-only annotation surface, not order data.
//
// Same backend strategy as orders: Vercel Blob in prod, local fs in dev.
// On Blob it uses the versioned-document store (see `createVersionedBlobDoc`
// in storage.ts) so a saved note is strongly consistent — it can never be
// served stale from a CDN edge after a write.

const NOTES_FS_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "activity-notes.json"
);

const notesDoc = createVersionedBlobDoc({
  logPrefix: "admin/activity-notes-log/",
  legacyKey: "admin/activity-notes.json",
  keepVersions: 10,
  fallback: () => [],
});

async function readFromFs(): Promise<ActivityNote[]> {
  try {
    const raw = await fs.readFile(NOTES_FS_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as ActivityNote[]) : [];
  } catch {
    return [];
  }
}

async function writeToFs(notes: ActivityNote[]): Promise<void> {
  await fs.mkdir(path.dirname(NOTES_FS_PATH), { recursive: true });
  const tmp = NOTES_FS_PATH + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(notes, null, 2), "utf8");
  await fs.rename(tmp, NOTES_FS_PATH);
}

export async function readActivityNotes(): Promise<ActivityNote[]> {
  if (STORAGE_BACKEND === "blob") {
    const raw = await notesDoc.read();
    return Array.isArray(raw) ? (raw as ActivityNote[]) : [];
  }
  return readFromFs();
}

export async function writeActivityNotes(
  notes: ActivityNote[]
): Promise<void> {
  if (STORAGE_BACKEND === "blob") {
    await notesDoc.write(notes);
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
