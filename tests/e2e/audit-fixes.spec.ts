import { expect, test, type Page } from "@playwright/test";
import { installLiveFeatureWidgetStubs } from "./live-features-widget-stub";
import { installTradingViewStub } from "./tradingview-stub";
import { installLiveNewsStub, readLiveNewsProbe, setLiveNewsStubMode } from "./live-news-stub";

test.beforeEach(async ({ page }) => {
  await installLiveFeatureWidgetStubs(page);
  await installTradingViewStub(page);
  await installLiveNewsStub(page);
});

async function records(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("vamm-demo-v2", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onupgradeneeded = () => { request.transaction?.abort(); reject(new Error("Expected initialized storage.")); };
    });
    try {
      const names = ["metadata", "sessions", "turns", "requestOutcomes"];
      const tx = db.transaction(names, "readonly");
      const values = await Promise.all(names.map(name => new Promise<unknown[]>((resolve, reject) => {
        const request = tx.objectStore(name).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })));
      return Object.fromEntries(names.map((name, index) => [name, values[index]]));
    } finally { db.close(); }
  });
}

test("preserved history is discoverable after full reload and a fresh tab without changing any record", async ({ page, context }) => {
  await page.goto("/simulation");
  await page.getByRole("button", { name: "Start your simulation", exact: true }).click();
  await page.getByRole("button", { name: "Advance one year", exact: true }).click();
  await page.getByLabel("Cash · Rp", { exact: true }).fill("150000");
  await page.getByRole("button", { name: "Confirm funding decision", exact: true }).click();
  await expect(page.getByRole("button", { name: "Advance one year", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "New session", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Create new session", exact: true }).click();
  const summary = page.locator("summary").filter({ hasText: "View preserved session" });
  await expect(summary).toHaveCount(1);
  const before = await records(page);
  await page.reload();
  await expect(summary).toHaveCount(1);
  await summary.click();
  await expect(page.getByText("Previous session · retained on this device", { exact: true })).toBeVisible();
  await expect(page.getByRole("table").filter({ hasText: "Committed turn history" }).last()).toContainText("settled");
  expect(await records(page)).toEqual(before);
  const freshTab = await context.newPage();
  try {
    await freshTab.goto("/simulation");
    await expect(freshTab.locator("summary").filter({ hasText: "View preserved session" })).toHaveCount(1);
    await expect(freshTab.getByText("Age 15 · Turn 0 of 3", { exact: true })).toBeVisible();
    expect(await records(freshTab)).toEqual(before);
  } finally { await freshTab.close(); }
});

test("external chart navigation truthfully identifies its default symbol after provider symbol changes", async ({ page }) => {
  await page.goto("/market");
  await expect(page.locator("[data-tradingview-state]")).toHaveAttribute("data-tradingview-state", "ready");
  await page.locator("tv-advanced-chart").evaluate(element => element.setAttribute("symbol", "NASDAQ:MSFT"));
  const link = page.getByRole("link", { name: "Open default AAPL on TradingView", exact: false });
  await expect(link).toHaveAttribute("href", "https://www.tradingview.com/chart/?symbol=NASDAQ%3AAAPL");
  await expect(page.locator("tv-advanced-chart")).toHaveAttribute("symbol", "NASDAQ:MSFT");
});

test("keyboard retry retains focus through loading and ready without stealing focus after the user moves", async ({ page }) => {
  await page.goto("/news");
  const region = page.locator("[data-live-news-state]");
  const widget = page.locator("tv-news-feed");
  await expect(region).toHaveAttribute("data-live-news-state", "ready");
  await setLiveNewsStubMode(page, "silent");
  await widget.evaluate(element => element.dispatchEvent(new CustomEvent("tv-widget-error", { bubbles: true, composed: true })));
  const retry = region.getByRole("button", { name: /^(Retry|Reconnecting|Refresh) live feed/ });
  await retry.focus();
  await page.keyboard.press("Enter");
  await expect(region).toHaveAttribute("data-live-news-state", "loading");
  await expect(retry).toBeFocused();
  await expect(retry).toHaveAttribute("aria-disabled", "true");
  const connections = (await readLiveNewsProbe(page))?.connections;
  await page.keyboard.press("Enter");
  expect((await readLiveNewsProbe(page))?.connections).toBe(connections);
  await widget.evaluate(element => element.dispatchEvent(new CustomEvent("tv-widget-ready", { bubbles: true, composed: true })));
  await expect(region).toHaveAttribute("data-live-news-state", "ready");
  await expect(retry).toBeFocused();
  await widget.evaluate(element => element.dispatchEvent(new CustomEvent("tv-widget-error", { bubbles: true, composed: true })));
  await page.keyboard.press("Enter");
  await expect(region).toHaveAttribute("data-live-news-state", "loading");
  const hide = region.getByRole("button", { name: "Hide live feed", exact: true });
  await hide.focus();
  await widget.evaluate(element => element.dispatchEvent(new CustomEvent("tv-widget-ready", { bubbles: true, composed: true })));
  await expect(region).toHaveAttribute("data-live-news-state", "ready");
  await expect(hide).toBeFocused();
});

test("shared motion covers every route and pause/static/device controls stop motion without hiding content", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const route of ["dashboard", "market", "compare", "research", "simulation", "news"]) {
    await page.goto("/" + route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const scope = page.locator("[data-motion-scope]");
    await expect(scope).toHaveAttribute("data-motion-static", "false");
    await expect(page.locator("[data-site-motion]")).toHaveCount(1);
    const current = page.getByRole("navigation", { name: "Main navigation" }).locator('[aria-current="page"]');
    const duration = () => current.evaluate(element => getComputedStyle(element).transitionDuration.split(",").map(Number.parseFloat));
    expect((await duration()).some(value => value > 0)).toBe(true);
    await page.getByRole("button", { name: "Pause animations", exact: true }).click();
    await expect(scope).toHaveAttribute("data-motion-paused", "true");
    expect((await duration()).every(value => value === 0)).toBe(true);
    await expect.poll(() => page.locator("[data-site-motion]").evaluate(element => element.getAnimations({ subtree: true }).filter(animation => animation.playState === "running").length)).toBe(0);
    await page.getByRole("button", { name: "Resume animations", exact: true }).click();
    await page.getByRole("switch", { name: "Static motion", exact: true }).click();
    await expect(scope).toHaveAttribute("data-motion-static", "true");
    expect((await duration()).every(value => value === 0)).toBe(true);
    await page.getByRole("switch", { name: "Static motion", exact: true }).click();
    await current.focus();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(scope).toHaveAttribute("data-motion-os-reduced", "true");
    await expect(current).toBeFocused();
    expect((await duration()).every(value => value === 0)).toBe(true);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }
});
