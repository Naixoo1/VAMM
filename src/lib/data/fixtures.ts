import { CALCULATION_VERSION, DATASET_VERSION, SCENARIO_SEQUENCE_ID } from "@/contracts";
import type { Evidence, MarketResponse, NewsResponse, Scenario } from "@/contracts";

export { CALCULATION_VERSION, DATASET_VERSION, SCENARIO_SEQUENCE_ID };
export const OBSERVED_AT = "2026-11-06T00:00:00Z";
export const INSTRUMENT_IDS = ["edu-cash", "edu-bonds", "edu-equity"] as const;

const methodology: Evidence = {
  id: "ev-demo-method", title: "VAMM synthetic teaching methodology",
  sourceUrl: null, observedAt: OBSERVED_AT, dataMode: "synthetic", datasetVersion: DATASET_VERSION,
};

const stories = [
  { id: "news-inflation", evidenceId: "ev-news-inflation", headline: "Synthetic scenario: rising prices reduce cash purchasing power", sentiment: "negative", sentimentReason: "Describes pressure on purchasing power" },
  { id: "news-bonds", evidenceId: "ev-news-bonds", headline: "Synthetic scenario: bond basket records a modest gain", sentiment: "positive", sentimentReason: "Describes a positive scenario return" },
  { id: "news-equity", evidenceId: "ev-news-equity", headline: "Synthetic scenario: equity basket falls before recovering", sentiment: "mixed", sentimentReason: "Describes both a decline and recovery" },
] as const;
const newsEvidence: Evidence[] = stories.map(story => ({ id: story.evidenceId, title: story.headline, sourceUrl: null, observedAt: OBSERVED_AT, dataMode: "synthetic", datasetVersion: DATASET_VERSION }));
const dates = ["2023-11-06", "2024-11-06", "2025-11-06", "2026-11-06"];
const baskets = [
  { id: "edu-cash", name: "Simulated cash", assetClass: "cash", values: [100, 100, 100, 100], cumulativeReturn: 0 },
  { id: "edu-bonds", name: "Simulated bond basket", assetClass: "bonds", values: [100, 104, 107.12, 112.476], cumulativeReturn: 0.12476 },
  { id: "edu-equity", name: "Simulated diversified equity basket", assetClass: "equity", values: [100, 108, 95.04, 104.544], cumulativeReturn: 0.04544 },
] as const;
const market: MarketResponse = {
  contractVersion: 2,
  instruments: baskets.map(basket => ({
    id: basket.id, name: basket.name, assetClass: basket.assetClass, currency: "IDR", observedAt: OBSERVED_AT,
    dataMode: "synthetic", datasetVersion: DATASET_VERSION, evidenceIds: ["ev-demo-method"],
    metrics: [
      { key: "cumulative_return", value: basket.cumulativeReturn, unit: "ratio", periodStart: dates[0], periodEnd: dates[3], methodology: "Compounded synthetic returns; no contributions or withdrawals", unavailableReason: null },
      { key: "annual_fee", value: null, unit: "ratio", periodStart: null, periodEnd: null, methodology: "Not modeled", unavailableReason: "Educational basket has no modeled product fee" },
    ],
  })),
  chartSeries: baskets.map(basket => ({ instrumentId: basket.id, currency: "IDR", unit: "index", baseValue: 100, dataMode: "synthetic", datasetVersion: DATASET_VERSION, evidenceIds: ["ev-demo-method"], points: dates.map((date, index) => ({ date, value: basket.values[index] })) })),
  evidence: [methodology],
};
const news: NewsResponse = {
  contractVersion: 2, datasetVersion: DATASET_VERSION,
  items: stories.map(story => ({ id: story.id, headline: story.headline, publishedAt: OBSERVED_AT, sourceName: null, sourceUrl: null, dataMode: "synthetic", evidenceIds: [story.evidenceId], sentiment: story.sentiment, sentimentReason: story.sentimentReason, sentimentOrigin: "prewritten" })),
  evidence: newsEvidence,
};
const scenarios: Scenario[] = [
  { id: "turn-01", datasetVersion: DATASET_VERSION, turnIndex: 1, durationYears: 1, weeklyAllowanceRupiah: 100000, allowanceMultiplier: 1, returnsByAsset: { cash: 0, bonds: 0.04, equity: 0.08 }, inflationRate: 0.03, shock: { id: "shock-device", title: "Device repair", costRupiah: 150000, mechanism: "An essential study device needs an unexpected repair." }, evidenceIds: ["ev-demo-method"] },
  { id: "turn-02", datasetVersion: DATASET_VERSION, turnIndex: 2, durationYears: 1, weeklyAllowanceRupiah: 100000, allowanceMultiplier: 1.5, returnsByAsset: { cash: 0, bonds: 0.03, equity: -0.12 }, inflationRate: 0.04, shock: { id: "shock-school", title: "School expense", costRupiah: 200000, mechanism: "An unexpected school-related cost reduces available savings." }, evidenceIds: ["ev-demo-method"] },
  { id: "turn-03", datasetVersion: DATASET_VERSION, turnIndex: 3, durationYears: 1, weeklyAllowanceRupiah: 100000, allowanceMultiplier: 2, returnsByAsset: { cash: 0, bonds: 0.05, equity: 0.10 }, inflationRate: 0.025, shock: { id: "shock-home", title: "Household repair", costRupiah: 300000, mechanism: "The scenario includes a contribution to an urgent household repair." }, evidenceIds: ["ev-demo-method"] },
];

/** Independent copies keep consumers from mutating the frozen baseline. */
export function getMarketData(): MarketResponse { return structuredClone(market); }
export function getNewsData(): NewsResponse { return structuredClone(news); }
export function getEvidenceCatalog(): Evidence[] { return structuredClone([methodology, ...newsEvidence]); }
export function getScenario(turnIndex: number): Scenario {
  if (!Number.isInteger(turnIndex) || turnIndex < 1 || turnIndex > 3) throw new RangeError("The frozen scenario sequence has exactly three annual turns.");
  return structuredClone(scenarios[turnIndex - 1]);
}
