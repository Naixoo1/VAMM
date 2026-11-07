import { installLiveFeatureWidgetStubs } from "./live-features-widget-stub";
import { installLiveNewsStub } from "./live-news-stub";
import { installTradingViewStub } from "./tradingview-stub";
import { test, expect, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => { await installLiveFeatureWidgetStubs(page); await installTradingViewStub(page); await installLiveNewsStub(page); });

async function savedState(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("vamm-demo-v2", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      const transaction = db.transaction(["sessions", "turns"], "readonly");
      const sessions = new Promise<{ session: { id: string; version: number; phase: string; balances: { cash: number; bonds: number; equity: number } } }[]>(resolve => {
        const request = transaction.objectStore("sessions").getAll();
        request.onsuccess = () => resolve(request.result);
      });
      const turns = new Promise<number>(resolve => {
        const request = transaction.objectStore("turns").count();
        request.onsuccess = () => resolve(request.result);
      });
      const [records, count] = await Promise.all([sessions, turns]);
      return { sessions: records.map(record => record.session), turns: count };
    } finally { db.close(); }
  });
}
const noOverflow = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);

test("three annual turns, explicit funding, reset and retained browser history", async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto("/simulation");
  await page.getByRole("button", { name: "Start your simulation" }).click();
  for (const [index, bill] of [150000, 200000, 300000].entries()) {
    const advance = page.getByRole("button", { name: "Advance one year" });
    await expect(advance).toBeEnabled();
    await advance.click();
    const confirm = page.getByRole("button", { name: "Confirm funding decision" });
    await expect(confirm).toBeDisabled();
    const cash = page.getByLabel("Cash · Rp", { exact: true });
    await cash.fill(String(bill + 1));
    await expect(confirm).toBeDisabled();
    await cash.fill(String(bill));
    await expect(confirm).toBeEnabled();
    await noOverflow(page);
    if (index === 0) await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); window.scrollTo(0,0); });
    if (index === 0) await page.screenshot({ path: "tests/e2e/evidence/funding-" + testInfo.project.name + ".png", fullPage: true, animations: "disabled" });
    await confirm.click();
    if (index === 0) {
      await expect.poll(async () => (await savedState(page)).sessions[0].version).toBe(2);
      const state = await savedState(page);
      expect(state.sessions[0].balances.cash).toBe(630000);
    }
  }
  await expect(page.getByText("Three years complete", { exact: true })).toBeVisible();
  await noOverflow(page);
  const completed = await savedState(page);
  expect(completed.turns).toBe(3);
  expect(completed.sessions).toHaveLength(1);
  expect(completed.sessions[0]).toMatchObject({ version: 6, phase: "complete" });
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); window.scrollTo(0,0); });
  await page.screenshot({ path: "tests/e2e/evidence/completed-" + testInfo.project.name + ".png", fullPage: true, animations: "disabled" });
  await page.getByRole("button", { name: "New session", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Make room for a fresh start?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Create new session" }).click();
  await expect(page.getByText("Age 15 · Turn 0 of 3", { exact: true })).toBeVisible();
  await page.getByText("View preserved session 1 · 3 recorded turns", { exact: true }).click();
  await expect(page.getByText("Previous session · retained on this device", { exact: true })).toBeVisible();
  const reset = await savedState(page);
  expect(reset.sessions).toHaveLength(2);
  expect(reset.turns).toBe(3);
  expect(reset.sessions.find(session => session.version === 0)?.balances).toEqual({ cash: 0, bonds: 0, equity: 0 });
  await page.reload();
  await expect(page.getByText("Age 15 · Turn 0 of 3", { exact: true })).toBeVisible();
  expect((await savedState(page)).turns).toBe(3);
  expect(pageErrors).toEqual([]);
});

test("keyboard focus, live comparison and honest unavailable Mentor", async ({ page }) => {
  await page.goto("/compare");
  const skip = page.getByRole("link", { name: "Skip to main content" });
  await page.keyboard.press("Tab"); await expect(skip).toBeFocused();
  expect(await skip.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe("none");
  await page.keyboard.press("Enter"); await expect(page.getByRole("main")).toBeFocused();
  await expect(page.getByLabel("First company", { exact: true })).toBeVisible();
  await page.goto("/research");
  await expect(page.getByLabel("Message your mentor", { exact: true })).toBeVisible();
  await expect(page.getByText(/not configured/i).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Send message", exact: true })).toBeDisabled();
  await expect(page.getByText("Prewritten fallback", { exact: true })).toHaveCount(0);
});

test("Mentor history failures remain visible without fixture requests or synthetic news", async ({ page }) => {
  let fixtureRequests = 0;
  page.on("request", request => { if (["/api/market", "/api/news", "/api/research"].includes(new URL(request.url()).pathname)) fixtureRequests++; });
  await page.addInitScript(() => Object.defineProperty(window, "indexedDB", { value: undefined }));
  await page.goto("/research");
  await expect(page.getByRole("alert").filter({ hasText: /storage|history/i }).first()).toBeVisible();
  await page.goto("/news");
  await expect(page.getByRole("region", { name: "Live market news", exact: true })).toHaveAttribute("data-live-news-state", "ready");
  expect(fixtureRequests).toBe(0);
});

test("unavailable browser storage never silently creates a session", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, "indexedDB", { value: undefined }));
  await page.goto("/simulation");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Local storage is unavailable");
  await expect(page.getByRole("button", { name: "Start your simulation" })).toBeDisabled();
});

test("two browser tabs cannot both advance the same session version", async ({ page, context }) => {
  await page.goto("/simulation");
  await page.getByRole("button", { name: "Start your simulation" }).click();
  await expect(page.getByRole("button", { name: "Advance one year" })).toBeEnabled();
  const second = await context.newPage();
  await second.goto("/simulation");
  await expect(second.getByRole("button", { name: "Advance one year" })).toBeEnabled();
  await Promise.all([
    page.getByRole("button", { name: "Advance one year" }).click(),
    second.getByRole("button", { name: "Advance one year" }).click(),
  ]);
  await expect.poll(async () => {
    const counts = await Promise.all([page, second].map(tab => tab.getByRole("main").getByRole("alert").count()));
    return counts[0] + counts[1];
  }).toBe(1);
  const state = await savedState(page);
  expect(state.turns).toBe(1);
  expect(state.sessions).toHaveLength(1);
  expect(state.sessions[0]).toMatchObject({ version: 1, phase: "awaiting_shock_decision", balances: { cash: 780000, bonds: 811200, equity: 1123200 } });
  const conflicting = await page.getByRole("main").getByRole("alert").count() ? page : second;
  await expect(conflicting.getByRole("main").getByRole("alert")).toContainText("changed");
  await conflicting.getByRole("button", { name: "Reload current state" }).click();
  await expect(conflicting.getByRole("button", { name: "Confirm funding decision" })).toBeVisible();
  expect((await savedState(page)).turns).toBe(1);
  await second.close();
});
