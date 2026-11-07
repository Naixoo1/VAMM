import { describe, expect, it } from "vitest";
import type { AdvanceRequest, SessionBundle, SettleShockRequest } from "@/contracts";
import { CALCULATION_VERSION, DATASET_VERSION, DEFAULT_ALLOCATION, SCENARIO_SEQUENCE_ID } from "@/contracts";
import { getScenario } from "@/lib/data/fixtures";
import { applyAnnualReturn, calculateContribution, calculateNextBundle, calculatePreview, calculateRealBalance, roundHalfUpRatio } from "@/lib/simulation/engine";

function fresh(): SessionBundle {
  return { session: { id: "session-1", contractVersion: 2, version: 0, phase: "ready", turnIndex: 0, age: 15,
    balances: { cash: 0, bonds: 0, equity: 0 }, cumulativeInflationIndex: 1, pendingShock: null,
    scenarioSequenceId: SCENARIO_SEQUENCE_ID, datasetVersion: DATASET_VERSION, calculationVersion: CALCULATION_VERSION }, turns: [] };
}
function advance(bundle: SessionBundle): AdvanceRequest {
  return { sessionId: bundle.session.id, expectedVersion: bundle.session.version, requestId: `advance-${bundle.session.turnIndex + 1}`, action: "ADVANCE",
    savingsRateBps: 5000, contributionAllocation: { ...DEFAULT_ALLOCATION } };
}
function settle(bundle: SessionBundle, cash = bundle.session.pendingShock!.costRupiah, acknowledgeUnmetCost = false): SettleShockRequest {
  return { sessionId: bundle.session.id, expectedVersion: bundle.session.version, requestId: `settle-${bundle.session.turnIndex}`,
    action: "SETTLE_SHOCK", funding: { cash, bonds: 0, equity: 0 }, acknowledgeUnmetCost };
}

describe("deterministic annual engine", () => {
  it("matches frozen turn-one money, pending fields and contribution preview without mutating inputs", () => {
    const start = fresh(); const original = JSON.stringify(start); const request = advance(start);
    const preview = calculatePreview(start, { sessionId: request.sessionId, expectedVersion: request.expectedVersion, savingsRateBps: request.savingsRateBps, contributionAllocation: request.contributionAllocation }, getScenario(1));
    const pending = calculateNextBundle(start, request, getScenario(1));
    const turn = pending.turns[0];
    expect(preview.contributionRupiah).toBe(2600000);
    expect(preview.allocatedContribution).toEqual({ cash: 780000, bonds: 780000, equity: 1040000 });
    expect(turn.allocatedContribution).toEqual(preview.allocatedContribution);
    expect(turn.postReturnBalances).toEqual({ cash: 780000, bonds: 811200, equity: 1123200 });
    expect(turn).toMatchObject({ investmentGainRupiah: 114400, nominalBalanceRupiah: 2714400, realBalanceRupiah: 2635340,
      paidShockCostRupiah: 0, unmetShockCostRupiah: null, funding: null, acknowledgeUnmetCost: null, decisionStatus: "pending" });
    expect(pending.session).toMatchObject({ phase: "awaiting_shock_decision", version: 1, age: 16, turnIndex: 1 });
    expect(JSON.stringify(start)).toBe(original);
    expect(() => calculateNextBundle(pending, advance(pending), getScenario(2))).toThrow(/pending bill/);
    const settled = calculateNextBundle(pending, settle(pending), getScenario(1));
    expect(settled.session).toMatchObject({ phase: "ready", version: 2, age: 16, turnIndex: 1, pendingShock: null,
      balances: { cash: 630000, bonds: 811200, equity: 1123200 } });
    expect(settled.turns[0]).toMatchObject({ nominalBalanceRupiah: 2564400, realBalanceRupiah: 2489709, unmetShockCostRupiah: 0 });
    expect(settled.turns[0].contributionRupiah).toBe(turn.contributionRupiah);
    expect(settled.session.cumulativeInflationIndex).toBe(pending.session.cumulativeInflationIndex);
    expect(pending.turns[0].decisionStatus).toBe("pending");
  });
  it("finishes exactly three turns and preserves previous settled history", () => {
    let bundle = fresh();
    let first = "";
    for (let turn = 1; turn <= 3; turn++) {
      bundle = calculateNextBundle(bundle, advance(bundle), getScenario(turn));
      bundle = calculateNextBundle(bundle, settle(bundle), getScenario(turn));
      if (turn === 1) first = JSON.stringify(bundle.turns[0]);
    }
    expect(bundle.session).toMatchObject({ phase: "complete", age: 18, turnIndex: 3, version: 6, cumulativeInflationIndex: 1.09798 });
    expect(bundle.turns).toHaveLength(3);
    expect(bundle.turns.every(turn => turn.decisionStatus === "settled")).toBe(true);
    expect(JSON.stringify(bundle.turns[0])).toBe(first);
    expect(() => calculateNextBundle(bundle, advance(bundle), getScenario(3))).toThrow(/completed sessions/);
    expect(() => calculateNextBundle(bundle, settle({ ...bundle, session: { ...bundle.session, pendingShock: getScenario(3).shock } }), getScenario(3))).toThrow();
  });
  it("requires explicit shortfall acknowledgment and never creates debt", () => {
    const initial = fresh();
    const pending = calculateNextBundle(initial, { ...advance(initial), savingsRateBps: 0 }, getScenario(1));
    expect(() => calculateNextBundle(pending, settle(pending, 0), getScenario(1))).toThrow(/Acknowledge/);
    expect(() => calculateNextBundle(pending, settle(pending, 1, true), getScenario(1))).toThrow(/holdings/);
    const settled = calculateNextBundle(pending, settle(pending, 0, true), getScenario(1));
    expect(settled.turns[0]).toMatchObject({ paidShockCostRupiah: 0, unmetShockCostRupiah: 150000, endingBalances: { cash: 0, bonds: 0, equity: 0 } });
    const funded = calculateNextBundle(fresh(), advance(fresh()), getScenario(1));
    const partial = calculateNextBundle(funded, settle(funded, 50000, true), getScenario(1));
    expect(partial.turns[0].unmetShockCostRupiah).toBe(100000);
    expect(() => calculateNextBundle(funded, settle(funded, 150001), getScenario(1))).toThrow(/bill/);
  });
  it("allocates ordered remainder while skipping zero weights", () => {
    const scenario = { ...getScenario(1), weeklyAllowanceRupiah: 1, allowanceMultiplier: 0.01 };
    expect(calculateContribution(scenario, 10000, { cash: 0, bonds: 5000, equity: 5000 })).toEqual({
      contributionRupiah: 1, allocatedContribution: { cash: 0, bonds: 1, equity: 0 } });
    expect(calculateContribution({ ...scenario, allowanceMultiplier: 0.05 }, 10000, { cash: 3333, bonds: 3333, equity: 3334 })).toEqual({
      contributionRupiah: 3, allocatedContribution: { cash: 1, bonds: 1, equity: 1 } });
  });
  it("rounds ties upward, preserves compounding path effects, and rejects unsafe/nonfinite inputs", () => {
    expect(roundHalfUpRatio(5n, 2n)).toBe(3);
    expect(applyAnnualReturn(5, 0.1)).toBe(6);
    expect(applyAnnualReturn(applyAnnualReturn(100, 0.1), -0.1)).toBe(99);
    expect(applyAnnualReturn(100, -1)).toBe(0);
    expect(calculateRealBalance(110, 1.1)).toBe(100);
    expect(() => calculateRealBalance(1, 0)).toThrow();
    expect(() => applyAnnualReturn(1, NaN)).toThrow();
    expect(() => applyAnnualReturn(1, -1.0001)).toThrow();
    expect(() => applyAnnualReturn(Number.MAX_SAFE_INTEGER, 0.1)).toThrow(/safe rupiah/);
    expect(() => calculateContribution({ ...getScenario(1), weeklyAllowanceRupiah: Number.MAX_SAFE_INTEGER }, 10000, { ...DEFAULT_ALLOCATION })).toThrow();
    expect(() => calculateContribution(getScenario(1), 5000.5, { ...DEFAULT_ALLOCATION })).toThrow();
  });
  it("keeps zero-return/inflation value apart from contributions and explicit withdrawals", () => {
    const scenario = { ...getScenario(1), returnsByAsset: { cash: 0, bonds: 0, equity: 0 }, inflationRate: 0 };
    const pending = calculateNextBundle(fresh(), advance(fresh()), scenario);
    expect(pending.turns[0]).toMatchObject({ investmentGainRupiah: 0, nominalBalanceRupiah: 2600000, realBalanceRupiah: 2600000 });
    const settled = calculateNextBundle(pending, settle(pending), scenario);
    expect(settled.turns[0]).toMatchObject({ nominalBalanceRupiah: 2450000, realBalanceRupiah: 2450000 });
  });
  it("rejects stale versions and client-supplied scenario fields", () => {
    const pending = calculateNextBundle(fresh(), advance(fresh()), getScenario(1));
    expect(() => calculateNextBundle(pending, { ...settle(pending), expectedVersion: 0 }, getScenario(1))).toThrow(/Session changed/);
    expect(() => calculateNextBundle(fresh(), { ...advance(fresh()), returnsByAsset: { cash: 1 } } as AdvanceRequest, getScenario(1))).toThrow(/Invalid action/);
  });
});


