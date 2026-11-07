import type { ErrorCode, ResearchResponse, Result } from "@/contracts";
import { researchRequestSchema } from "@/contracts/validation";
import { z } from "zod";

export const MENTOR_HISTORY_DATABASE_NAME = "vamm-mentor-history-v1";
export const MENTOR_HISTORY_STORE_NAME = "answers";
export const MAX_MENTOR_ANSWERS = 100;
export interface SavedMentorAnswer { id: string; question: string; instrumentIds: string[]; response: ResearchResponse; createdAt: string; }

const text = (limit: number) => z.string().min(1).max(limit).refine(value => value.trim().length > 0);
const timestamp = z.string().datetime({ offset: true }).refine(value => Number.isFinite(Date.parse(value)));
const evidenceSchema = z.object({
  id: z.literal("ev-demo-method"), title: text(500), sourceUrl: z.null(), observedAt: timestamp,
  dataMode: z.literal("synthetic"), datasetVersion: z.literal("vamm-demo-2026-11-06.v1"),
}).strict();
const responseSchema = z.object({
  summary: text(8000), facts: z.array(z.object({ text: text(4000), evidenceIds: z.array(z.literal("ev-demo-method")).min(1).max(1) }).strict()).max(20),
  limitations: z.array(text(2000)).max(20), evidence: z.array(evidenceSchema).min(1).max(1), origin: z.enum(["model", "prewritten"]),
}).strict();
const entrySchema = z.object({
  id: z.string().uuid(), question: text(1000), instrumentIds: researchRequestSchema.shape.instrumentIds,
  response: responseSchema, createdAt: timestamp,
}).strict();
class HistoryFault extends Error {
  constructor(readonly code: ErrorCode, message: string, readonly retryable = false) { super(message); }
}
function corrupt(): never { throw new HistoryFault("STORAGE_UNAVAILABLE", "Saved mentor answers are invalid. They have not been reset or overwritten."); }
function resultError(error: unknown): Result<SavedMentorAnswer[]> {
  const fault = error instanceof HistoryFault ? error : new HistoryFault("STORAGE_UNAVAILABLE", "Saved mentor answers could not be read or changed. Nothing was silently reset.", true);
  return { ok: false, error: { code: fault.code, message: fault.message, retryable: fault.retryable, requestId: null } };
}
function parseEntry(raw: unknown, persisted = false): SavedMentorAnswer {
  const parsed = entrySchema.safeParse(raw);
  if (!parsed.success) {
    if (persisted) corrupt();
    throw new HistoryFault("INVALID_INPUT", "Save a completed synthetic basket answer with a valid question, response and identifier.");
  }
  // Request and response provenance stay separate; this snapshot is never new model context.
  if (!researchRequestSchema.safeParse({ question: parsed.data.question, instrumentIds: parsed.data.instrumentIds }).success) {
    if (persisted) corrupt();
    throw new HistoryFault("INVALID_INPUT", "Choose one or two distinct synthetic baskets and a question of 1–1000 characters.");
  }
  return parsed.data;
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value !== null && typeof value === "object") return "{" + Object.keys(value).sort().map(key => JSON.stringify(key) + ":" + canonical((value as Record<string, unknown>)[key])).join(",") + "}";
  return JSON.stringify(value);
}
function ordered(entries: SavedMentorAnswer[]): SavedMentorAnswer[] {
  return entries.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id));
}
function request<T>(operation: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => { operation.onsuccess = () => resolve(operation.result); operation.onerror = () => reject(operation.error); });
}
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new HistoryFault("STORAGE_UNAVAILABLE", "Mentor history storage is unavailable in this browser.", true)); return; }
    let finished = false;
    const opening = globalThis.indexedDB.open(MENTOR_HISTORY_DATABASE_NAME, 1);
    const timer = setTimeout(fail, 2500);
    function fail() {
      if (finished) return;
      finished = true; clearTimeout(timer);
      reject(new HistoryFault("STORAGE_UNAVAILABLE", "Mentor history storage could not be opened. Close other tabs and retry.", true));
    }
    opening.onerror = fail; opening.onblocked = fail;
    opening.onupgradeneeded = () => { opening.result.createObjectStore(MENTOR_HISTORY_STORE_NAME, { keyPath: "id" }); };
    opening.onsuccess = () => {
      const db = opening.result;
      if (finished) { db.close(); return; }
      finished = true; clearTimeout(timer);
      try {
        if (db.objectStoreNames.length !== 1 || !db.objectStoreNames.contains(MENTOR_HISTORY_STORE_NAME) ||
            db.transaction(MENTOR_HISTORY_STORE_NAME, "readonly").objectStore(MENTOR_HISTORY_STORE_NAME).keyPath !== "id") corrupt();
        db.onversionchange = () => db.close();
        resolve(db);
      } catch (error) { db.close(); reject(error); }
    };
  });
}
async function operation(mode: IDBTransactionMode, mutate?: (entries: SavedMentorAnswer[], store: IDBObjectStore) => Promise<void>): Promise<Result<SavedMentorAnswer[]>> {
  let db: IDBDatabase | undefined;
  try {
    db = await openDatabase();
    const tx = db.transaction(MENTOR_HISTORY_STORE_NAME, mode);
    const done = new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error ?? new Error("Mentor history transaction aborted."));
      tx.onerror = () => { /* onabort reports the final transaction failure. */ };
    });
    void done.catch(() => undefined);
    try {
      const store = tx.objectStore(MENTOR_HISTORY_STORE_NAME);
      if (await request(store.count()) > MAX_MENTOR_ANSWERS) corrupt();
      const raw: unknown[] = await request(store.getAll());
      const entries = raw.map(entry => parseEntry(entry, true));
      if (new Set(entries.map(entry => entry.id)).size !== entries.length) corrupt();
      if (mutate) await mutate(entries, store);
      await done;
      return { ok: true, data: ordered(entries) };
    } catch (error) {
      try { tx.abort(); } catch { /* Already completed or aborted. */ }
      await done.catch(() => undefined);
      throw error;
    }
  } catch (error) { return resultError(error); }
  finally { db?.close(); }
}
export function listMentorAnswers(): Promise<Result<SavedMentorAnswer[]>> { return operation("readonly"); }
export function saveMentorAnswer(raw: SavedMentorAnswer): Promise<Result<SavedMentorAnswer[]>> {
  return operation("readwrite", async (entries, store) => {
    const entry = parseEntry(raw);
    const existing = entries.find(item => item.id === entry.id);
    if (existing) {
      if (canonical(existing) !== canonical(entry)) throw new HistoryFault("IDEMPOTENCY_CONFLICT", "This saved-answer identifier already contains a different snapshot.");
      return;
    }
    if (entries.length >= MAX_MENTOR_ANSWERS) throw new HistoryFault("INVALID_INPUT", "Saved mentor answers are full (100 entries). Delete an answer explicitly before saving another.");
    await request(store.add(entry));
    entries.push(entry);
  });
}
export function deleteMentorAnswer(id: string): Promise<Result<SavedMentorAnswer[]>> {
  return operation("readwrite", async (entries, store) => {
    if (!z.string().uuid().safeParse(id).success) throw new HistoryFault("INVALID_INPUT", "Choose a valid saved-answer identifier.");
    const index = entries.findIndex(entry => entry.id === id);
    if (index < 0) return;
    await request(store.delete(id));
    entries.splice(index, 1);
  });
}
