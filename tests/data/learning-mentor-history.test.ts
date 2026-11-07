import { randomUUID } from "node:crypto";
import { IDBFactory, IDBObjectStore } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ResearchResponse, Result } from "@/contracts";
import { deleteMentorAnswer, listMentorAnswers, MAX_MENTOR_ANSWERS, MENTOR_HISTORY_DATABASE_NAME, MENTOR_HISTORY_STORE_NAME, saveMentorAnswer } from "@/lib/learning/mentor-history";
import type { SavedMentorAnswer } from "@/lib/learning/mentor-history";

const response: ResearchResponse = {
  summary: "These baskets use synthetic teaching assumptions, not forecasts.",
  facts: [{ text: "Product fees are not modeled.", evidenceIds: ["ev-demo-method"] }],
  limitations: ["Fixed synthetic evidence only."], origin: "prewritten",
  evidence: [{ id: "ev-demo-method", title: "VAMM synthetic teaching methodology", sourceUrl: null,
    observedAt: "2026-11-06T00:00:00Z", dataMode: "synthetic", datasetVersion: "vamm-demo-2026-11-06.v1" }],
};
function entry(createdAt = "2026-11-07T09:30:00.000Z"): SavedMentorAnswer {
  return { id: randomUUID(), question: "Explain these synthetic baskets.", instrumentIds: ["edu-bonds", "edu-equity"], response: structuredClone(response), createdAt };
}
function value<T>(result: Result<T>): T { if (!result.ok) throw new Error(result.error.code); return result.data; }
function request<T>(operation: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => { operation.onsuccess = () => resolve(operation.result); operation.onerror = () => reject(operation.error); });
}
async function rows(edit?: (store: IDBObjectStore) => Promise<void>): Promise<unknown[]> {
  const db = await request(indexedDB.open(MENTOR_HISTORY_DATABASE_NAME, 1));
  try {
    const tx = db.transaction(MENTOR_HISTORY_STORE_NAME, edit ? "readwrite" : "readonly");
    const done = new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error); });
    const store = tx.objectStore(MENTOR_HISTORY_STORE_NAME);
    if (edit) await edit(store);
    const result: unknown[] = await request(store.getAll());
    await done;
    return result;
  } finally { db.close(); }
}

beforeEach(() => {
  vi.stubGlobal("indexedDB", new IDBFactory());
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("History must not make a network request."); }));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("explicit isolated mentor answer snapshots", () => {
  it("opens only its own database and initially lists no saved answers", async () => {
    const open = vi.spyOn(indexedDB, "open");
    expect(value(await listMentorAnswers())).toEqual([]);
    expect(open.mock.calls.every(([name]) => name === MENTOR_HISTORY_DATABASE_NAME)).toBe(true);
    expect(await rows()).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("persists an immutable question/answer snapshot independently of later form edits", async () => {
    const saved = entry();
    const original = structuredClone(saved);
    expect(value(await saveMentorAnswer(saved))).toEqual([original]);
    saved.question = "A later question"; saved.response.summary = "A later answer"; saved.instrumentIds = ["edu-cash"];
    expect(value(await listMentorAnswers())).toEqual([original]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("lists by the supplied saved timestamp without treating it as source freshness", async () => {
    const first = entry("2026-11-07T09:30:00.000Z");
    const second = entry("2026-11-07T09:31:00.000Z");
    value(await saveMentorAnswer(first)); value(await saveMentorAnswer(second));
    expect(value(await listMentorAnswers())).toEqual([second, first]);
    expect(value(await listMentorAnswers())[0].response.evidence[0].observedAt).toBe("2026-11-06T00:00:00Z");
  });

  it("replays the same snapshot once and rejects changed payloads for its identifier", async () => {
    const saved = entry();
    value(await saveMentorAnswer(saved));
    expect(value(await saveMentorAnswer(structuredClone(saved)))).toEqual([saved]);
    expect(await saveMentorAnswer({ ...saved, question: "A changed question" })).toMatchObject({ ok: false, error: { code: "IDEMPOTENCY_CONFLICT" } });
    expect(value(await listMentorAnswers())).toEqual([saved]);
  });

  it("deletes only the selected snapshot and makes repeated deletion idempotent", async () => {
    const first = entry(); const second = entry();
    value(await saveMentorAnswer(first)); value(await saveMentorAnswer(second));
    expect(value(await deleteMentorAnswer(first.id))).toEqual([second]);
    expect(value(await deleteMentorAnswer(first.id))).toEqual([second]);
    expect(await deleteMentorAnswer("not-a-uuid")).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
  });

  it.each(["question", "ticker", "duplicate", "citation", "source", "date", "origin", "extra"])("rejects invalid %s input without changing existing records", async field => {
    const saved = entry(); value(await saveMentorAnswer(saved));
    const base = entry();
    const invalid = field === "question" ? { ...base, question: "x".repeat(1001) } :
      field === "ticker" ? { ...base, instrumentIds: ["NASDAQ:AAPL"] } :
      field === "duplicate" ? { ...base, instrumentIds: ["edu-cash", "edu-cash"] } :
      field === "citation" ? { ...base, response: { ...base.response, facts: [{ text: "Untrusted", evidenceIds: ["unknown"] }] } } :
      field === "source" ? { ...base, response: { ...base.response, evidence: [{ ...base.response.evidence[0], sourceUrl: "https://attacker.invalid/", dataMode: "historical" }] } } :
      field === "date" ? { ...base, createdAt: "not-a-date" } :
      field === "origin" ? { ...base, response: { ...base.response, origin: "live" } } : { ...base, images: ["not-supported"] };
    expect(await saveMentorAnswer(invalid as unknown as SavedMentorAnswer)).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    expect(value(await listMentorAnswers())).toEqual([saved]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects corrupted saved records rather than skipping or overwriting them", async () => {
    const saved = entry(); value(await saveMentorAnswer(saved));
    await rows(async store => { await request(store.put({ ...saved, response: { ...saved.response, origin: "fabricated" } })); });
    const before = await rows();
    expect(await listMentorAnswers()).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE", retryable: false } });
    expect(await deleteMentorAnswer(saved.id)).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE" } });
    expect(await saveMentorAnswer(entry())).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE" } });
    expect(await rows()).toEqual(before);
  });

  it("caps history without pruning and still permits replay and explicit deletion", async () => {
    value(await listMentorAnswers());
    const full = Array.from({ length: MAX_MENTOR_ANSWERS }, () => entry());
    await rows(async store => { for (const saved of full) await request(store.add(saved)); });
    expect(value(await saveMentorAnswer(full[0]))).toHaveLength(100);
    const next = entry();
    expect(await saveMentorAnswer(next)).toMatchObject({ ok: false, error: { code: "INVALID_INPUT", message: expect.stringContaining("full") } });
    expect(await rows()).toHaveLength(100);
    value(await deleteMentorAnswer(full[0].id));
    const after = value(await saveMentorAnswer(next));
    expect(after).toHaveLength(100);
    expect(after.some(item => item.id === full[0].id)).toBe(false);
    expect(full.slice(1).every(saved => after.some(item => item.id === saved.id))).toBe(true);
  });

  it("serializes concurrent matching saves into one saved snapshot", async () => {
    const saved = entry();
    const results = await Promise.all([saveMentorAnswer(saved), saveMentorAnswer(saved)]);
    expect(results.every(result => result.ok)).toBe(true);
    expect(value(await listMentorAnswers())).toEqual([saved]);
  });

  it("rolls back a failed save without a silent memory fallback", async () => {
    value(await listMentorAnswers());
    vi.spyOn(IDBObjectStore.prototype, "add").mockImplementation(() => { throw new DOMException("Quota", "QuotaExceededError"); });
    expect(await saveMentorAnswer(entry())).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE", retryable: true } });
    vi.restoreAllMocks();
    expect(value(await listMentorAnswers())).toEqual([]);
  });

  it("resolves unavailable storage as a safe Result error", async () => {
    vi.stubGlobal("indexedDB", undefined);
    await expect(listMentorAnswers()).resolves.toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE", retryable: true } });
  });
});
