import { webcrypto } from "node:crypto";
import { IDBFactory, IDBObjectStore } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MutationRequest, Result, SessionBundle } from "@/contracts";
import { getScenario } from "@/lib/data/fixtures";
import { DATABASE_NAME } from "@/lib/db/database";
import { getOrCreateLocalOwner } from "@/lib/db/local-owner";
import { canonicalizeMutation, commitMutation, createSession, getActiveSession, getRequestOutcome, getSession, getTurnHistory } from "@/lib/db/local-repository";

function value<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(result.error.code + ": " + result.error.message);
  return result.data;
}
const advance = (sessionId: string, requestId = "advance-1"): MutationRequest => ({
  sessionId, requestId, expectedVersion: 0, action: "ADVANCE", savingsRateBps: 5000,
  contributionAllocation: { cash: 3000, bonds: 3000, equity: 4000 },
});
function pending(initial: SessionBundle): SessionBundle {
  const scenario = getScenario(1);
  const balances = { cash: 780000, bonds: 811200, equity: 1123200 };
  return {
    session: { ...initial.session, version: 1, phase: "awaiting_shock_decision", turnIndex: 1, age: 16, balances, cumulativeInflationIndex: 1.03, pendingShock: scenario.shock },
    turns: [{
      turnIndex: 1, scenarioId: "turn-01", ageBefore: 15, ageAfter: 16,
      startingBalances: { cash: 0, bonds: 0, equity: 0 }, contributionRupiah: 2600000,
      allocatedContribution: { cash: 780000, bonds: 780000, equity: 1040000 },
      postReturnBalances: balances, investmentGainRupiah: 114400, inflationRate: 0.03,
      cumulativeInflationIndex: 1.03, shock: scenario.shock, paidShockCostRupiah: 0,
      unmetShockCostRupiah: null, funding: null, acknowledgeUnmetCost: null, endingBalances: balances,
      nominalBalanceRupiah: 2714400, realBalanceRupiah: 2635340, decisionStatus: "pending",
      datasetVersion: initial.session.datasetVersion, calculationVersion: initial.session.calculationVersion,
    }],
  };
}
function settled(current: SessionBundle): SessionBundle {
  const balances = { cash: 630000, bonds: 811200, equity: 1123200 };
  return {
    session: { ...current.session, version: 2, phase: "ready", pendingShock: null, balances },
    turns: [{ ...current.turns[0], paidShockCostRupiah: 150000, unmetShockCostRupiah: 0,
      funding: { cash: 150000, bonds: 0, equity: 0 }, acknowledgeUnmetCost: false,
      endingBalances: balances, nominalBalanceRupiah: 2564400, realBalanceRupiah: 2489709, decisionStatus: "settled" }],
  };
}
async function setup() {
  const owner = value(await getOrCreateLocalOwner());
  const initial = value(await createSession(owner, "create-first"));
  return { owner, initial, sessionId: initial.session.id };
}
async function editStore(storeName: string, edit: (store: IDBObjectStore) => void): Promise<void> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const opening = indexedDB.open(DATABASE_NAME, 1);
    opening.onsuccess = () => resolve(opening.result);
    opening.onerror = () => reject(opening.error);
  });
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
      edit(tx.objectStore(storeName));
    });
  } finally { db.close(); }
}

beforeEach(() => {
  vi.stubGlobal("indexedDB", new IDBFactory());
  vi.stubGlobal("crypto", webcrypto);
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("browser-local repository contract", () => {
  it("atomically bootstraps one owner and initially has no active session", async () => {
    const owners = (await Promise.all([getOrCreateLocalOwner(), getOrCreateLocalOwner()])).map(value);
    expect(owners[0]).toBe(owners[1]);
    expect(value(await getActiveSession(owners[0]))).toBeNull();
  });

  it("creates a zero-balance v2 session and restores it", async () => {
    const { owner, initial, sessionId } = await setup();
    expect(initial.session).toMatchObject({ version: 0, phase: "ready", turnIndex: 0, age: 15, balances: { cash: 0, bonds: 0, equity: 0 }, cumulativeInflationIndex: 1 });
    expect(value(await getActiveSession(owner))).toEqual(initial);
    expect(value(await getSession(owner, sessionId))).toEqual(initial);
    expect(value(await getTurnHistory(owner, sessionId))).toEqual([]);
  });

  it("rejects foreign-owner reads and writes", async () => {
    const { initial, sessionId } = await setup();
    for (const result of [
      await getSession("other-owner", sessionId),
      await getActiveSession("other-owner"),
      await createSession("other-owner", "create-foreign"),
      await commitMutation("other-owner", advance(sessionId), pending(initial)),
    ]) expect(result).toMatchObject({ ok: false, error: { code: "UNAUTHORIZED" } });
  });

  it("replays duplicate creates without switching the active pointer backward and keeps old history", async () => {
    const { owner, initial, sessionId } = await setup();
    value(await commitMutation(owner, advance(sessionId), pending(initial)));
    value(await commitMutation(owner, { sessionId, requestId: "settle-1", expectedVersion: 1, action: "SETTLE_SHOCK", funding: { cash: 150000, bonds: 0, equity: 0 }, acknowledgeUnmetCost: false }, settled(pending(initial))));
    const fresh = value(await createSession(owner, "reset-new-intent"));
    const replay = value(await createSession(owner, "create-first"));
    expect(replay.session.id).toBe(sessionId);
    expect(fresh.session.id).not.toBe(sessionId);
    expect(value(await getActiveSession(owner))?.session.id).toBe(fresh.session.id);
    expect(value(await getSession(owner, sessionId)).turns).toHaveLength(1);
    expect(value(await getSession(owner, sessionId)).session.version).toBe(2);
  });

  it("stores an undeducted pending bill then replaces that turn on explicit settlement", async () => {
    const { owner, initial, sessionId } = await setup();
    value(await commitMutation(owner, advance(sessionId), pending(initial)));
    expect(value(await getSession(owner, sessionId)).session.balances.cash).toBe(780000);
    const request: MutationRequest = { sessionId, requestId: "settle-1", expectedVersion: 1, action: "SETTLE_SHOCK", funding: { cash: 150000, bonds: 0, equity: 0 }, acknowledgeUnmetCost: false };
    value(await commitMutation(owner, request, settled(pending(initial))));
    const restored = value(await getSession(owner, sessionId));
    expect(restored.turns).toHaveLength(1);
    expect(restored.turns[0]).toMatchObject({ decisionStatus: "settled", contributionRupiah: 2600000, paidShockCostRupiah: 150000, unmetShockCostRupiah: 0 });
    expect(restored.session).toMatchObject({ version: 2, turnIndex: 1, age: 16, cumulativeInflationIndex: 1.03, balances: { cash: 630000, bonds: 811200, equity: 1123200 } });
  });

  it("replays the original response before checking stale versions or candidate state", async () => {
    const { owner, initial, sessionId } = await setup();
    const action = advance(sessionId);
    value(await commitMutation(owner, action, pending(initial)));
    const replay = value(await commitMutation(owner, action, initial));
    expect(replay).toMatchObject({ replayed: true, feedbackStatus: "pending", session: { version: 1 } });
    expect(value(await getTurnHistory(owner, sessionId))).toHaveLength(1);
    expect(value(await getRequestOutcome(owner, sessionId, action.requestId))?.result.replayed).toBe(false);
  });

  it("keeps a late ADVANCE replay from overwriting a newer settled session", async () => {
    const { owner, initial, sessionId } = await setup();
    value(await commitMutation(owner, advance(sessionId), pending(initial)));
    value(await commitMutation(owner, { sessionId, requestId: "settle-later", expectedVersion: 1, action: "SETTLE_SHOCK", funding: { cash: 150000, bonds: 0, equity: 0 }, acknowledgeUnmetCost: false }, settled(pending(initial))));
    expect(value(await commitMutation(owner, advance(sessionId), initial))).toMatchObject({ replayed: true, session: { version: 1, phase: "awaiting_shock_decision" } });
    expect(value(await getSession(owner, sessionId)).session).toMatchObject({ version: 2, phase: "ready" });
  });

  it("conflicts when an existing request ID is reused with a different canonical payload", async () => {
    const { owner, initial, sessionId } = await setup();
    value(await commitMutation(owner, advance(sessionId), pending(initial)));
    expect(await commitMutation(owner, { ...advance(sessionId), savingsRateBps: 4000 } as MutationRequest, pending(initial))).toMatchObject({ ok: false, error: { code: "IDEMPOTENCY_CONFLICT" } });
    expect(await commitMutation(owner, advance(sessionId, "new-stale-intent"), pending(initial))).toMatchObject({ ok: false, error: { code: "STATE_CONFLICT" } });
  });

  it("canonicalizes object key order while retaining expectedVersion", () => {
    const a = advance("session");
    const b = { contributionAllocation: { equity: 4000, cash: 3000, bonds: 3000 }, savingsRateBps: 5000, action: "ADVANCE", expectedVersion: 0, requestId: "different-id", sessionId: "session" } as MutationRequest;
    expect(canonicalizeMutation(a)).toBe(canonicalizeMutation(b));
    expect(canonicalizeMutation(a)).not.toBe(canonicalizeMutation({ ...a, expectedVersion: 1 }));
    expect(canonicalizeMutation(a)).not.toContain("requestId");
  });

  it("serializes concurrent distinct requests so only one can commit against a version", async () => {
    const { owner, initial, sessionId } = await setup();
    const results = await Promise.all([
      commitMutation(owner, advance(sessionId, "one"), pending(initial)),
      commitMutation(owner, advance(sessionId, "two"), pending(initial)),
    ]);
    expect(results.filter(result => result.ok)).toHaveLength(1);
    expect(results.find(result => !result.ok)).toMatchObject({ ok: false, error: { code: "STATE_CONFLICT" } });
    expect(value(await getSession(owner, sessionId)).session.version).toBe(1);
    expect(value(await getTurnHistory(owner, sessionId))).toHaveLength(1);
  });

  it("makes simultaneous duplicates one commit and one replay", async () => {
    const { owner, initial, sessionId } = await setup();
    const results = (await Promise.all([
      commitMutation(owner, advance(sessionId), pending(initial)),
      commitMutation(owner, advance(sessionId), pending(initial)),
    ])).map(value);
    expect(results.map(result => result.replayed).sort()).toEqual([false, true]);
    expect(value(await getTurnHistory(owner, sessionId))).toHaveLength(1);
  });

  it("rolls back state and turn writes when the outcome write fails", async () => {
    const { owner, initial, sessionId } = await setup();
    const original = IDBObjectStore.prototype.add;
    vi.spyOn(IDBObjectStore.prototype, "add").mockImplementation(function (this: IDBObjectStore, data: unknown, key?: IDBValidKey) {
      if (this.name === "requestOutcomes") throw new DOMException("Quota exhausted", "QuotaExceededError");
      return original.call(this, data, key);
    });
    expect(await commitMutation(owner, advance(sessionId), pending(initial))).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE" } });
    vi.restoreAllMocks();
    expect(value(await getSession(owner, sessionId))).toEqual(initial);
    expect(value(await getRequestOutcome(owner, sessionId, "advance-1"))).toBeNull();
  });

  it("leaves the old active session intact when reset cannot commit", async () => {
    const { owner, initial } = await setup();
    const original = IDBObjectStore.prototype.add;
    vi.spyOn(IDBObjectStore.prototype, "add").mockImplementation(function (this: IDBObjectStore, data: unknown, key?: IDBValidKey) {
      if (this.name === "requestOutcomes") throw new DOMException("Quota exhausted", "QuotaExceededError");
      return original.call(this, data, key);
    });
    expect(await createSession(owner, "reset-failed")).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE" } });
    vi.restoreAllMocks();
    expect(value(await getActiveSession(owner))).toEqual(initial);
  });

  it("requires acknowledgment before recording an unpaid portion of the bill", async () => {
    const { owner, initial, sessionId } = await setup();
    const current = pending(initial);
    value(await commitMutation(owner, advance(sessionId), current));
    const candidate = settled(current);
    const balances = { cash: 680000, bonds: 811200, equity: 1123200 };
    candidate.session.balances = balances;
    Object.assign(candidate.turns[0], { paidShockCostRupiah: 100000, unmetShockCostRupiah: 50000, funding: { cash: 100000, bonds: 0, equity: 0 }, endingBalances: balances, nominalBalanceRupiah: 2614400, realBalanceRupiah: Math.floor(2614400 / 1.03 + 0.5) });
    const action: MutationRequest = { sessionId, requestId: "partial-funding", expectedVersion: 1, action: "SETTLE_SHOCK", funding: { cash: 100000, bonds: 0, equity: 0 }, acknowledgeUnmetCost: false };
    expect(await commitMutation(owner, action, candidate)).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    candidate.turns[0].acknowledgeUnmetCost = true;
    expect(value(await commitMutation(owner, { ...action, acknowledgeUnmetCost: true }, candidate)).turn.unmetShockCostRupiah).toBe(50000);
  });

  it("rejects mismatched candidate/session balances without changing saved state", async () => {
    const { owner, initial, sessionId } = await setup();
    const candidate = pending(initial);
    candidate.session.balances = { ...candidate.session.balances, cash: 1 };
    expect(await commitMutation(owner, advance(sessionId), candidate)).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    expect(value(await getSession(owner, sessionId))).toEqual(initial);
  });

  it("checks phase before evaluating an inapplicable candidate", async () => {
    const { owner, initial, sessionId } = await setup();
    const settlement: MutationRequest = { sessionId, requestId: "no-bill", expectedVersion: 0, action: "SETTLE_SHOCK", funding: { cash: 0, bonds: 0, equity: 0 }, acknowledgeUnmetCost: true };
    expect(await commitMutation(owner, settlement, initial)).toMatchObject({ ok: false, error: { code: "INVALID_PHASE" } });
    const current = pending(initial);
    value(await commitMutation(owner, advance(sessionId), current));
    expect(await commitMutation(owner, { ...advance(sessionId, "advance-while-pending"), expectedVersion: 1 }, current)).toMatchObject({ ok: false, error: { code: "INVALID_PHASE" } });
  });

  it("reports corruption when a cached replay references a deleted session", async () => {
    const { owner, initial, sessionId } = await setup();
    value(await commitMutation(owner, advance(sessionId), pending(initial)));
    await editStore("sessions", store => store.delete([owner, sessionId]));
    expect(await commitMutation(owner, advance(sessionId), initial)).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE" } });
  });

  it("reports corrupted persisted turns and refuses a reset that would hide corruption", async () => {
    const { owner, initial, sessionId } = await setup();
    const candidate = pending(initial);
    value(await commitMutation(owner, advance(sessionId), candidate));
    await editStore("turns", store => store.put({ owner, sessionId, turnIndex: 1, turn: { ...candidate.turns[0], funding: { cash: 0, bonds: 0, equity: 0 } } }));
    expect(await getSession(owner, sessionId)).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE", retryable: false } });
    expect(await createSession(owner, "reset-after-corruption")).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE" } });
  });

  it("reports a missing active pointer instead of silently creating a session", async () => {
    const { owner } = await setup();
    await editStore("metadata", store => store.delete("active:" + owner));
    expect(await getActiveSession(owner)).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE" } });
  });

  it("does not replace a missing or corrupt identity in nonempty storage", async () => {
    await setup();
    await editStore("metadata", store => store.delete("owner"));
    expect(await getOrCreateLocalOwner()).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE" } });
  });

  it("rejects unknown request fields and malformed stored outcomes", async () => {
    const { owner, initial, sessionId } = await setup();
    expect(await commitMutation(owner, { ...advance(sessionId), returns: 999 } as unknown as MutationRequest, pending(initial))).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    value(await commitMutation(owner, advance(sessionId), pending(initial)));
    await editStore("requestOutcomes", store => {
      const get = store.get([owner, "mutation", sessionId, "advance-1"]);
      get.onsuccess = () => store.put({ ...get.result, canonicalPayload: "{}" });
    });
    expect(await getRequestOutcome(owner, sessionId, "advance-1")).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE" } });
  });

  it("returns a visible storage error when IndexedDB is unavailable", async () => {
    vi.stubGlobal("indexedDB", undefined);
    expect(await getOrCreateLocalOwner()).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE", retryable: true } });
  });
});

