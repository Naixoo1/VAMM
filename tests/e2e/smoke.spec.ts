import { installLiveNewsStub } from "./live-news-stub";
import { installTradingViewStub } from "./tradingview-stub";
import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

test("frozen market/news and labeled research fallback", async ({ request }) => {
  const marketResponse = await request.get("/api/market");
  expect(marketResponse.status()).toBe(200);
  const market = await marketResponse.json();
  expect(market.ok).toBe(true);
  expect(market.data.contractVersion).toBe(2);
  expect(market.data.instruments.map((item: { id: string }) => item.id)).toEqual(["edu-cash", "edu-bonds", "edu-equity"]);
  expect(market.data.chartSeries[1].points.at(-1).value).toBe(112.476);
  const news = await (await request.get("/api/news")).json();
  expect(news.ok).toBe(true);
  expect(news.data.items.map((item: { sentiment: string }) => item.sentiment)).toEqual(["negative", "positive", "mixed"]);
  const research = await (await request.post("/api/research", { data: { instrumentIds: ["edu-bonds", "edu-equity"], question: "Explain why these synthetic results are not a forecast." } })).json();
  expect(research.ok).toBe(true);
  expect(research.data.origin).toBe("prewritten");
  expect(research.data.limitations.length).toBeGreaterThan(0);
  const invalid = await request.post("/api/research", { data: { instrumentIds: ["ticker"], question: "Explain", returns: 100 } });
  expect(invalid.status()).toBe(400);
});

test("six routes render without page errors or horizontal overflow", async ({ page }, testInfo) => {
  await installTradingViewStub(page);
  await installLiveNewsStub(page);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const evidenceDirectory = resolve("tests/e2e/evidence");
  await mkdir(evidenceDirectory, { recursive: true });
  await page.goto("/");
  await expect(page).toHaveURL(/\/dashboard$/);
  for (const route of ["dashboard", "market", "research", "compare", "simulation", "news"]) {
    const response = await page.goto("/" + route);
    expect(response?.ok()).toBe(true);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
    if (route === "dashboard") await expect(page.getByText("Simulated cash", { exact: true })).toBeVisible();
    if (route === "research") await expect(page.getByRole("checkbox", { name: "Simulated bond basket" })).toBeVisible();
    if (route === "compare") await expect(page.getByRole("cell").filter({ hasText: /^Unavailable/ })).toHaveCount(2);
    if (route === "simulation") await expect(page.getByRole("button", { name: "Start your simulation" })).toBeVisible();
    if (route === "news") await expect(page.getByRole("heading", { name: "Live market news", exact: true })).toBeVisible();
    await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); window.scrollTo(0,0); });
    await page.screenshot({ path: resolve(evidenceDirectory, route + "-" + testInfo.project.name + ".png"), fullPage: true, animations: "disabled" });
  }
  expect(errors).toEqual([]);
});
