import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Exercise the route boundary without constructing a real configured provider.
const mocks = vi.hoisted(() => ({ research: vi.fn(), configuredProvider: vi.fn() }));
vi.mock("@/lib/ai/research", () => ({ runResearch: mocks.research }));
vi.mock("@/lib/ai/server-provider", () => ({ configuredResearchProvider: mocks.configuredProvider }));
const valid = { instrumentIds: ["edu-bonds"], question: "Explain the synthetic basket." };
let post: (request: Request) => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  mocks.research.mockReset().mockResolvedValue({ ok: true, data: { summary: "Synthetic fixture context only.", facts: [], limitations: [], evidence: [], origin: "prewritten" } });
  mocks.configuredProvider.mockReset().mockReturnValue(null);
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Unexpected external network request."); }));
  post = (await import("@/app/api/research/route")).POST;
});
afterEach(() => vi.unstubAllGlobals());

describe("exact research request media type", () => {
  it.each(["application/json", "Application/JSON; charset=utf-8", "application/json ; charset=UTF-8"])("accepts JSON with permitted case/parameters: %s", async contentType => {
    const response = await post(new Request("http://localhost/api/research", { method: "POST", headers: { "Content-Type": contentType }, body: JSON.stringify(valid) }));
    expect(response.status).toBe(200);
    expect(mocks.research).toHaveBeenCalledWith(valid, null);
    expect(mocks.configuredProvider).toHaveBeenCalledOnce();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(["application/jsonp", "application/json-not-really", "application/jsonp; charset=utf-8", "application/problem+json", "text/plain", "image/png", ""])("rejects other media types before provider construction: %s", async contentType => {
    const response = await post(new Request("http://localhost/api/research", { method: "POST", headers: { "Content-Type": contentType }, body: JSON.stringify(valid) }));
    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ ok: false, error: { code: "INVALID_INPUT", retryable: false } });
    expect(mocks.research).not.toHaveBeenCalled();
    expect(mocks.configuredProvider).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects actual multipart screenshot input before constructing a provider", async () => {
    const form = new FormData();
    form.set("image", new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" }), "chart.png");
    const response = await post(new Request("http://localhost/api/research", { method: "POST", body: form }));
    expect(response.status).toBe(400);
    expect(mocks.research).not.toHaveBeenCalled();
    expect(mocks.configuredProvider).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("retains actual streamed byte limits for valid JSON media types", async () => {
    const response = await post(new Request("http://localhost/api/research", { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": "1" }, body: JSON.stringify(valid) + " ".repeat(8192) }));
    expect(response.status).toBe(400);
    expect(mocks.research).not.toHaveBeenCalled();
    expect(mocks.configuredProvider).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});
