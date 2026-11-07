import { randomUUID } from "node:crypto";
import { IDBFactory, IDBObjectStore } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteSession, getSession, listSessions, saveSession } from "@/lib/mentor/history";
import { MAX_CHAT_IMAGE_BYTES, MENTOR_CHAT_DATABASE_NAME, MENTOR_CHAT_STORE_NAME, type ChatImage, type ChatResult, type ChatSession } from "@/lib/mentor/types";

const at = "2026-11-07T09:30:00.000Z";
function session(): ChatSession { return { id: randomUUID(), title: "A screenshot question", createdAt: at, updatedAt: at, revision: 0, messages: [] }; }
function image(mimeType: ChatImage["mimeType"] = "image/png", bytes?: number): ChatImage {
  const header = mimeType === "image/png" ? Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]) :
    mimeType === "image/jpeg" ? Buffer.from([255, 216, 255, 224]) : Buffer.from("RIFF0000WEBP");
  const body = bytes ? Buffer.concat([header, Buffer.alloc(bytes - header.length)]) : header;
  return { name: "chart.png", mimeType, dataUrl: "data:" + mimeType + ";base64," + body.toString("base64") };
}
function append(base: ChatSession, role: "user" | "assistant" = "user", content = "Explain the visible chart.", screenshot?: ChatImage): ChatSession {
  const createdAt = new Date(Date.parse(base.updatedAt) + 1000).toISOString();
  return { ...base, updatedAt: createdAt, messages: [...base.messages, { id: randomUUID(), role, content, createdAt,
    ...(screenshot ? { image: screenshot } : {}), ...(role === "assistant" ? { origin: "model" as const } : {}) }] };
}
function value<T>(result: ChatResult<T>): T { if (!result.ok) throw new Error(result.error.code + ": " + result.error.message); return result.data; }
function request<T>(operation: IDBRequest<T>): Promise<T> { return new Promise((resolve, reject) => { operation.onsuccess = () => resolve(operation.result); operation.onerror = () => reject(operation.error); }); }
async function rows(edit?: (store: IDBObjectStore) => Promise<void>): Promise<unknown[]> {
  const db = await request(indexedDB.open(MENTOR_CHAT_DATABASE_NAME, 1));
  try {
    const tx = db.transaction(MENTOR_CHAT_STORE_NAME, edit ? "readwrite" : "readonly");
    const done = new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error); });
    const store = tx.objectStore(MENTOR_CHAT_STORE_NAME);
    if (edit) await edit(store);
    const raw: unknown[] = await request(store.getAll()); await done; return raw;
  } finally { db.close(); }
}
beforeEach(() => { vi.stubGlobal("indexedDB", new IDBFactory()); vi.stubGlobal("fetch", vi.fn(() => { throw new Error("History cannot access a network."); })); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("isolated durable mentor chat sessions", () => {
  it("opens only the new chat database and starts with no sessions", async () => {
    const open = vi.spyOn(indexedDB, "open");
    expect(value(await listSessions())).toEqual([]);
    expect(open.mock.calls).toEqual([[MENTOR_CHAT_DATABASE_NAME, 1]]);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("creates revision1 and retains an independent full snapshot across later reads", async () => {
    const draft = append(session(), "user", "What is visible?", image());
    const original = structuredClone(draft);
    const saved = value(await saveSession(draft, null));
    expect(saved).toEqual({ ...original, revision: 1 });
    draft.messages[0].content = "Later unsaved edit"; draft.title = "Different title";
    expect(value(await getSession(saved.id))).toEqual(saved);
    expect(value(await listSessions())).toEqual([saved]);
  });
  it("saves user and assistant phases atomically and retains all earlier messages", async () => {
    const user = value(await saveSession(append(session()), null));
    const answer = append(user, "assistant", "Only the visible screenshot is context.");
    const saved = value(await saveSession(answer, user.revision));
    expect(saved.revision).toBe(2); expect(saved.messages).toHaveLength(2);
    expect(saved.messages[0]).toEqual(user.messages[0]);
    expect(value(await getSession(saved.id))).toEqual(saved);
  });
  it("replays identical creation and update intents before stale revision checks", async () => {
    const draft = append(session());
    const first = value(await saveSession(draft, null));
    expect(value(await saveSession(structuredClone(draft), null))).toEqual(first);
    const answer = append(first, "assistant", "An educational interpretation.");
    const second = value(await saveSession(answer, 1));
    expect(value(await saveSession(structuredClone(answer), 1))).toEqual(second);
    expect(second.revision).toBe(2); expect(await rows()).toEqual([second]);
  });
  it("never moves later history backward for a delayed old request", async () => {
    const draft = append(session()); const first = value(await saveSession(draft, null));
    const second = value(await saveSession(append(first, "assistant", "First answer"), 1));
    const third = value(await saveSession(append(second, "user", "A follow-up"), 2));
    expect(await saveSession(draft, null)).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
    expect(await saveSession(append(first, "assistant", "Stale answer"), 1)).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
    expect(value(await getSession(first.id))).toEqual(third);
  });
  it("serializes concurrent distinct writes and matching duplicate writes", async () => {
    const first = value(await saveSession(append(session()), null));
    const one = append(first, "assistant", "One answer"), two = append(first, "assistant", "Another answer");
    const results = await Promise.all([saveSession(one, 1), saveSession(two, 1)]);
    expect(results.filter(result => result.ok)).toHaveLength(1);
    expect(results.filter(result => !result.ok)).toMatchObject([{ ok: false, error: { code: "CONFLICT" } }]);
    const secondDraft = append(session());
    const duplicate = await Promise.all([saveSession(secondDraft, null), saveSession(secondDraft, null)]);
    expect(duplicate.every(result => result.ok)).toBe(true);
    expect(value(duplicate[0])).toEqual(value(duplicate[1]));
  });
  it("rejects edits to existing message snapshots without overwriting saved history", async () => {
    const first = value(await saveSession(append(session()), null));
    const changed = structuredClone(first); changed.messages[0].content = "Rewritten old message";
    expect(await saveSession(changed, 1)).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
    expect(await saveSession({ ...first, messages: [] }, 1)).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
    expect(value(await getSession(first.id))).toEqual(first);
  });
  it("lists all sessions by updated timestamp and resolves absent IDs as null", async () => {
    const first = value(await saveSession(session(), null));
    const later = session(); later.updatedAt = "2026-11-07T10:30:00.000Z";
    const second = value(await saveSession(later, null));
    expect(value(await listSessions())).toEqual([second, first]);
    expect(value(await getSession(randomUUID()))).toBeNull();
  });
  it("explicit deletion erases transcript bytes and prevents resurrection by stale create or update", async () => {
    const draft = append(session(), "user", "Visible screenshot", image());
    const saved = value(await saveSession(draft, null));
    expect(value(await deleteSession(saved.id))).toBeUndefined();
    expect(value(await deleteSession(saved.id))).toBeUndefined();
    expect(value(await getSession(saved.id))).toBeNull(); expect(value(await listSessions())).toEqual([]);
    expect(await rows()).toEqual([{ id: saved.id, deleted: true }]);
    expect(await saveSession(draft, null)).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
    expect(await saveSession(append(saved), 1)).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
  });
  it.each(["image/png", "image/jpeg", "image/webp"] as const)("persists a %s preview losslessly", async mime => {
    const draft = append(session(), "user", "", image(mime));
    const saved = value(await saveSession(draft, null));
    expect(value(await getSession(saved.id))?.messages[0].image).toEqual(draft.messages[0].image);
  });
  it("accepts the exact2MiB image bound and visibly rejects larger images", async () => {
    expect((await saveSession(append(session(), "user", "", image("image/png", MAX_CHAT_IMAGE_BYTES)), null)).ok).toBe(true);
    expect(await saveSession(append(session(), "user", "", image("image/png", MAX_CHAT_IMAGE_BYTES + 1)), null)).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
  });
  it.each(["extra", "uuid", "text", "blank", "duplicate", "timestamp", "image signature", "mime", "base64", "assistant image", "user origin", "revision"])("rejects invalid %s without changing existing data", async field => {
    const saved = value(await saveSession(append(session()), null));
    const next = append(session(), "user", "Question", image());
    const invalid = field === "extra" ? { ...next, extra: true } : field === "uuid" ? { ...next, id: "bad" } :
      field === "text" ? { ...next, messages: [{ ...next.messages[0], content: "a".repeat(4001) }] } :
      field === "blank" ? { ...next, messages: [{ ...next.messages[0], content: " ", image: undefined }] } :
      field === "duplicate" ? { ...next, messages: [next.messages[0], next.messages[0]] } :
      field === "timestamp" ? { ...next, updatedAt: "2025-01-01T00:00:00.000Z" } :
      field === "image signature" ? { ...next, messages: [{ ...next.messages[0], image: { ...image(), dataUrl: "data:image/png;base64,PHN2Zz48L3N2Zz4=" } }] } :
      field === "mime" ? { ...next, messages: [{ ...next.messages[0], image: { ...image(), mimeType: "image/svg+xml" } }] } :
      field === "base64" ? { ...next, messages: [{ ...next.messages[0], image: { ...image(), dataUrl: "data:image/png;base64,not base64" } }] } :
      field === "assistant image" ? { ...next, messages: [{ ...next.messages[0], role: "assistant" }] } :
      field === "user origin" ? { ...next, messages: [{ ...next.messages[0], origin: "model" }] } : { ...next, revision: 3 };
    expect(await saveSession(invalid as unknown as ChatSession, null)).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    expect(value(await listSessions())).toEqual([saved]);
  });
  it("rejects bad expected revisions and IDs before opening storage", async () => {
    const open = vi.spyOn(indexedDB, "open");
    expect(await getSession("bad")).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    expect(await deleteSession("bad")).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    expect(await saveSession(session(), 0)).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    expect(open).not.toHaveBeenCalled();
  });
  it("surfaces corrupted records on read/write/delete and preserves their exact stored bytes", async () => {
    const saved = value(await saveSession(append(session()), null));
    await rows(async store => { await request(store.put({ ...saved, revision: 0 })); });
    const before = await rows();
    expect(await listSessions()).toMatchObject({ ok: false, error: { code: "CORRUPT_DATA" } });
    expect(await getSession(saved.id)).toMatchObject({ ok: false, error: { code: "CORRUPT_DATA" } });
    expect(await saveSession(append(saved), 1)).toMatchObject({ ok: false, error: { code: "CORRUPT_DATA" } });
    expect(await deleteSession(saved.id)).toMatchObject({ ok: false, error: { code: "CORRUPT_DATA" } });
    expect(await rows()).toEqual(before);
  });
  it("does not skip malformed deletion markers as if they were intentional deletion", async () => {
    const saved = value(await saveSession(session(), null));
    await rows(async store => { await request(store.put({ id: saved.id, deleted: true, unexpected: "data" })); });
    expect(await listSessions()).toMatchObject({ ok: false, error: { code: "CORRUPT_DATA" } });
  });
  it("surfaces quota and aborted transactions and retains the previously committed transcript", async () => {
    const saved = value(await saveSession(append(session()), null));
    const put = vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(() => { throw new DOMException("Quota", "QuotaExceededError"); });
    expect(await saveSession(append(saved, "assistant"), 1)).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE" } });
    put.mockRestore();
    const original = IDBObjectStore.prototype.put;
    vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(function (this: IDBObjectStore, ...args: Parameters<typeof original>) {
      const pending = original.apply(this, args); this.transaction.abort(); return pending;
    });
    expect(await saveSession(append(saved, "assistant"), 1)).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE" } });
    vi.restoreAllMocks(); expect(value(await getSession(saved.id))).toEqual(saved);
  });
  it("resolves unavailable and blocked storage as visible errors rather than memory fallback", async () => {
    vi.stubGlobal("indexedDB", undefined);
    await expect(listSessions()).resolves.toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE" } });
    const opening: { onblocked?: ((event: Event) => void) | null } = {};
    vi.stubGlobal("indexedDB", { open: () => { queueMicrotask(() => opening.onblocked?.(new Event("blocked"))); return opening; } });
    await expect(listSessions()).resolves.toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE" } });
  });
  it("leaves preexisting financial and legacy saved-answer databases untouched", async () => {
    for (const name of ["vamm-demo-v2", "vamm-mentor-history-v1"]) {
      const opening = indexedDB.open(name, 1); opening.onupgradeneeded = () => opening.result.createObjectStore("untouched");
      const db = await request(opening); const tx = db.transaction("untouched", "readwrite");
      await request(tx.objectStore("untouched").put({ original: name }, "sentinel")); db.close();
    }
    const open = vi.spyOn(indexedDB, "open");
    const saved = value(await saveSession(append(session()), null)); value(await listSessions()); value(await getSession(saved.id)); value(await deleteSession(saved.id));
    expect(open.mock.calls.every(([name]) => name === MENTOR_CHAT_DATABASE_NAME)).toBe(true);
    open.mockRestore();
    for (const name of ["vamm-demo-v2", "vamm-mentor-history-v1"]) {
      const db = await request(indexedDB.open(name, 1));
      expect(await request(db.transaction("untouched", "readonly").objectStore("untouched").get("sentinel"))).toEqual({ original: name }); db.close();
    }
    expect(fetch).not.toHaveBeenCalled();
  });
});
