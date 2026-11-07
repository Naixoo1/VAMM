import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { configuredResearchProvider } from "@/lib/ai/server-provider";
import { ResearchProviderError } from "@/lib/ai/research";
import { getMarketData } from "@/lib/data/fixtures";
const output = { summary: "Synthetic baskets.", facts: [{ text: "Fees are unavailable.", evidenceIds: ["ev-demo-method"] }], limitations: ["No forecasts."] };
const market = getMarketData();
const context = { request: { instrumentIds: ["edu-cash"], question: "Explain" }, instruments: [market.instruments[0]], evidence: market.evidence.filter(e => e.id === "ev-demo-method") };

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  vi.stubEnv("OPENAI_API_KEY", "");
  vi.stubEnv("OPENAI_RESEARCH_MODEL", "test-only-model");
  vi.stubEnv("VAMM_DISABLE_MODEL", "0");
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("server provider with mocked HTTP only", () => {
  it("makes no request when unconfigured or explicitly disabled", () => {
    expect(configuredResearchProvider()).toBeUndefined();
    vi.stubEnv("OPENAI_API_KEY", "test-only-key");
    vi.stubEnv("VAMM_DISABLE_MODEL", "1");
    expect(configuredResearchProvider()).toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("uses one stateless structured-output request and extracts completed content", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-only-key");
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(output) }] }] })));
    expect(await configuredResearchProvider()!(context, new AbortController().signal)).toEqual(output);
    expect(fetch).toHaveBeenCalledOnce();
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
    expect(body).toMatchObject({ store: false, max_output_tokens: 1200, text: { format: { type: "json_schema", strict: true } } });
    expect(body.tools).toBeUndefined();
  });
  it.each([
    [{ status: "completed", output: [{ content: [{ type: "refusal", refusal: "No" }] }] }, "refusal"],
    [{ status: "incomplete", output: [] }, "incomplete"],
    [{ status: "completed", output: [{ content: [{ type: "output_text", text: "{" }] }] }, "invalid"],
  ])("rejects refused, incomplete or malformed provider envelopes", async (envelope, reason) => {
    vi.stubEnv("OPENAI_API_KEY", "test-only-key");
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(envelope)));
    await expect(configuredResearchProvider()!(context, new AbortController().signal)).rejects.toMatchObject({ reason });
  });
  it("bounds upstream bytes", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-only-key");
    vi.mocked(fetch).mockResolvedValue(new Response("x".repeat(32769)));
    await expect(configuredResearchProvider()!(context, new AbortController().signal)).rejects.toBeInstanceOf(ResearchProviderError);
  });
});
describe("research HTTP guards", () => {
  async function route() { vi.resetModules(); return (await import("@/app/api/research/route")).POST; }
  const request = (body: unknown) => new Request("http://localhost/api/research", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  it("returns labeled fallback through the contract envelope with no model call", async () => {
    const post = await route();
    const response = await post(request(context.request));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, data: { origin: "prewritten" } });
    expect(fetch).not.toHaveBeenCalled();
  });
  it("rejects oversized streamed JSON, malformed JSON and unsupported client state", async () => {
    const post = await route();
    expect((await post(request({ ...context.request, question: "x".repeat(9000) }))).status).toBe(400);
    expect((await post(new Request("http://localhost/api/research", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" }))).status).toBe(400);
    expect((await post(request({ ...context.request, balances: { cash: 1 } }))).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("enforces per-address request rate and gives a visible retry response", async () => {
    const post = await route();
    for (let i = 0; i < 6; i++) expect((await post(request(context.request))).status).toBe(200);
    const response = await post(request(context.request));
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(await response.json()).toMatchObject({ ok: false, error: { code: "RATE_LIMITED", retryable: true } });
  });
});

