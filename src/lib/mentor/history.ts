import { z } from "zod";
import {
  MAX_CHAT_IMAGE_BYTES, MAX_CHAT_TEXT_LENGTH, MENTOR_CHAT_DATABASE_NAME, MENTOR_CHAT_STORE_NAME,
  type ChatErrorCode, type ChatImage, type ChatResult, type ChatSession,
} from "./types";

const uuid = z.string().uuid();
const deletedSchema = z.object({ id: uuid, deleted: z.literal(true) }).strict();
const timestamp = z.string().datetime({ offset: true }).refine(value => Number.isFinite(Date.parse(value)));
const imageSchema = z.object({ name: z.string().trim().min(1).max(255), mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]),
  dataUrl: z.string().max(4 * Math.ceil(MAX_CHAT_IMAGE_BYTES / 3) + 32),
}).strict().refine(validImage, "Choose a valid PNG, JPEG or WebP screenshot of at most 2 MiB.");
const messageSchema = z.object({ id: uuid, role: z.enum(["user", "assistant"]), content: z.string().max(MAX_CHAT_TEXT_LENGTH),
  createdAt: timestamp, image: imageSchema.optional(), origin: z.literal("model").optional(),
}).strict().refine(message => (message.content.trim().length > 0 || Boolean(message.image)) &&
  (!message.image || message.role === "user") && (!message.origin || message.role === "assistant"));
const sessionSchema = z.object({ id: uuid, title: z.string().min(1).max(160).refine(value => value.trim().length > 0),
  createdAt: timestamp, updatedAt: timestamp, revision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  messages: z.array(messageSchema),
}).strict().refine(session => {
  let previous = Date.parse(session.createdAt);
  const end = Date.parse(session.updatedAt);
  const ids = new Set<string>();
  if (end < previous) return false;
  for (const message of session.messages) {
    const at = Date.parse(message.createdAt);
    if (ids.has(message.id) || at < previous || at > end) return false;
    ids.add(message.id); previous = at;
  }
  return true;
});

/** Validate only the supported image container/signature; no image or financial analysis runs here. */
function validImage(image: ChatImage): boolean {
  const prefix = "data:" + image.mimeType + ";base64,";
  if (!image.dataUrl.startsWith(prefix)) return false;
  const encoded = image.dataUrl.slice(prefix.length);
  if (!encoded || encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) return false;
  const bytes = encoded.length / 4 * 3 - (encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0);
  if (bytes > MAX_CHAT_IMAGE_BYTES) return false;
  try {
    const header = atob(encoded.slice(0, 24));
    if (image.mimeType === "image/png") return header.startsWith("\x89PNG\r\n\x1a\n");
    if (image.mimeType === "image/jpeg") return header.startsWith("\xff\xd8\xff");
    return header.startsWith("RIFF") && header.slice(8, 12) === "WEBP";
  } catch { return false; }
}
class ChatFault extends Error {
  constructor(readonly code: ChatErrorCode, message: string) { super(message); }
}
function parseSession(raw: unknown, persisted: boolean): ChatSession {
  const parsed = sessionSchema.safeParse(raw);
  if (!parsed.success || (persisted && parsed.data.revision < 1)) throw new ChatFault(persisted ? "CORRUPT_DATA" : "INVALID_INPUT",
    persisted ? "This saved chat is invalid. Its records have not been reset or overwritten." : "Check the chat identifiers, text, timestamps and screenshot before saving.");
  return parsed.data;
}
function failure<T>(error: unknown): ChatResult<T> {
  if (error instanceof ChatFault) return { ok: false, error: { code: error.code, message: error.message } };
  return { ok: false, error: { code: "STORAGE_UNAVAILABLE", message: "Chat history could not be read or saved on this device. Check browser storage and retry; nothing was silently reset." } };
}
function invalidId(id: string): void {
  if (!uuid.safeParse(id).success) throw new ChatFault("INVALID_INPUT", "Choose a valid chat session identifier.");
}
function request<T>(value: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => { value.onsuccess = () => resolve(value.result); value.onerror = () => reject(value.error); });
}
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new ChatFault("STORAGE_UNAVAILABLE", "Chat history storage is unavailable in this browser.")); return; }
    let finished = false;
    const opening = globalThis.indexedDB.open(MENTOR_CHAT_DATABASE_NAME, 1);
    const timer = setTimeout(fail, 2500);
    function fail() {
      if (finished) return;
      finished = true; clearTimeout(timer);
      reject(new ChatFault("STORAGE_UNAVAILABLE", "Chat history storage could not be opened. Close other tabs or check browser storage, then retry."));
    }
    opening.onerror = fail; opening.onblocked = fail;
    opening.onupgradeneeded = () => {
      if (finished) { opening.transaction?.abort(); return; }
      opening.result.createObjectStore(MENTOR_CHAT_STORE_NAME, { keyPath: "id" });
    };
    opening.onsuccess = () => {
      const db = opening.result;
      if (finished) { db.close(); return; }
      finished = true; clearTimeout(timer);
      try {
        if (db.objectStoreNames.length !== 1 || !db.objectStoreNames.contains(MENTOR_CHAT_STORE_NAME)) throw new Error("Unexpected chat schema.");
        const store = db.transaction(MENTOR_CHAT_STORE_NAME, "readonly").objectStore(MENTOR_CHAT_STORE_NAME);
        if (store.keyPath !== "id" || store.autoIncrement) throw new Error("Unexpected chat keys.");
        db.onversionchange = () => db.close(); resolve(db);
      } catch { db.close(); reject(new ChatFault("CORRUPT_DATA", "Chat history storage has an unexpected format. It has not been reset.")); }
    };
  });
}
async function operation<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => Promise<T>): Promise<ChatResult<T>> {
  let db: IDBDatabase | undefined;
  try {
    db = await openDatabase();
    const tx = db.transaction(MENTOR_CHAT_STORE_NAME, mode);
    const done = new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error ?? new Error("Chat transaction aborted."));
      tx.onerror = () => { /* onabort reports the final transaction failure. */ };
    });
    void done.catch(() => undefined);
    try {
      const data = await run(tx.objectStore(MENTOR_CHAT_STORE_NAME));
      await done; return { ok: true, data };
    } catch (error) {
      try { tx.abort(); } catch { /* Already completed or aborted. */ }
      await done.catch(() => undefined); throw error;
    }
  } catch (error) { return failure(error); }
  finally { db?.close(); }
}
function comparable(session: ChatSession): string { return JSON.stringify({ ...session, revision: 0 }); }
function isDeleted(raw: unknown): boolean { return deletedSchema.safeParse(raw).success; }

export function listSessions(): Promise<ChatResult<ChatSession[]>> {
  return operation("readonly", async store => {
    const rows: unknown[] = await request(store.getAll());
    return rows.filter(row => !isDeleted(row)).map(row => parseSession(row, true)).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt) || a.id.localeCompare(b.id));
  });
}
export async function getSession(id: string): Promise<ChatResult<ChatSession | null>> {
  try { invalidId(id); } catch (error) { return failure(error); }
  return operation("readonly", async store => {
    const raw: unknown = await request(store.get(id));
    return raw === undefined || isDeleted(raw) ? null : parseSession(raw, true);
  });
}
export async function saveSession(raw: ChatSession, expectedRevision: number | null): Promise<ChatResult<ChatSession>> {
  let candidate: ChatSession;
  try {
    candidate = parseSession(raw, false);
    if ((expectedRevision === null && candidate.revision !== 0) || (expectedRevision !== null &&
        (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1 || candidate.revision !== expectedRevision)))
      throw new ChatFault("INVALID_INPUT", "Save a new revision-zero chat or use the saved chat's current revision.");
  } catch (error) { return failure(error); }
  return operation("readwrite", async store => {
    const stored: unknown = await request(store.get(candidate.id));
    if (isDeleted(stored)) throw new ChatFault("CONFLICT", "This chat was explicitly deleted. Start a new chat instead of restoring an old save request.");
    const existing = stored === undefined ? null : parseSession(stored, true);
    // A retried identical intent cannot append duplicates, increment twice or replace later history.
    if (existing && comparable(existing) === comparable(candidate)) return existing;
    if ((existing === null && expectedRevision !== null) || (existing !== null && existing.revision !== expectedRevision))
      throw new ChatFault("CONFLICT", "This chat changed in another tab or was deleted. Your unsaved message is still yours; reload the saved chat before continuing.");
    if (existing && (candidate.createdAt !== existing.createdAt || Date.parse(candidate.updatedAt) < Date.parse(existing.updatedAt) ||
        candidate.messages.length < existing.messages.length || existing.messages.some((message, index) => JSON.stringify(message) !== JSON.stringify(candidate.messages[index]))))
      throw new ChatFault("CONFLICT", "Saved messages are immutable. Reload the current chat before adding a new message.");
    const revision = (existing?.revision ?? 0) + 1;
    if (!Number.isSafeInteger(revision)) throw new ChatFault("CONFLICT", "This chat has reached its revision limit. Start a new chat; existing history is preserved.");
    const next = { ...candidate, revision };
    await request(existing ? store.put(next) : store.add(next));
    return next;
  });
}
export async function deleteSession(id: string): Promise<ChatResult<void>> {
  try { invalidId(id); } catch (error) { return failure(error); }
  return operation("readwrite", async store => {
    const raw: unknown = await request(store.get(id));
    if (raw !== undefined && !isDeleted(raw)) parseSession(raw, true);
    // Erase chat content while retaining only its UUID so late retries cannot resurrect it.
    if (!isDeleted(raw)) await request(store.put({ id, deleted: true }));
  });
}
