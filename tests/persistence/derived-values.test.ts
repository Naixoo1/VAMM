import { webcrypto } from "node:crypto";
import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MutationRequest, Result, SessionBundle } from "@/contracts";
import { DEFAULT_CONTRIBUTION_ALLOCATION } from "@/contracts";
import { getScenario } from "@/lib/data/fixtures";
import { DATABASE_NAME, request, STORE_NAMES, transaction } from "@/lib/db/database";
import { getOrCreateLocalOwner } from "@/lib/db/local-owner";
import { commitMutation, createSession, getActiveSession, getRequestOutcome, getSession } from "@/lib/db/local-repository";
import { calculateNextBundle, calculateRealBalance } from "@/lib/simulation/engine";

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
function advance(bundle: SessionBundle, savingsRateBps = 5000): MutationRequest {
  return { sessionId: bundle.session.id, expectedVersion: bundle.session.version,
    requestId: `advance-${bundle.session.turnIndex + 1}`, action: "ADVANCE", savingsRateBps,
    contributionAllocation: { ...DEFAULT_CONTRIBUTION_ALLOCATION } };
}
async function setup() {
  const owner = value(await getOrCreateLocalOwner());
  const initial = value(await createSession(owner, "create-integrity"));
  const action = advance(initial);
  const pending = calculateNextBundle(initial, action, getScenario(1));
  expect(pending.turns[0].realBalanceRupiah).toBe(2635340);
  expect(pending.session.cumulativeInflationIndex).toBe(1.03);
  value(await commitMutation(owner, action, pending));
  return { owner, pending, sessionId: pending.session.id };
}

beforeEach(() => { vi.stubGlobal("indexedDB", new IDBFactory()); vi.stubGlobal("crypto", webcrypto); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("derived-value restoration integrity", () => {
  it.each([0, 1, 5000, 10000])("restores zero-turn, pending and settled states through three turns at %i savings bps", async savingsRateBps => {
    const owner = value(await getOrCreateLocalOwner());
    let bundle = value(await createSession(owner, "create-valid"));
    expect(value(await getSession(owner, bundle.session.id))).toEqual(bundle);
    for (let turnIndex = 1; turnIndex <= 3; turnIndex += 1) {
      const scenario = getScenario(turnIndex);
      const action = advance(bundle, savingsRateBps);
      bundle = calculateNextBundle(bundle, action, scenario);
      value(await commitMutation(owner, action, bundle));
      expect(value(await getActiveSession(owner))).toEqual(bundle);
      const settlement: MutationRequest = { sessionId: bundle.session.id, expectedVersion: bundle.session.version,
        requestId: `settle-${turnIndex}`, action: "SETTLE_SHOCK", funding: { cash: 0, bonds: 0, equity: 0 }, acknowledgeUnmetCost: true };
      bundle = calculateNextBundle(bundle, settlement, scenario);
      value(await commitMutation(owner, settlement, bundle));
      expect(value(await getSession(owner, bundle.session.id))).toEqual(bundle);
    }
    expect(bundle.session.phase).toBe("complete");
  });

  it.each(["real", "inflation", "coherent-inflation"] as const)("rejects persisted %s corruption without rewriting or resetting any record", async field => {
    const { owner, sessionId } = await setup();
    await withDatabase(db => transaction(db, ["sessions", "turns"], "readwrite", async tx => {
      const turns = tx.objectStore("turns");
      const row = await request(turns.get([owner, sessionId, 1]));
      if (field === "real") row.turn.realBalanceRupiah += 1;
      else {
        const sessions = tx.objectStore("sessions");
        const stored = await request(sessions.get([owner, sessionId]));
        stored.session.cumulativeInflationIndex = 1.5;
        row.turn.cumulativeInflationIndex = 1.5;
        if (field === "coherent-inflation") row.turn.realBalanceRupiah = calculateRealBalance(row.turn.nominalBalanceRupiah, 1.5);
        await request(sessions.put(stored));
      }
      await request(turns.put(row));
    }));
    const before = await snapshot();
    expect(await getSession(owner, sessionId)).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE", retryable: false } });
    expect(await getActiveSession(owner)).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE" } });
    expect(await createSession(owner, "do-not-hide-corruption")).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE" } });
    expect(await snapshot()).toEqual(before);
  });

  it("also checks derived values in earlier settled turns", async () => {
    const { owner, pending } = await setup();
    const settlement: MutationRequest = { sessionId: pending.session.id, expectedVersion: 1, requestId: "settle-first",
      action: "SETTLE_SHOCK", funding: { cash: 150000, bonds: 0, equity: 0 }, acknowledgeUnmetCost: false };
    const settled = calculateNextBundle(pending, settlement, getScenario(1));
    value(await commitMutation(owner, settlement, settled));
    const action = advance(settled);
    value(await commitMutation(owner, action, calculateNextBundle(settled, action, getScenario(2))));
    await withDatabase(db => transaction(db, ["turns"], "readwrite", async tx => {
      const store = tx.objectStore("turns");
      const row = await request(store.get([owner, pending.session.id, 1]));
      row.turn.realBalanceRupiah += 1;
      await request(store.put(row));
    }));
    expect(await getSession(owner, pending.session.id)).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE" } });
  });

  it.each(["real", "inflation"] as const)("rejects an inconsistent %s candidate atomically", async field => {
    const owner = value(await getOrCreateLocalOwner());
    const initial = value(await createSession(owner, "create-candidate"));
    const action = advance(initial);
    const candidate = calculateNextBundle(initial, action, getScenario(1));
    if (field === "real") candidate.turns[0].realBalanceRupiah += 1;
    else {
      candidate.session.cumulativeInflationIndex = candidate.turns[0].cumulativeInflationIndex = 1.5;
      candidate.turns[0].realBalanceRupiah = calculateRealBalance(candidate.turns[0].nominalBalanceRupiah, 1.5);
    }
    const before = await snapshot();
    expect(await commitMutation(owner, action, candidate)).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    expect(value(await getSession(owner, initial.session.id))).toEqual(initial);
    expect(value(await getRequestOutcome(owner, initial.session.id, action.requestId))).toBeNull();
    expect(await snapshot()).toEqual(before);
  });
});
