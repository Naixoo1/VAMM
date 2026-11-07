import { describe, expect, it } from "vitest";
import { getEvidenceCatalog, getNewsData, getScenario } from "@/lib/data/fixtures";
import { getSourceNews, SOURCE_NEWS_REVIEWED_ON } from "@/lib/data/source-news";

describe("verified curated source reading", () => {
  it("records the exact verified publisher titles, direct URLs, and publication dates", () => {
    expect(getSourceNews().map(item => [item.publisher, item.title, item.url, item.publishedOn, item.kind])).toEqual([
      ["Apple", "Apple reports fourth quarter results", "https://www.apple.com/newsroom/2026/11/apple-reports-fourth-quarter-results/", "2026-11-02", "Press release"],
      ["Federal Reserve", "Federal Reserve issues FOMC statement", "https://www.federalreserve.gov/newsevents/pressreleases/monetary20261028a.htm", "2026-10-28", "Press release"],
      ["Vanguard", "When index funds mix but don’t match", "https://corporate.vanguard.com/content/corporatesite/us/en/corp/articles/when-index-funds-mix-dont-match.html", "2025-06-04", "Background reading"],
    ]);
    expect(SOURCE_NEWS_REVIEWED_ON).toBe("2026-11-07");
  });

  it("keeps recent announcements and older context clearly distinguishable across three domains", () => {
    const items = getSourceNews();
    expect(new Set(items.map(item => new URL(item.url).hostname)).size).toBe(3);
    expect(items.filter(item => item.kind === "Press release" && item.publishedOn >= "2026-10-01")).toHaveLength(2);
    for (const item of items) {
      expect(item.url.startsWith("https://")).toBe(true);
      expect(item.publishedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(item.publishedOn <= SOURCE_NEWS_REVIEWED_ON).toBe(true);
      expect(item.educationalContext.length).toBeGreaterThan(30);
      expect(item.readingQuestion.endsWith("?")).toBe(true);
      expect("sentiment" in item).toBe(false);
      expect("evidenceIds" in item).toBe(false);
    }
  });

  it("does not mutate or expand the frozen synthetic news, evidence, or scenarios", () => {
    const before = { news: getNewsData(), evidence: getEvidenceCatalog(), scenarios: [1, 2, 3].map(getScenario) };
    const links = getSourceNews();
    links[0].publisher = "Changed";
    links[1].publishedOn = "2099-01-01";
    expect(getSourceNews()[0].publisher).toBe("Apple");
    expect(getSourceNews()[1].publishedOn).toBe("2026-10-28");
    expect({ news: getNewsData(), evidence: getEvidenceCatalog(), scenarios: [1, 2, 3].map(getScenario) }).toEqual(before);
    expect(before.news.items.every(item => item.dataMode === "synthetic" && item.sourceUrl === null && item.sentimentOrigin === "prewritten")).toBe(true);
    expect(before.evidence).toHaveLength(4);
  });
});
