import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MutationRequest, SessionBundle } from "@/contracts";
import { CALCULATION_VERSION, DATASET_VERSION, DEFAULT_ALLOCATION, SCENARIO_SEQUENCE_ID } from "@/contracts";
import { getScenario } from "@/lib/data/fixtures";
import { calculateNextBundle } from "@/lib/simulation/engine";

const repo = vi.hoisted(() => ({
  createSession: vi.fn(), getSession: vi.fn(), getActiveSession: vi.fn(), getRequestOutcome: vi.fn(),
  commitMutation: vi.fn(), canonicalizeMutation: vi.fn(),
}));
const owner = vi.hoisted(() => ({ getOrCreateLocalOwner: vi.fn() }));
vi.mock("@/lib/db/local-repository", () => repo);
vi.mock("@/lib/db/local-owner", () => owner);
import { applyAction, createSession, getActiveSession, getFeedback, previewContribution } from "@/lib/simulation/gateway";

function fresh(): SessionBundle {
  return { session: { id: "session-1", contractVersion: 2, version: 0, phase: "ready", turnIndex: 0, age: 15,
    balances: { cash: 0, bonds: 0, equity: 0 }, cumulativeInflationIndex: 1, pendingShock: null,
    scenarioSequenceId: SCENARIO_SEQUENCE_ID, datasetVersion: DATASET_VERSION, calculationVersion: CALCULATION_VERSION }, turns: [] };
}
const request: MutationRequest = { sessionId: "session-1", expectedVersion: 0, requestId: "request-1", action: "ADVANCE", savingsRateBps: 5000, contributionAllocation: { ...DEFAULT_ALLOCATION } };
beforeEach(() => {
  vi.resetAllMocks();
  owner.getOrCreateLocalOwner.mockResolvedValue({ ok: true, data: "owner-1" });
  repo.getSession.mockResolvedValue({ ok: true, data: fresh() });
  repo.getRequestOutcome.mockResolvedValue({ ok: true, data: null });
  repo.canonicalizeMutation.mockReturnValue("canonical");
});

describe("local gateway", () => {
  it("returns completed replay before reading a newer session and never commits twice", async () => {
    const next = calculateNextBundle(fresh(), request, getScenario(1));
    const result = { session: next.session, turn: next.turns[0], feedbackStatus: "pending" as const, replayed: false };
    repo.getRequestOutcome.mockResolvedValue({ ok: true, data: { canonicalPayload: "canonical", result } });
    expect(await applyAction(request)).toEqual({ ok: true, data: { ...result, replayed: true } });
    expect(repo.getSession).not.toHaveBeenCalled();
    expect(repo.commitMutation).not.toHaveBeenCalled();
  });
  it("resolves a same-ID commit racing between outcome lookup and session read", async () => {
    const next = calculateNextBundle(fresh(), request, getScenario(1));
    const result = { session: next.session, turn: next.turns[0], feedbackStatus: "pending" as const, replayed: false };
    repo.getRequestOutcome.mockResolvedValueOnce({ ok: true, data: null }).mockResolvedValueOnce({ ok: true, data: { canonicalPayload: "canonical", result } });
    repo.getSession.mockResolvedValue({ ok: true, data: next });
    expect(await applyAction(request)).toEqual({ ok: true, data: { ...result, replayed: true } });
    expect(repo.getRequestOutcome).toHaveBeenCalledTimes(2);
    expect(repo.commitMutation).not.toHaveBeenCalled();
  });
  it("rejects changed-payload replay and stale new requests without committing", async () => {
    repo.getRequestOutcome.mockResolvedValueOnce({ ok: true, data: { canonicalPayload: "different", result: {} } });
    const replay = await applyAction(request);
    expect(replay).toMatchObject({ ok: false, error: { code: "IDEMPOTENCY_CONFLICT", requestId: "request-1" } });
    const next = calculateNextBundle(fresh(), request, getScenario(1));
    repo.getSession.mockResolvedValue({ ok: true, data: next });
    expect(await applyAction({ ...request, requestId: "new-request" })).toMatchObject({ ok: false, error: { code: "STATE_CONFLICT" } });
    expect(repo.commitMutation).not.toHaveBeenCalled();
  });
  it("passes one full validated candidate bundle to the atomic repository", async () => {
    repo.commitMutation.mockResolvedValue({ ok: false, error: { code: "STATE_CONFLICT", message: "Concurrent write", retryable: false, requestId: request.requestId } });
    expect(await applyAction(request)).toMatchObject({ ok: false, error: { code: "STATE_CONFLICT" } });
    expect(repo.commitMutation).toHaveBeenCalledOnce();
    expect(repo.commitMutation.mock.calls[0][0]).toBe("owner-1");
    expect(repo.commitMutation.mock.calls[0][2]).toMatchObject({ session: { version: 1 }, turns: [{ decisionStatus: "pending" }] });
  });
  it("reads committed feedback repeatedly without performing financial mutations", async () => {
    repo.getSession.mockResolvedValue({ ok: true, data: calculateNextBundle(fresh(), request, getScenario(1)) });
    const feedbackRequest = { sessionId: "session-1", turnIndex: 1, decisionStatus: "pending" as const };
    const first = await getFeedback(feedbackRequest);
    expect(first).toEqual(await getFeedback(feedbackRequest));
    expect(first).toMatchObject({ ok: true, data: { origin: "prewritten" } });
    if (first.ok) expect(first.data.observations.every(observation => observation.trim().split(/\s+/).length < 25)).toBe(true);
    expect(await getFeedback({ ...feedbackRequest, decisionStatus: "settled" })).toMatchObject({ ok: false, error: { code: "STATE_CONFLICT" } });
    expect(repo.commitMutation).not.toHaveBeenCalled();
  });
  it("uses the same contribution calculation for preview and candidate mutation", async () => {
    const previewRequest = { sessionId: request.sessionId, expectedVersion: request.expectedVersion, savingsRateBps: request.savingsRateBps, contributionAllocation: request.contributionAllocation };
    const preview = await previewContribution(previewRequest);
    expect(preview).toMatchObject({ ok: true, data: { contributionRupiah: 2600000, allocatedContribution: { cash: 780000, bonds: 780000, equity: 1040000 } } });
    expect(repo.commitMutation).not.toHaveBeenCalled();
  });
  it("propagates visible storage failures and delegates fresh-session reset creation", async () => {
    const storage = { ok: false as const, error: { code: "STORAGE_UNAVAILABLE" as const, message: "Storage unavailable", retryable: false, requestId: null } };
    owner.getOrCreateLocalOwner.mockResolvedValueOnce(storage);
    expect(await getActiveSession()).toEqual(storage);
    expect(repo.getActiveSession).not.toHaveBeenCalled();
    repo.createSession.mockResolvedValue({ ok: true, data: fresh() });
    expect(await createSession({ requestId: "new-intent" })).toMatchObject({ ok: true });
    expect(repo.createSession).toHaveBeenCalledWith("owner-1", "new-intent");
  });
});



