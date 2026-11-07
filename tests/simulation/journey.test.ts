import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { webcrypto } from "node:crypto";
import type { AdvanceRequest, Result } from "@/contracts";
import { DEFAULT_ALLOCATION } from "@/contracts";
import { applyAction, createSession, getActiveSession, getFeedback, getSession, previewContribution } from "@/lib/simulation/gateway";

function data<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.data;
}
beforeEach(() => { vi.stubGlobal("indexedDB", new IDBFactory()); vi.stubGlobal("crypto", webcrypto); });
afterEach(() => vi.unstubAllGlobals());

describe("real local gateway and IndexedDB journey", () => {
  it("completes three turns once, handles duplicate races, and resets without erasing history or reversing the active pointer", async () => {
    let bundle = data(await createSession({ requestId: "journey-start" }));
    const oldSessionId = bundle.session.id;
    for (let turn = 1; turn <= 3; turn++) {
      const previewRequest = { sessionId: oldSessionId, expectedVersion: bundle.session.version, savingsRateBps: 5000, contributionAllocation: { ...DEFAULT_ALLOCATION } };
      const preview = data(await previewContribution(previewRequest));
      const action: AdvanceRequest = { ...previewRequest, requestId: `advance-${turn}`, action: "ADVANCE" };
      const duplicate = await Promise.all([applyAction(action), applyAction(action)]);
      const advanced = duplicate.map(data);
      expect(advanced.filter(result => !result.replayed)).toHaveLength(1);
      expect(advanced.every(result => result.session.version === turn * 2 - 1)).toBe(true);
      expect(advanced[0].turn.allocatedContribution).toEqual(preview.allocatedContribution);
      bundle = data(await getSession({ sessionId: oldSessionId }));
      expect(bundle.turns).toHaveLength(turn);
      const funding = { cash: bundle.session.pendingShock!.costRupiah, bonds: 0, equity: 0 };
      const settlement = data(await applyAction({ sessionId: oldSessionId, expectedVersion: bundle.session.version,
        requestId: `settle-${turn}`, action: "SETTLE_SHOCK", funding, acknowledgeUnmetCost: false }));
      expect(settlement.session.version).toBe(turn * 2);
      expect(data(await getFeedback({ sessionId: oldSessionId, turnIndex: turn, decisionStatus: "settled" })).origin).toBe("prewritten");
      bundle = data(await getSession({ sessionId: oldSessionId }));
      expect(bundle.session.version).toBe(turn * 2);
      // A late replay of ADVANCE returns its original snapshot; loading current state stays settled.
      expect(data(await applyAction(action)).replayed).toBe(true);
      expect(data(await getSession({ sessionId: oldSessionId })).session.version).toBe(turn * 2);
    }
    expect(bundle.session).toMatchObject({ phase: "complete", version: 6, age: 18 });
    expect(bundle.turns).toHaveLength(3);
    const reset = data(await createSession({ requestId: "reset-intent" }));
    expect(reset.session.id).not.toBe(oldSessionId);
    expect(reset.session.balances).toEqual({ cash: 0, bonds: 0, equity: 0 });
    expect(data(await getSession({ sessionId: oldSessionId })).turns).toHaveLength(3);
    await createSession({ requestId: "journey-start" });
    expect(data(await getActiveSession())!.session.id).toBe(reset.session.id);
  });
  it("allows only one new request ID to commit against the same version", async () => {
    const bundle = data(await createSession({ requestId: "create-race" }));
    const action: AdvanceRequest = { sessionId: bundle.session.id, expectedVersion: 0, requestId: "race-one", action: "ADVANCE",
      savingsRateBps: 5000, contributionAllocation: { ...DEFAULT_ALLOCATION } };
    const results = await Promise.all([applyAction(action), applyAction({ ...action, requestId: "race-two" })]);
    expect(results.filter(result => result.ok)).toHaveLength(1);
    const failure = results.find(result => !result.ok);
    expect(failure).toMatchObject({ ok: false, error: { code: "STATE_CONFLICT" } });
    expect(data(await getSession({ sessionId: bundle.session.id })).turns).toHaveLength(1);
  });
});

