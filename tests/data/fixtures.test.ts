import { describe, expect, it } from "vitest";
import { GET as marketGET } from "@/app/api/market/route";
import { GET as newsGET } from "@/app/api/news/route";
import { scenarioSchema } from "@/contracts/validation";
import { getEvidenceCatalog, getMarketData, getNewsData, getScenario } from "@/lib/data/fixtures";

describe("frozen synthetic fixture manifest", () => {
  it("preserves instrument order, exact dated index values, and unavailable fees", () => {
    const response = getMarketData();
    expect(response.contractVersion).toBe(2);
    expect(response.instruments.map(item => [item.id, item.name, item.assetClass])).toEqual([
      ["edu-cash", "Simulated cash", "cash"],
      ["edu-bonds", "Simulated bond basket", "bonds"],
      ["edu-equity", "Simulated diversified equity basket", "equity"],
    ]);
    expect(response.chartSeries.map(item => item.points)).toEqual([
      [100, 100, 100, 100], [100, 104, 107.12, 112.476], [100, 108, 95.04, 104.544],
    ].map(values => values.map((value, index) => ({ date: ["2023-11-06", "2024-11-06", "2025-11-06", "2026-11-06"][index], value }))));
    expect(response.instruments.map(item => item.metrics[0].value)).toEqual([0, 0.12476, 0.04544]);
    for (const item of response.instruments) {
      expect(item).toMatchObject({ currency: "IDR", dataMode: "synthetic", observedAt: "2026-11-06T00:00:00Z", datasetVersion: "vamm-demo-2026-11-06.v1", evidenceIds: ["ev-demo-method"] });
      expect(item.metrics.map(metric => metric.key)).toEqual(["cumulative_return", "annual_fee"]);
      expect(item.metrics[0]).toMatchObject({ unit: "ratio", periodStart: "2023-11-06", periodEnd: "2026-11-06", unavailableReason: null });
      expect(item.metrics[1]).toEqual({ key: "annual_fee", value: null, unit: "ratio", periodStart: null, periodEnd: null, methodology: "Not modeled", unavailableReason: "Educational basket has no modeled product fee" });
    }
  });

  it("supplies exactly three ordered scenarios with fixed shocks and valid v2 shapes", () => {
    const scenarios = [1, 2, 3].map(getScenario);
    expect(scenarios.map(item => [item.id, item.allowanceMultiplier, item.returnsByAsset, item.inflationRate, item.shock.id, item.shock.costRupiah])).toEqual([
      ["turn-01", 1, { cash: 0, bonds: 0.04, equity: 0.08 }, 0.03, "shock-device", 150000],
      ["turn-02", 1.5, { cash: 0, bonds: 0.03, equity: -0.12 }, 0.04, "shock-school", 200000],
      ["turn-03", 2, { cash: 0, bonds: 0.05, equity: 0.10 }, 0.025, "shock-home", 300000],
    ]);
    for (const scenario of scenarios) {
      expect(scenarioSchema.safeParse(scenario).success).toBe(true);
      expect(scenario).toMatchObject({ durationYears: 1, weeklyAllowanceRupiah: 100000, evidenceIds: ["ev-demo-method"] });
    }
    for (const invalid of [0, 4, 1.5, NaN, Infinity]) expect(() => getScenario(invalid)).toThrow(RangeError);
  });

  it("never invents news publishers and preserves mixed prewritten sentiment", () => {
    const response = getNewsData();
    expect(response.items.map(item => [item.id, item.headline, item.sentiment, item.sentimentReason])).toEqual([
      ["news-inflation", "Synthetic scenario: rising prices reduce cash purchasing power", "negative", "Describes pressure on purchasing power"],
      ["news-bonds", "Synthetic scenario: bond basket records a modest gain", "positive", "Describes a positive scenario return"],
      ["news-equity", "Synthetic scenario: equity basket falls before recovering", "mixed", "Describes both a decline and recovery"],
    ]);
    for (const item of response.items) {
      expect(item).toMatchObject({ sourceName: null, sourceUrl: null, dataMode: "synthetic", sentimentOrigin: "prewritten", publishedAt: "2026-11-06T00:00:00Z" });
      expect(response.evidence.find(evidence => item.evidenceIds.includes(evidence.id))?.title).toBe(item.headline);
    }
    const catalog = getEvidenceCatalog();
    expect(catalog.map(item => item.id)).toEqual(["ev-demo-method", "ev-news-inflation", "ev-news-bonds", "ev-news-equity"]);
    expect(catalog.every(item => item.sourceUrl === null && item.dataMode === "synthetic" && item.datasetVersion === "vamm-demo-2026-11-06.v1")).toBe(true);
  });

  it("returns independent copies and matching Result envelopes from both endpoints", async () => {
    const market = getMarketData();
    market.instruments[0].name = "changed";
    market.chartSeries[0].points[0].value = 999;
    const news = getNewsData();
    news.items[0].headline = "changed";
    const scenario = getScenario(1);
    scenario.shock.costRupiah = 0;
    expect(getMarketData().instruments[0].name).toBe("Simulated cash");
    expect(getMarketData().chartSeries[0].points[0].value).toBe(100);
    expect(getNewsData().items[0].headline).toContain("Synthetic scenario:");
    expect(getScenario(1).shock.costRupiah).toBe(150000);
    expect(await marketGET().json()).toEqual({ ok: true, data: getMarketData() });
    expect(await newsGET().json()).toEqual({ ok: true, data: getNewsData() });
  });
});

