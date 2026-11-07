import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { installLiveFeatureWidgetStubs } from "./live-features-widget-stub.ts";
import { installTradingViewStub } from "./tradingview-stub.ts";
import { installLiveNewsStub } from "./live-news-stub.ts";

const live = process.argv.includes("--live");
const directory = "tests/e2e/evidence/logo-live";
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  if (!live) {
    for (const width of [320, 768, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await installLiveFeatureWidgetStubs(page);
      await installTradingViewStub(page);
      await installLiveNewsStub(page);
      for (const route of ["dashboard", "market", "compare", "research", "simulation", "news"]) {
        const pageErrors = [];
        const onError = error => pageErrors.push(error.message);
        page.on("pageerror", onError);
        await page.goto("http://127.0.0.1:3000/" + route);
        await page.getByRole("heading", { level: 1 }).waitFor();
        const logos = page.locator('img[src*="/branding/"]:visible');
        const inspectMenu = width < 761 && route !== "dashboard";
        if (inspectMenu) await page.getByRole("button", { name: "Open workspace menu", exact: true }).click();
        await expect.poll(() => logos.count()).toBeGreaterThan(0);
        for (const logo of await logos.all()) {
          await expect.poll(() => logo.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
        }
        const logoSizes = await logos.evaluateAll(images => images.map(image => ({
          width: image.clientWidth, height: image.clientHeight, alt: image.alt,
          loaded: image.complete && image.naturalWidth > 0,
        })));
        const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        results.push({ route, width, documentWidth, pageErrors, logoSizes });
        if (inspectMenu) await page.getByRole("dialog", { name: "Workspace menu" }).getByRole("button", { name: "Close workspace menu", exact: true }).click();
        if (["dashboard", "compare", "market"].includes(route)) {
          await page.screenshot({ path: directory + "/" + route + "-" + width + ".png", animations: "disabled" });
        }
        if (route === "compare" && width === 320) {
          await page.getByLabel("First company", { exact: true }).fill("ABCDEFGHIJKLMNOPQRST:ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMN");
          await page.getByRole("button", { name: "Compare listings", exact: true }).click();
          results.push({ route: "compare-long-symbol", width, documentWidth: await page.evaluate(() => document.documentElement.scrollWidth), pageErrors: [...pageErrors] });
        }
        page.off("pageerror", onError);
      }
      await page.close();
    }
  } else {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      for (const pair of [["NASDAQ:NVDA", "NYSE:KO"], ["IDX:BBCA", "IDX:BBRI"]]) {
        const pageErrors = [], failedRequests = [], scripts = [];
        const onError = error => pageErrors.push(error.message);
        const onFailed = request => failedRequests.push({ url: request.url().split("?")[0], error: request.failure()?.errorText });
        const onResponse = response => {
          if (response.url().startsWith("https://s3.tradingview.com/external-embedding/")) scripts.push({ url: response.url(), status: response.status() });
        };
        page.on("pageerror", onError); page.on("requestfailed", onFailed); page.on("response", onResponse);
        await page.goto("http://127.0.0.1:3000/compare");
        await page.getByLabel("First company", { exact: true }).fill(pair[0]);
        await page.getByLabel("Second company", { exact: true }).fill(pair[1]);
        await page.getByRole("button", { name: "Compare listings", exact: true }).click();
        const panel = page.locator('[data-live-market-kind="comparison"]');
        await panel.scrollIntoViewIfNeeded();
        await expect(panel).not.toHaveAttribute("data-live-market-state", "loading", { timeout: 30000 });
        await page.waitForTimeout(8000);
        const state = await panel.getAttribute("data-live-market-state");
        await page.screenshot({ path: directory + "/live-compare-" + pair[0].replace(":", "-") + "-" + width + ".png", animations: "disabled" });
        results.push({
          width, pair, state, scripts, pageErrors, failedRequests,
          documentWidth: await page.evaluate(() => document.documentElement.scrollWidth),
          note: "Panel opening is not proof of symbol data or freshness; screenshot reviewed separately.",
        });
        page.off("pageerror", onError); page.off("requestfailed", onFailed); page.off("response", onResponse);
      }
      await page.goto("http://127.0.0.1:3000/news");
      const news = page.locator("[data-live-news-state]");
      await news.scrollIntoViewIfNeeded();
      await expect(news).not.toHaveAttribute("data-live-news-state", "loading", { timeout: 30000 });
      await page.screenshot({ path: directory + "/live-news-" + width + ".png", animations: "disabled" });
      results.push({ route: "news", width, state: await news.getAttribute("data-live-news-state"), documentWidth: await page.evaluate(() => document.documentElement.scrollWidth) });
      await page.close();
    }
  }
} finally {
  await browser.close();
}
await writeFile(directory + (live ? "/provider-report.json" : "/responsive-report.json"), JSON.stringify(results, null, 2) + "\n");
console.log(JSON.stringify({ mode: live ? "live" : "responsive", checks: results.length, results }, null, 2));
if (results.some(row => row.documentWidth > row.width || row.pageErrors?.length)) process.exitCode = 1;
