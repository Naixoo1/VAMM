import { afterEach, describe, expect, it, vi } from "vitest";
import { ResearchProviderError, runResearch } from "@/lib/ai/research";
import type { ResearchContext } from "@/lib/ai/research";
import { RESEARCH_SELECTION_VERSION } from "@/lib/ai/research-catalog";
const request = { instrumentIds: ["edu-bonds", "edu-equity"], question: "Explain the modeled changes." };
const validOutput = { protocolVersion: RESEARCH_SELECTION_VERSION, summaryId: "not-a-forecast", claimIds: ["edu-bonds:annual-fee"], limitationIds: ["synthetic-only"] };
afterEach(() => vi.useRealTimers());

describe("grounded research and labeled fallback", () => {
  it("works unconfigured with selected fixture facts, provenance and unavailable fees", async () => {
    const result = await runResearch(request);
    expect(result).toMatchObject({ ok: true, data: { origin: "prewritten", evidence: [{ id: "ev-demo-method", sourceUrl: null }] } });
    if (!result.ok) return;
    expect(result.data.facts).toHaveLength(4);
    expect(result.data.facts.map(fact => fact.text).join(" ")).toContain("12.476%");
    expect(result.data.facts.map(fact => fact.text).join(" ")).toContain("4.544%");
    expect(result.data.limitations.join(" ")).toContain("not configured");
    expect(result.data.limitations.join(" ")).toContain("research-demo.v1");
  });
  it.each([
    { instrumentIds: ["unknown"], question: "Explain" },
    { instrumentIds: ["edu-cash", "edu-cash"], question: "Explain" },
    { instrumentIds: ["edu-cash"], question: " " },
    { instrumentIds: ["edu-cash"], question: "x".repeat(1001) },
    { ...request, sourceUrl: "https://untrusted.example" },
    { ...request, balances: { cash: 10000000 } },
  ])("rejects invalid request before using a provider: %j", async input => {
    const provider = vi.fn().mockResolvedValue(validOutput);
    expect(await runResearch(input, provider)).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    expect(provider).not.toHaveBeenCalled();
  });
  it("selects evidence server-side, resolves supported model selections and labels their origin", async () => {
    const provider = vi.fn().mockResolvedValue(validOutput);
    const result = await runResearch({ ...request, question: "  Explain  " }, provider);
    expect(provider).toHaveBeenCalledOnce();
    const context = provider.mock.calls[0][0];
    expect(context.request.question).toBe("Explain");
    expect(context.evidence).toMatchObject([{ id: "ev-demo-method", sourceUrl: null, dataMode: "synthetic" }]);
    expect(result).toMatchObject({ ok: true, data: { origin: "model", summary: "The selected baskets show synthetic teaching assumptions. Their modeled changes are not forecasts or recommendations." } });
    if (result.ok) {
      expect(result.data.facts).toEqual([{ text: "Simulated bond basket: annual fee is unavailable. Educational basket has no modeled product fee", evidenceIds: ["ev-demo-method"] }]);
      expect(result.data.limitations.join(" ")).toContain("A model selected and ordered");
    }
  });
  it.each([
    ["unknown claim", { ...validOutput, claimIds: ["ev-made-up"] }, "unknown or unsupported"],
    ["malformed", { summary: "Missing facts" }, "invalid output"],
    ["extra field", { ...validOutput, action: "ADVANCE" }, "invalid output"],
  ])("falls back on %s without retrying", async (_label, output, expected) => {
    const provider = vi.fn().mockResolvedValue(output);
    const result = await runResearch(request, provider);
    expect(result).toMatchObject({ ok: true, data: { origin: "prewritten" } });
    if (result.ok) expect(result.data.limitations.join(" ")).toContain(expected);
    expect(provider).toHaveBeenCalledOnce();
  });
  it.each(["refusal", "incomplete", "unavailable", "invalid"] as const)("falls back after provider %s without retry", async reason => {
    const provider = vi.fn().mockRejectedValue(new ResearchProviderError(reason));
    expect(await runResearch(request, provider)).toMatchObject({ ok: true, data: { origin: "prewritten" } });
    expect(provider).toHaveBeenCalledOnce();
  });
  it("aborts at the deadline even if a provider ignores cancellation", async () => {
    vi.useFakeTimers();
    const provider = vi.fn((context: ResearchContext, signal: AbortSignal) => { expect(context.evidence[0].id).toBe("ev-demo-method"); expect(signal.aborted).toBe(false); return new Promise<unknown>(() => {}); });
    const promise = runResearch(request, provider, 15000);
    await vi.advanceTimersByTimeAsync(15000);
    const result = await promise;
    expect(provider.mock.calls[0][1].aborted).toBe(true);
    expect(result).toMatchObject({ ok: true, data: { origin: "prewritten" } });
    if (result.ok) expect(result.data.limitations.join(" ")).toContain("15-second");
    expect(provider).toHaveBeenCalledOnce();
  });
});
