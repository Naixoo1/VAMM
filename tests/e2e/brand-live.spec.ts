import { createHash } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { installLiveFeatureWidgetStubs, readLiveFeatureProbe } from "./live-features-widget-stub";
import { installTradingViewStub } from "./tradingview-stub";
import { installLiveNewsStub, LIVE_NEWS_TEST_MODULE_URL } from "./live-news-stub";

const logoPath = "/branding/vamm-ai-teknologi-original.png";
const logoHash = "e2b682bd9ec2634926aaf5e8c4505fc066494d9ff6c31d14316e285a3e6010c5";
const retired = ["Synthetic learning baskets", "Synthetic basket comparison", "Synthetic practice", "Original Chart for Learning"];
function navigation(page: Page, name: string) { return page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("link", { name, exact: true }); }
function panel(page: Page, kind: string) { return page.locator(`section[data-live-market-kind="${kind}"]`); }
async function noRetiredPanels(page: Page) {
  for (const title of retired) {
    await expect(page.locator("summary").filter({ hasText: title })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: title, exact: true })).toHaveCount(0);
  }
  await expect(page.getByText("Synthetic scenario: bond basket records a modest gain", { exact: true })).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
}
async function records(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const opening = indexedDB.open("vamm-demo-v2", 1);
      opening.onsuccess = () => resolve(opening.result); opening.onerror = () => reject(opening.error);
      opening.onupgradeneeded = () => { opening.transaction?.abort(); reject(new Error("Expected initialized VAMM storage.")); };
    });
    try {
      const names = ["metadata", "sessions", "turns", "requestOutcomes"];
      const tx = db.transaction(names, "readonly");
      const rows = await Promise.all(names.map(name => new Promise<unknown[]>((resolve, reject) => {
        const reading = tx.objectStore(name).getAll();
        reading.onsuccess = () => resolve(reading.result); reading.onerror = () => reject(reading.error);
      })));
      return Object.fromEntries(names.map((name, index) => [name, rows[index]]));
    } finally { db.close(); }
  });
}
async function start(page: Page) {
  await page.goto("/simulation");
  await page.getByRole("button", { name: "Start your simulation", exact: true }).click();
  await expect(page.getByRole("button", { name: "Advance one year", exact: true })).toBeEnabled();
}
async function latestComparison(page: Page) {
  return (await readLiveFeatureProbe(page))?.configurations.filter(item => item.kind === "comparison").at(-1)?.configuration;
}
async function comparisonCount(page: Page) {
  return (await readLiveFeatureProbe(page))?.configurations.filter(item => item.kind === "comparison").length ?? 0;
}

test.beforeEach(async ({ page }) => {
  await installLiveFeatureWidgetStubs(page);
  await installTradingViewStub(page);
  await installLiveNewsStub(page);
});

test("original supplied logo decodes at both placements and primary live routes avoid retired fixture requests", async ({ page, request }) => {
  const asset = await request.get(logoPath);
  expect(asset.status()).toBe(200);
  expect(asset.headers()["content-type"]).toContain("image/png");
  expect(createHash("sha256").update(await asset.body()).digest("hex")).toBe(logoHash);
  const fixtureRequests: string[] = [];
  page.on("request", request => { const path = new URL(request.url()).pathname; if (["/api/market", "/api/news"].includes(path)) fixtureRequests.push(path); });
  await page.goto("/dashboard");
  const hero = page.locator('[data-brand-logo="hero"]');
  await expect(page.getByRole("img", { name: "VAMM AI Teknologi logo", exact: true })).toBeVisible();
  expect(await hero.locator("img").evaluate(async element => {
    const image = element as HTMLImageElement; await image.decode();
    return { complete: image.complete, width: image.naturalWidth, height: image.naturalHeight };
  })).toEqual({ complete: true, width: 1600, height: 1600 });
  const bounds = await hero.boundingBox();
  expect(bounds).not.toBeNull(); expect(bounds!.width).toBeGreaterThan(120);
  expect(bounds!.x).toBeGreaterThanOrEqual(0); expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  if (page.viewportSize()!.width <= 760) await page.getByRole("button", { name: "Open workspace menu", exact: true }).click();
  const sidebar = page.locator('[data-brand-logo="sidebar"] img');
  await expect(sidebar).toBeVisible();
  await expect(sidebar).toHaveAttribute("alt", "");
  await expect(sidebar).toHaveAttribute("src", logoPath);
  expect(await sidebar.evaluate(async element => { const image = element as HTMLImageElement; await image.decode(); return image.complete && image.naturalWidth === 1600; })).toBe(true);
  if (page.viewportSize()!.width <= 760) await page.keyboard.press("Escape");
  for (const name of ["Home", "Market", "Compare", "News & Sentiment Lab"]) {
    await navigation(page, name).click();
    await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
    await noRetiredPanels(page);
  }
  expect(fixtureRequests).toEqual([]);
  await navigation(page, "AI Investment Mentor").click();
  await expect(page.getByLabel("Message your mentor", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Upload screenshot", { exact: true })).toHaveCount(1);
});

test("exchange-qualified comparison accepts broad listings and Mentor stays isolated without changing committed simulation records", async ({ page }) => {
  test.setTimeout(60000);
  await start(page);
  await page.getByRole("button", { name: "Advance one year", exact: true }).click();
  await page.getByLabel("Cash · Rp", { exact: true }).fill("150000");
  await page.getByRole("button", { name: "Confirm funding decision", exact: true }).click();
  await expect.poll(async () => ((await records(page)).sessions[0] as { session: { version: number } }).session.version).toBe(2);
  const committed = await records(page);
  expect(committed.sessions[0]).toMatchObject({ session: { balances: { cash: 630000, bonds: 811200, equity: 1123200 }, version: 2 } });
  await navigation(page, "Compare").click();
  await expect(panel(page, "comparison")).toHaveAttribute("data-live-market-state", "panel");
  const first = page.getByLabel("First company", { exact: true });
  const second = page.getByLabel("Second company", { exact: true });
  const beforeDraft = await comparisonCount(page);
  const pairs = [[" idx:bbca ", "hkex:0700", "IDX:BBCA", "HKEX:0700"], ["NYSE:BRK.B", "NYSE:IBM", "NYSE:BRK.B", "NYSE:IBM"], ["NASDAQ:NVDA", "NASDAQ:TSLA", "NASDAQ:NVDA", "NASDAQ:TSLA"]];
  for (const [left, right, normalizedLeft, normalizedRight] of pairs) {
    const count = await comparisonCount(page);
    await first.fill(left); await second.fill(right);
    expect(await comparisonCount(page)).toBe(count);
    await page.getByRole("button", { name: "Compare listings", exact: true }).click();
    await expect.poll(async () => ((await latestComparison(page))?.symbols as string[][] | undefined)?.[0]?.[1]).toBe(normalizedLeft + "|1D");
    const configuration = await latestComparison(page);
    expect(configuration?.compareSymbol).toMatchObject({ symbol: normalizedRight });
    expect(configuration?.scaleMode).toBe("Percentage");
    await expect(panel(page, "comparison")).toHaveAttribute("data-live-market-state", "panel");
    expect(await records(page)).toEqual(committed);
  }
  expect(await comparisonCount(page)).toBe(beforeDraft + pairs.length);
  const validCount = await comparisonCount(page);
  await first.fill(" nasdaq:aapl "); await second.fill("NASDAQ:AAPL");
  await page.getByRole("button", { name: "Compare listings", exact: true }).click();
  await expect(page.getByRole("region", { name: "Compare company listings", exact: true }).getByRole("alert")).toContainText("two different exchange-qualified listings");
  expect(await comparisonCount(page)).toBe(validCount);
  await first.fill("NASDAQ:AAPL|1D"); await second.fill("NYSE:IBM");
  await page.getByRole("button", { name: "Compare listings", exact: true }).click();
  await expect(page.getByRole("region", { name: "Compare company listings", exact: true }).getByRole("alert")).toContainText(/exchange|listing|symbol/i);
  expect(await comparisonCount(page)).toBe(validCount);
  await expect(panel(page, "comparison")).toHaveAttribute("data-live-market-state", "panel");
  await navigation(page, "AI Investment Mentor").click();
  await expect(page.getByLabel("Message your mentor", { exact: true })).toBeVisible();
  await expect(page.locator("[data-live-market-kind]")).toHaveCount(0);
  await noRetiredPanels(page);
  expect(await records(page)).toEqual(committed);
});

test("blocked live providers stay failed without synthetic substitution, fixture traffic or financial mutations", async ({ page, request }) => {
  await installLiveFeatureWidgetStubs(page, { blocked: ["summary", "comparison", "profile", "fundamentals", "technical"] });
  await page.route("https://widgets.tradingview-widget.com/w/en/tv-advanced-chart.js", route => route.abort("blockedbyclient"));
  await page.route(LIVE_NEWS_TEST_MODULE_URL, route => route.abort("blockedbyclient"));
  const marketBefore = await (await request.get("/api/market")).json();
  const newsBefore = await (await request.get("/api/news")).json();
  const fixtureRequests: string[] = [];
  page.on("request", request => { const path = new URL(request.url()).pathname; if (["/api/market", "/api/news", "/api/research"].includes(path)) fixtureRequests.push(path); });
  await start(page);
  const saved = await records(page);
  await navigation(page, "Home").click();
  await expect(panel(page, "summary")).toHaveAttribute("data-live-market-state", "error");
  await expect(panel(page, "summary").getByRole("alert")).toContainText("couldn’t load");
  await noRetiredPanels(page);
  await navigation(page, "Market").click();
  await expect(page.getByRole("region", { name: "TradingView market chart", exact: true }).getByRole("alert")).toContainText("couldn’t load");
  await noRetiredPanels(page);
  await navigation(page, "Compare").click();
  await expect(panel(page, "comparison")).toHaveAttribute("data-live-market-state", "error");
  await noRetiredPanels(page);
  await navigation(page, "News & Sentiment Lab").click();
  await expect(page.locator("section[data-live-news-state]")).toHaveAttribute("data-live-news-state", "error");
  await noRetiredPanels(page);
  expect(fixtureRequests).toEqual([]);
  expect(await records(page)).toEqual(saved);
  expect(await (await request.get("/api/market")).json()).toEqual(marketBefore);
  expect(await (await request.get("/api/news")).json()).toEqual(newsBefore);
});
