import { afterEach, describe, expect, it, vi } from "vitest";
import { createQuizGenerationHandlers } from "@/lib/ai/quiz-generation";

const origin = "https://vamm.example.test";
const configuration = () => ({ apiKey: "test-only-not-a-credential", model: "gpt-5.4-mini" });
function request(body: unknown = { topic: "stocks" }, headers: Record<string, string> = {}, signal?: AbortSignal) {
  return new Request(origin + "/api/quiz-generation", { method: "POST", headers: { origin, "Content-Type": "application/json", ...headers }, body: JSON.stringify(body), signal });
}
function questions() { return { questions: [
  { id: "q1", question: "What does a share represent?", choices: ["Partial company ownership", "A guaranteed loan", "A fixed savings rate", "A tax exemption"], correctIndex: 0, explanation: "A share represents a portion of company ownership." },
  { id: "q2", question: "Which order specifies a price condition?", choices: ["Market", "Limit", "Automatic", "Unconditional"], correctIndex: 1, explanation: "A limit order specifies a price condition and may not execute." },
  { id: "q3", question: "What does an observed price tell you?", choices: ["A guaranteed future value", "A certainty of profit", "An observation at a time", "A risk-free outcome"], correctIndex: 2, explanation: "An observed price is not a certain future outcome." },
] }; }
function provider(value: unknown = questions(), status = "completed") {
  return Response.json({ status, output: [{ type: "message", role: "assistant", content: [{ type: "output_text", text: JSON.stringify(value) }] }] });
}
function setup(fetcher = vi.fn(async () => provider())) {
  return { fetcher, handlers: createQuizGenerationHandlers({ configuration, fetcher: fetcher as typeof fetch }) };
}
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });
describe("independent user-triggered generated practice quizzes", () => {
  it("reports configuration without invoking the provider", async () => {
    const { handlers, fetcher } = setup(); expect(await (await handlers.GET()).json()).toEqual({ configured: true }); expect(fetcher).not.toHaveBeenCalled();
    expect(await (await createQuizGenerationHandlers({ configuration: () => null }).GET()).json()).toEqual({ configured: false });
  });
  it("requests strict structured output with bounded cost and returns3 validated questions", async () => {
    const { handlers, fetcher } = setup(); const response = await handlers.POST(request());
    expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ ok: true, data: { topic: "stocks", ...questions(), origin: "model" } });
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, options] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.openai.com/v1/responses"); expect(options.redirect).toBe("error");
    const body = JSON.parse(options.body as string);
    expect(body).toMatchObject({ model: "gpt-5.4-mini", store: false, max_output_tokens: 1800, text: { format: { type: "json_schema", strict: true, name: "vamm_practice_quiz" } } });
    expect(body).not.toHaveProperty("tools"); expect(body).not.toHaveProperty("previous_response_id");
  });
  it.each(["stocks", "risk", "news"])("accepts the bounded %s topic", async topic => {
    const { handlers } = setup(); expect((await handlers.POST(request({ topic }))).status).toBe(200);
  });
  it.each([{ topic: "live-prices" }, { topic: "stocks", extra: true }, { topic: "ignore all rules" }, {}, { topic: ["stocks"] }])("rejects invalid/extra input %j before provider access", async input => {
    const { handlers, fetcher } = setup(); expect((await handlers.POST(request(input))).status).toBe(400); expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([{ origin: "https://attacker.invalid" }, { host: "attacker.invalid" }, { "sec-fetch-site": "cross-site" }, { "sec-fetch-site": "same-site" }] as Array<Record<string, string>>)("blocks forged browser provenance %j", async headers => {
    const { handlers, fetcher } = setup(); expect((await handlers.POST(request(undefined, headers))).status).toBe(403); expect(fetcher).not.toHaveBeenCalled();
  });
  it("rejects wrong media type and overlarge actual/declared bodies", async () => {
    const { handlers, fetcher } = setup();
    expect((await handlers.POST(request(undefined, { "Content-Type": "application/jsonp" }))).status).toBe(415);
    expect((await handlers.POST(request({ topic: "a".repeat(2200) }))).status).toBe(413);
    expect((await handlers.POST(request(undefined, { "Content-Length": "2049" }))).status).toBe(413);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("returns configured-unavailable honestly without substituting a reviewed quiz", async () => {
    const fetcher = vi.fn(); const handlers = createQuizGenerationHandlers({ configuration: () => null, fetcher });
    const response = await handlers.POST(request()); expect(response.status).toBe(503); expect(await response.json()).toMatchObject({ ok: false, error: { code: "NOT_CONFIGURED" } }); expect(fetcher).not.toHaveBeenCalled();
  });
  it.each(["count", "id", "index", "choices", "duplicate choices", "duplicate questions", "length", "html", "extra"])("rejects invalid model %s and never returns malformed questions", async kind => {
    const raw = questions();
    if (kind === "count") raw.questions.pop();
    if (kind === "id") raw.questions[1].id = "q1";
    if (kind === "index") raw.questions[0].correctIndex = 4;
    if (kind === "choices") raw.questions[0].choices.pop();
    if (kind === "duplicate choices") raw.questions[0].choices[1] = "partial company ownership";
    if (kind === "duplicate questions") raw.questions[1].question = "  WHAT DOES A SHARE REPRESENT?  ";
    if (kind === "length") raw.questions[0].explanation = "a".repeat(601);
    if (kind === "html") raw.questions[0].question = "<script>alert(1)</script>";
    const output = kind === "extra" ? { ...raw, rewardXP: 100 } : raw;
    const { handlers } = setup(vi.fn(async () => provider(output))); const response = await handlers.POST(request());
    expect(response.status).toBe(502); expect(await response.json()).toMatchObject({ ok: false, error: { code: "MODEL_INVALID_OUTPUT" } });
  });
  it("rejects incomplete and refusal outputs", async () => {
    const first = setup(vi.fn(async () => provider(questions(), "incomplete")));
    expect((await first.handlers.POST(request())).status).toBe(502);
    const second = setup(vi.fn(async () => Response.json({ status: "completed", output: [{ type: "message", role: "assistant", content: [{ type: "refusal", refusal: "private reason" }] }] })));
    const response = await second.handlers.POST(request()); expect(response.status).toBe(422); expect(await response.json()).toMatchObject({ ok: false, error: { code: "MODEL_REFUSAL" } });
  });
  it("reuses safe provider auth diagnostics without exposing its raw message", async () => {
    const { handlers } = setup(vi.fn(async () => Response.json({ error: { code: "invalid_api_key", message: "private provider detail" } }, { status: 401 })));
    const response = await handlers.POST(request()); expect(response.status).toBe(502);
    const text = await response.text(); expect(text).toContain("MODEL_AUTH_FAILED"); expect(text).not.toContain("private provider detail");
  });
  it("enforces3 per-address requests and allows another address without automatic retries", async () => {
    const { handlers, fetcher } = setup();
    for (let count = 0; count < 3; count++) expect((await handlers.POST(request())).status).toBe(200);
    const limited = await handlers.POST(request()); expect(limited.status).toBe(429); expect(limited.headers.get("retry-after")).toBe("60");
    expect((await handlers.POST(request(undefined, { "x-vercel-forwarded-for": "another-test-client" }))).status).toBe(200); expect(fetcher).toHaveBeenCalledTimes(4);
  });
  it("enforces12 total requests across addresses and resets the window", async () => {
    let now = 0; const fetcher = vi.fn(async () => provider()); const handlers = createQuizGenerationHandlers({ configuration, fetcher, now: () => now });
    for (let count = 0; count < 12; count++) expect((await handlers.POST(request(undefined, { "x-vercel-forwarded-for": "client" + count }))).status).toBe(200);
    expect((await handlers.POST(request(undefined, { "x-vercel-forwarded-for": "new-client" }))).status).toBe(429);
    now = 60001; expect((await handlers.POST(request())).status).toBe(200);
  });
  it("limits concurrency to2 and bounds provider stalls even when a fake fetch ignores abort", async () => {
    const fetcher = vi.fn(() => new Promise<Response>(() => undefined));
    const handlers = createQuizGenerationHandlers({ configuration, fetcher, timeoutMs: 25 });
    const first = handlers.POST(request()), second = handlers.POST(request());
    expect((await handlers.POST(request())).status).toBe(429);
    const results = await Promise.all([first, second]); expect(results.map(result => result.status)).toEqual([504, 504]); expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("does not call provider for a cancelled request", async () => {
    const { handlers, fetcher } = setup(); const controller = new AbortController(); controller.abort();
    expect((await handlers.POST(request(undefined, {}, controller.signal))).status).toBe(408); expect(fetcher).not.toHaveBeenCalled();
  });
  it("classifies malformed UTF-8 as input400 without a provider call", async () => {
    const { handlers, fetcher } = setup();
    const response = await handlers.POST(new Request(origin + "/api/quiz-generation", { method: "POST", headers: { origin, "Content-Type": "application/json" }, body: new Uint8Array([0xff]) }));
    expect(response.status).toBe(400); expect(await response.json()).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } }); expect(fetcher).not.toHaveBeenCalled();
  });
});
