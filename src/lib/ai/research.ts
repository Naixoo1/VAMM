import { createResearchCatalog, resolveResearchSelection, type ResearchCatalog } from "./research-catalog";
import type { Evidence, InstrumentSnapshot, ResearchRequest, ResearchResponse, Result } from "@/contracts";
import { RESEARCH_FALLBACK_VERSION } from "@/contracts";
import { researchRequestSchema } from "@/contracts/validation";
import { getMarketData } from "@/lib/data/fixtures";

export interface ResearchContext { request: ResearchRequest; instruments: InstrumentSnapshot[]; evidence: Evidence[]; catalog: ResearchCatalog; }
export type ResearchProvider = (context: ResearchContext, signal: AbortSignal) => Promise<unknown>;
export class ResearchProviderError extends Error {
  constructor(public readonly reason: "refusal" | "incomplete" | "unavailable" | "invalid") { super(reason); this.name = "ResearchProviderError"; }
}
const failureReasons = {
  unconfigured: "The research model is not configured; no model request was made.",
  timeout: "The research service exceeded its 15-second deadline.",
  refusal: "The research service declined this request.",
  incomplete: "The research service returned an incomplete response.",
  unavailable: "The research service was unavailable.",
  invalid: "The research service returned invalid output.",
  evidence: "The research service returned an unknown or unsupported explanation selection.",
} as const;
type FallbackReason = keyof typeof failureReasons;

export function researchFallback(context: ResearchContext, reason: FallbackReason): ResearchResponse {
  const facts = context.instruments.flatMap(instrument => {
    const cumulative = instrument.metrics.find(metric => metric.key === "cumulative_return");
    const fee = instrument.metrics.find(metric => metric.key === "annual_fee");
    return [
      { text: cumulative?.value == null ? `${instrument.name}: cumulative modeled return is unavailable.`
        : `${instrument.name}: cumulative synthetic return is ${(cumulative.value * 100).toFixed(3)}% from ${cumulative.periodStart} to ${cumulative.periodEnd}, without contributions or withdrawals.`,
        evidenceIds: ["ev-demo-method"] },
      { text: `${instrument.name}: annual fee is unavailable. ${fee?.unavailableReason ?? "Fees are not modeled."}`, evidenceIds: ["ev-demo-method"] },
    ];
  });
  return { summary: "These educational baskets illustrate authored assumptions about returns and inflation. Their synthetic results are not a forecast or a recommendation.",
    facts, limitations: [`Prewritten fixture fallback (${RESEARCH_FALLBACK_VERSION}).`, failureReasons[reason],
      "This prewritten response covers the selected baskets and may not answer your exact question.",
      "Company fundamentals, live prices, personal portfolio analysis and product fees are unavailable."],
    evidence: context.evidence, origin: "prewritten" };
}

export async function runResearch(input: unknown, provider?: ResearchProvider, timeoutMs = 15000): Promise<Result<ResearchResponse>> {
  const parsed = researchRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: { code: "INVALID_INPUT", message: "Choose one or two distinct educational instruments and enter a question of 1–1000 characters.", retryable: false, requestId: null } };
  const market = getMarketData();
  const instruments = parsed.data.instrumentIds.map(id => market.instruments.find(instrument => instrument.id === id)!);
  const context: ResearchContext = {
    request: parsed.data, instruments,
    evidence: market.evidence.filter(item => item.id === "ev-demo-method"),
    catalog: createResearchCatalog(instruments),
  };
  if (!provider) return { ok: true, data: researchFallback(context, "unconfigured") };
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let timedOut = false;
  try {
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => { timedOut = true; controller.abort(); reject(new Error("deadline")); }, timeoutMs);
    });
    const raw = await Promise.race([provider(structuredClone(context), controller.signal), deadline]);
    const result = resolveResearchSelection(raw, context.catalog, context.evidence);
    if (!result.ok) return { ok: true, data: researchFallback(context, result.reason) };
    return { ok: true, data: result.data };
  } catch (error) {
    const reason = timedOut ? "timeout" : error instanceof ResearchProviderError ? error.reason : "unavailable";
    return { ok: true, data: researchFallback(context, reason) };
  } finally { if (timer !== undefined) clearTimeout(timer); }
}
