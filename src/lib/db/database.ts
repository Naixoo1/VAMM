import type { ErrorCode, Result } from "@/contracts";
import { idSchema } from "@/contracts/validation";
import { z } from "zod";

export const DATABASE_NAME = "vamm-demo-v2";
export const STORE_NAMES = ["metadata", "sessions", "turns", "requestOutcomes"] as const;
export type StoreName = typeof STORE_NAMES[number];
export const ownerRecordSchema = z.object({ key: z.literal("owner"), value: z.string().uuid() }).strict();

export class RepositoryFault extends Error {
  constructor(public readonly code: ErrorCode, message: string, public readonly retryable = false) {
    super(message);
  }
}

export function corrupt(): never {
  throw new RepositoryFault("STORAGE_UNAVAILABLE", "Stored simulation data is invalid. Your history has not been reset.");
}

export function validId(value: unknown): string {
  const parsed = idSchema.safeParse(value);
  if (!parsed.success) throw new RepositoryFault("INVALID_INPUT", "A valid identifier is required.");
  return parsed.data;
}

export function newId(): string {
  if (typeof globalThis.crypto?.randomUUID !== "function") {
    throw new RepositoryFault("STORAGE_UNAVAILABLE", "Secure local identifiers are unavailable.");
  }
  return globalThis.crypto.randomUUID();
}

export function request<T>(operation: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    operation.onsuccess = () => resolve(operation.result);
    operation.onerror = () => reject(operation.error ?? new Error("IndexedDB request failed."));
  });
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new RepositoryFault("STORAGE_UNAVAILABLE", "Local storage is unavailable in this browser.", true));
      return;
    }
    let finished = false;
    const opening = globalThis.indexedDB.open(DATABASE_NAME, 1);
    const timeout = setTimeout(() => fail(), 2500);
    function fail() {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      reject(new RepositoryFault("STORAGE_UNAVAILABLE", "Local storage could not be opened. Close other VAMM tabs and retry.", true));
    }
    opening.onblocked = fail;
    opening.onerror = fail;
    opening.onupgradeneeded = () => {
      const db = opening.result;
      db.createObjectStore("metadata", { keyPath: "key" });
      db.createObjectStore("sessions", { keyPath: ["owner", "id"] }).createIndex("byOwner", "owner");
      db.createObjectStore("turns", { keyPath: ["owner", "sessionId", "turnIndex"] }).createIndex("bySession", ["owner", "sessionId"]);
      db.createObjectStore("requestOutcomes", { keyPath: ["owner", "scope", "sessionId", "requestId"] });
    };
    opening.onsuccess = () => {
      const db = opening.result;
      if (finished) { db.close(); return; }
      finished = true;
      clearTimeout(timeout);
      try {
        if (db.objectStoreNames.length !== STORE_NAMES.length || STORE_NAMES.some(name => !db.objectStoreNames.contains(name))) corrupt();
        const tx = db.transaction([...STORE_NAMES], "readonly");
        const expected = { metadata: "key", sessions: ["owner", "id"], turns: ["owner", "sessionId", "turnIndex"], requestOutcomes: ["owner", "scope", "sessionId", "requestId"] };
        for (const name of STORE_NAMES) {
          if (JSON.stringify(tx.objectStore(name).keyPath) !== JSON.stringify(expected[name])) corrupt();
        }
        const sessions = tx.objectStore("sessions");
        const turns = tx.objectStore("turns");
        if (!sessions.indexNames.contains("byOwner") || sessions.index("byOwner").keyPath !== "owner") corrupt();
        if (!turns.indexNames.contains("bySession") || JSON.stringify(turns.index("bySession").keyPath) !== JSON.stringify(["owner", "sessionId"])) corrupt();
        db.onversionchange = () => db.close();
        resolve(db);
      } catch (error) {
        db.close();
        reject(error);
      }
    };
  });
}

export async function transaction<T>(db: IDBDatabase, stores: StoreName[], mode: IDBTransactionMode, work: (tx: IDBTransaction) => Promise<T>): Promise<T> {
  const tx = db.transaction(stores, mode);
  const done = new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error("Local storage transaction aborted."));
    tx.onerror = () => { /* onabort reports the final transaction failure. */ };
  });
  // Register a rejection handler immediately, including while request work is pending.
  void done.catch(() => undefined);
  try {
    const data = await work(tx);
    await done;
    return data;
  } catch (error) {
    try { tx.abort(); } catch { /* Already completed/aborted. */ }
    await done.catch(() => undefined);
    throw error;
  }
}

export async function runStorageOperation<T>(requestId: string | null, work: (db: IDBDatabase) => Promise<T>): Promise<Result<T>> {
  let db: IDBDatabase | undefined;
  try {
    db = await openDatabase();
    return { ok: true, data: await work(db) };
  } catch (error) {
    const fault = error instanceof RepositoryFault ? error : new RepositoryFault("STORAGE_UNAVAILABLE", "Local storage failed. Your saved history has not been reset.", true);
    return { ok: false, error: { code: fault.code, message: fault.message, retryable: fault.retryable, requestId } };
  } finally {
    db?.close();
  }
}

export async function requireOwner(tx: IDBTransaction, suppliedOwner: string): Promise<void> {
  validId(suppliedOwner);
  const raw = await request(tx.objectStore("metadata").get("owner"));
  const parsed = ownerRecordSchema.safeParse(raw);
  if (!parsed.success) corrupt();
  if (parsed.data.value !== suppliedOwner) throw new RepositoryFault("UNAUTHORIZED", "This local namespace cannot access that session.");
}

