import { z } from "zod";
import type { Evidence, InstrumentSnapshot, ResearchResponse } from "@/contracts";

/** Private provider protocol. This is not a public API or fixture version. */
export const RESEARCH_SELECTION_VERSION = "research-selection.v1";
interface CatalogText { id: string; text: string }
interface CatalogClaim extends CatalogText { evidenceIds: string[] }
export interface ResearchCatalog {
  summaries: CatalogText[];
  claims: CatalogClaim[];
  limitations: CatalogText[];
}

/** Only server-owned fixture data enters the public explanation text. */
export function createResearchCatalog(instruments: InstrumentSnapshot[]): ResearchCatalog {
  const summaries: CatalogText[] = [
    { id: "modeled-changes", text: "These selected educational baskets illustrate authored returns over a fixed synthetic teaching period, without contributions or withdrawals." },
    { id: "not-a-forecast", text: "The selected baskets show synthetic teaching assumptions. Their modeled changes are not forecasts or recommendations." },
    { id: "purchasing-power", text: "Nominal balance and inflation-adjusted purchasing power answer different questions in the synthetic simulation." },
    { id: "fees-unavailable", text: "Product fees are not modeled for these synthetic educational baskets." },
    { id: "outside-evidence", text: "Company fundamentals, live prices and personalized investment recommendations are unavailable from this synthetic basket evidence." },
  ];
  if (instruments.length === 2) summaries.push({ id: "compare-selected", text: "The two selected educational baskets can be compared over the same authored synthetic period. This comparison does not predict future outcomes." });
  const claims: CatalogClaim[] = instruments.flatMap(instrument => {
    const cumulative = instrument.metrics.find(metric => metric.key === "cumulative_return");
    const fee = instrument.metrics.find(metric => metric.key === "annual_fee");
    return [
      { id: `${instrument.id}:cumulative-return`, text: cumulative?.value == null
        ? `${instrument.name}: cumulative modeled return is unavailable.`
        : `${instrument.name}: cumulative synthetic return is ${(cumulative.value * 100).toFixed(3)}% from ${cumulative.periodStart} to ${cumulative.periodEnd}, without contributions or withdrawals.`, evidenceIds: ["ev-demo-method"] },
      { id: `${instrument.id}:annual-fee`, text: `${instrument.name}: annual fee is unavailable. ${fee?.unavailableReason ?? "Fees are not modeled."}`, evidenceIds: ["ev-demo-method"] },
    ];
  });
  claims.push(
    { id: "synthetic-methodology", text: "These educational baskets use authored synthetic assumptions, not observed market prices or forecasts.", evidenceIds: ["ev-demo-method"] },
    { id: "nominal-and-real", text: "The simulation distinguishes nominal money from inflation-adjusted purchasing power; a nominal increase alone does not establish a purchasing-power increase.", evidenceIds: ["ev-demo-method"] },
  );
  return { summaries, claims, limitations: [
    { id: "synthetic-only", text: "Only the frozen synthetic teaching evidence for the selected baskets is available." },
    { id: "no-live-context", text: "Live company panels, company fundamentals and real prices are outside this mentor's evidence." },
    { id: "not-personal-advice", text: "No personal holdings, financial circumstances or investment recommendations are analyzed." },
    { id: "fees-not-modeled", text: "These educational baskets have no modeled product fee; this does not establish the cost of a real product." },
  ] };
}
const uniqueIds = (values: string[]) => new Set(values).size === values.length;
const selectionSchema = z.object({
  protocolVersion: z.literal(RESEARCH_SELECTION_VERSION),
  summaryId: z.string().min(1).max(100),
  claimIds: z.array(z.string().min(1).max(100)).min(1).max(6).refine(uniqueIds),
  limitationIds: z.array(z.string().min(1).max(100)).max(4).refine(uniqueIds),
}).strict();

/** No model-authored prose, URLs, values or evidence IDs are copied to the result. */
export function resolveResearchSelection(raw: unknown, catalog: ResearchCatalog, evidence: Evidence[]): { ok: true; data: ResearchResponse } | { ok: false; reason: "invalid" | "evidence" } {
  const parsed = selectionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const summary = catalog.summaries.find(item => item.id === parsed.data.summaryId);
  const facts = parsed.data.claimIds.map(id => catalog.claims.find(item => item.id === id));
  const limitations = parsed.data.limitationIds.map(id => catalog.limitations.find(item => item.id === id));
  if (!summary || facts.some(item => !item) || limitations.some(item => !item)) return { ok: false, reason: "evidence" };
  const evidenceIds = new Set(evidence.map(item => item.id));
  if (facts.some(item => item!.evidenceIds.some(id => !evidenceIds.has(id)))) return { ok: false, reason: "evidence" };
  return { ok: true, data: {
    summary: summary.text,
    facts: facts.map(item => ({ text: item!.text, evidenceIds: [...item!.evidenceIds] })),
    limitations: [...limitations.map(item => item!.text),
      "A model selected and ordered these prewritten explanations for your question from the frozen teaching evidence.",
      "This bounded explanation may not answer every detail of your question. Synthetic assumptions are not forecasts or personalized financial advice."],
    evidence: structuredClone(evidence), origin: "model",
  } };
}

/** Strict upstream enum schema plus independent server validation after the response. */
export function researchSelectionFormat(catalog: ResearchCatalog) {
  return { type: "json_schema", name: "vamm_research_selection", strict: true,
    schema: { type: "object", additionalProperties: false,
      properties: {
        protocolVersion: { type: "string", enum: [RESEARCH_SELECTION_VERSION] },
        summaryId: { type: "string", enum: catalog.summaries.map(item => item.id) },
        claimIds: { type: "array", items: { type: "string", enum: catalog.claims.map(item => item.id) } },
        limitationIds: { type: "array", items: { type: "string", enum: catalog.limitations.map(item => item.id) } },
      }, required: ["protocolVersion", "summaryId", "claimIds", "limitationIds"],
    },
  };
}
