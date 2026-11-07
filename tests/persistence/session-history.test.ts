import { webcrypto } from "node:crypto";
import { IDBDatabase as FakeIDBDatabase, IDBFactory, IDBIndex } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MutationRequest, Result, SessionBundle } from "@/contracts";
import { DEFAULT_CONTRIBUTION_ALLOCATION } from "@/contracts";
import { getScenario } from "@/lib/data/fixtures";
import { DATABASE_NAME, request, STORE_NAMES, transaction } from "@/lib/db/database";
import { getOrCreateLocalOwner } from "@/lib/db/local-owner";
import { commitMutation, createSession, getActiveSession } from "@/lib/db/local-repository";
import { calculateNextBundle } from "@/lib/simulation/engine";
import { listPreservedSessions } from "@/lib/simulation/history";

function value<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(result.error.code + ": " + result.error.message);
  return result.data;
}
async function withDatabase<T>(work: (db: IDBDatabase) => Promise<T>): Promise<T> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const opening = indexedDB.open(DATABASE_NAME, 1);
    opening.onsuccess = () => resolve(opening.result);
    opening.onerror = () => reject(opening.error);
  });
  try { return await work(db); } finally { db.close(); }
}
async function snapshot() {
  return withDatabase(db => transaction(db, [...STORE_NAMES], "readonly", async tx => {
    const records: Record<string, unknown[]> = {};
    for (const name of STORE_NAMES) records[name] = await request(tx.objectStore(name).getAll());
    return records;
  }));
}
async function pending(owner: string, bundle: SessionBundle): Promise<SessionBundle> {
  const action: MutationRequest = { sessionId: bundle.session.id, expectedVersion: bundle.session.version,
    requestId: "history-advance", action: "ADVANCE", savingsRateBps: 5000,
    contributionAllocation: { ...DEFAULT_CONTRIBUTION_ALLOCATION } };
  const next = calculateNextBundle(bundle, action, getScenario(1));
  value(await commitMutation(owner, action, next));
  return next;
}
async function setup() {
  const owner = value(await getOrCreateLocalOwner());
  const old = await pending(owner, value(await createSession(owner, "history-old")));
  const active = value(await createSession(owner, "history-active"));
  return { owner, old, active };
}

beforeEach(() => { vi.stubGlobal("indexedDB", new IDBFactory()); vi.stubGlobal("crypto", webcrypto); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("read-only preserved-session discovery", () => {
  it("returns no history for pristine storage without creating owner/session records or changing schema", async () => {
    expect(value(await listPreservedSessions())).toEqual([]);
    const records = await snapshot();
    expect(Object.values(records).every(rows => rows.length === 0)).toBe(true);
    await withDatabase(async db => {
      expect(db.version).toBe(1);
      expect(Array.from(db.objectStoreNames).sort()).toEqual([...STORE_NAMES].sort());
    });
  });

  it("returns no history for an existing owner with no session, or only an active zero-turn session", async () => {
    const owner = value(await getOrCreateLocalOwner());
    expect(value(await listPreservedSessions())).toEqual([]);
    value(await createSession(owner, "only-active"));
    expect(value(await listPreservedSessions())).toEqual([]);
  });

  it("discovers complete zero-turn, pending and settled preserved bundles while excluding the active pointer", async () => {
    const owner = value(await getOrCreateLocalOwner());
    const zero = value(await createSession(owner, "old-zero"));
    const firstPending = await pending(owner, value(await createSession(owner, "old-pending")));
    const nextPending = await pending(owner, value(await createSession(owner, "old-settled")));
    const action: MutationRequest = { sessionId: nextPending.session.id, expectedVersion: 1, requestId: "history-settle",
      action: "SETTLE_SHOCK", funding: { cash: 150000, bonds: 0, equity: 0 }, acknowledgeUnmetCost: false };
    const settled = calculateNextBundle(nextPending, action, getScenario(1));
    value(await commitMutation(owner, action, settled));
    const active = value(await createSession(owner, "new-active"));
    const expected = [zero, firstPending, settled].sort((a, b) => a.session.id < b.session.id ? -1 : 1);
    const before = await snapshot();
    expect(value(await listPreservedSessions())).toEqual(expected);
    expect(value(await getActiveSession(owner))?.session.id).toBe(active.session.id);
    expect(await snapshot()).toEqual(before);
  });

  it("keeps other local namespaces out of discovery and does not interpret their rows", async () => {
    const { old } = await setup();
    const foreignOwner = "a71d7656-5551-45c6-b0da-7be4aabcc8d0";
    await withDatabase(db => transaction(db, ["sessions", "turns", "metadata"], "readwrite", async tx => {
      await request(tx.objectStore("sessions").add({ owner: foreignOwner, id: "foreign-session", session: { invalid: true } }));
      await request(tx.objectStore("turns").add({ owner: foreignOwner, sessionId: "foreign-session", turnIndex: 1, turn: { invalid: true } }));
      await request(tx.objectStore("metadata").add({ key: "active:" + foreignOwner, value: "foreign-session" }));
    }));
    expect(value(await listPreservedSessions())).toEqual([old]);
  });

  it("reads newly preserved sessions on the next call without a module-memory history index", async () => {
    const { owner, old, active } = await setup();
    expect(value(await listPreservedSessions())).toEqual([old]);
    const fresh = value(await createSession(owner, "another-tab-reset"));
    const discovered = value(await listPreservedSessions());
    expect(discovered.map(bundle => bundle.session.id).sort()).toEqual([old.session.id, active.session.id].sort());
    expect(discovered.some(bundle => bundle.session.id === fresh.session.id)).toBe(false);
  });

  it("uses one readonly history snapshot and performs no record mutations", async () => {
    const { old } = await setup();
    const before = await snapshot();
    const transactions = vi.spyOn(FakeIDBDatabase.prototype, "transaction");
    expect(value(await listPreservedSessions())).toEqual([old]);
    const calls = transactions.mock.calls.slice();
    expect(calls.length).toBeGreaterThan(0);
    expect(calls.every(([, mode]) => mode === "readonly")).toBe(true);
    expect(calls.some(([stores]) => Array.isArray(stores) && stores.length === STORE_NAMES.length && STORE_NAMES.every(name => stores.includes(name)))).toBe(true);
    transactions.mockRestore();
    expect(await snapshot()).toEqual(before);
  });

  it.each(["owner", "active", "dangling-active"] as const)("reports missing or corrupt %s metadata without changing saved records", async field => {
    const { owner } = await setup();
    await withDatabase(db => transaction(db, ["metadata"], "readwrite", async tx => {
      const store = tx.objectStore("metadata");
      if (field === "owner") await request(store.delete("owner"));
      else if (field === "active") await request(store.delete("active:" + owner));
      else await request(store.put({ key: "active:" + owner, value: "missing-session" }));
    }));
    const before = await snapshot();
    expect(await listPreservedSessions()).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE", retryable: false, requestId: null } });
    expect(await snapshot()).toEqual(before);
  });

  it.each(["preserved", "active"] as const)("propagates %s session corruption instead of returning an incomplete history list", async target => {
    const { owner, old, active } = await setup();
    await withDatabase(db => transaction(db, target === "preserved" ? ["turns"] : ["sessions"], "readwrite", async tx => {
      if (target === "preserved") {
        const store = tx.objectStore("turns");
        const row = await request(store.get([owner, old.session.id, 1]));
        row.turn.realBalanceRupiah += 1;
        await request(store.put(row));
      } else {
        const store = tx.objectStore("sessions");
        const row = await request(store.get([owner, active.session.id]));
        row.session.balances.cash = 1;
        await request(store.put(row));
      }
    }));
    const before = await snapshot();
    expect(await listPreservedSessions()).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE", retryable: false } });
    expect(await snapshot()).toEqual(before);
  });

  it("returns a safe Result error when a session scan fails", async () => {
    await setup();
    const before = await snapshot();
    vi.spyOn(IDBIndex.prototype, "getAll").mockImplementation(() => { throw new DOMException("Read failed", "UnknownError"); });
    await expect(listPreservedSessions()).resolves.toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE", retryable: true, requestId: null } });
    vi.restoreAllMocks();
    expect(await snapshot()).toEqual(before);
  });

  it("returns a safe unavailable-storage result without a memory fallback", async () => {
    vi.stubGlobal("indexedDB", undefined);
    await expect(listPreservedSessions()).resolves.toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE", retryable: true, requestId: null } });
  });
});
