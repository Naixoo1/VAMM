import { describe, expect, it } from "vitest";
import { mutationRequestSchema, previewRequestSchema, researchRequestSchema, sessionBundleSchema } from "@/contracts/validation";
import { CALCULATION_VERSION, DATASET_VERSION, SCENARIO_SEQUENCE_ID } from "@/contracts";

const advance = { action: "ADVANCE", sessionId: "session-1", requestId: "intent-1", expectedVersion: 0, savingsRateBps: 5000, contributionAllocation: { cash: 3000, bonds: 3000, equity: 4000 } };
describe("contract v2 runtime boundary", () => {
  it("rejects caller-supplied scenario values and extra fields", () => {
    expect(mutationRequestSchema.safeParse(advance).success).toBe(true);
    expect(mutationRequestSchema.safeParse({ ...advance, returnsByAsset: { cash: 0, bonds: 1, equity: 1 } }).success).toBe(false);
    expect(mutationRequestSchema.safeParse({ ...advance, expectedVersion: "0" }).success).toBe(false);
  });
  it("requires exact integer basis points and all three allocation assets", () => {
    const preview = { sessionId: advance.sessionId, expectedVersion: advance.expectedVersion, savingsRateBps: advance.savingsRateBps, contributionAllocation: advance.contributionAllocation };
    expect(previewRequestSchema.safeParse(preview).success).toBe(true);
    expect(previewRequestSchema.safeParse({ ...preview, contributionAllocation: { cash: 3000, bonds: 3000, equity: 3999 } }).success).toBe(false);
    expect(previewRequestSchema.safeParse({ ...preview, savingsRateBps: 1.5 }).success).toBe(false);
  });
  it("rejects unsafe funding totals without coercion", () => {
    expect(mutationRequestSchema.safeParse({ action: "SETTLE_SHOCK", sessionId: "s", requestId: "r", expectedVersion: 1, funding: { cash: Number.MAX_SAFE_INTEGER, bonds: 1, equity: 0 }, acknowledgeUnmetCost: true }).success).toBe(false);
  });
  it("only accepts distinct frozen research instruments and a bounded question", () => {
    expect(researchRequestSchema.parse({ instrumentIds: ["edu-bonds"], question: "  Explain modeled returns  " }).question).toBe("Explain modeled returns");
    for (const request of [
      { instrumentIds: ["edu-bonds", "edu-bonds"], question: "Explain" },
      { instrumentIds: ["ticker"], question: "Explain" },
      { instrumentIds: ["edu-bonds"], question: " " },
      { instrumentIds: ["edu-bonds"], question: "x".repeat(1001) },
      { instrumentIds: ["edu-bonds"], question: "Explain", url: "https://example.com" },
    ]) expect(researchRequestSchema.safeParse(request).success).toBe(false);
  });
  it("accepts only coherent initial state and complete ordered history", () => {
    const bundle = { session: { id: "s", contractVersion: 2, version: 0, phase: "ready", turnIndex: 0, age: 15, balances: { cash: 0, bonds: 0, equity: 0 }, cumulativeInflationIndex: 1, pendingShock: null, scenarioSequenceId: SCENARIO_SEQUENCE_ID, datasetVersion: DATASET_VERSION, calculationVersion: CALCULATION_VERSION }, turns: [] };
    expect(sessionBundleSchema.safeParse(bundle).success).toBe(true);
    expect(sessionBundleSchema.safeParse({ ...bundle, session: { ...bundle.session, balances: { cash: 10000000, bonds: 0, equity: 0 } } }).success).toBe(false);
    expect(sessionBundleSchema.safeParse({ ...bundle, session: { ...bundle.session, contractVersion: 1 } }).success).toBe(false);
    expect(sessionBundleSchema.safeParse({ ...bundle, session: { ...bundle.session, version: 1 } }).success).toBe(false);
  });
});
