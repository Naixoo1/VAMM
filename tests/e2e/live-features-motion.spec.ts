import { CHAT_REPLY } from "./mentor-chat-fixture";
import {writeFile} from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { captureProductionMotion, installLiveFeatureWidgetStubs, readLiveFeatureProbe, readProductionMotion } from "./live-features-widget-stub";

function nav(page: Page, name: string) { return page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name, exact: true }); }
function live(page: Page, kind: string) { return page.locator(`section[data-live-market-kind="${kind}"]`); }
async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const opening = indexedDB.open("vamm-demo-v2", 1);
      opening.onsuccess = () => resolve(opening.result);
      opening.onerror = () => reject(opening.error);
      opening.onupgradeneeded = () => { opening.transaction?.abort(); reject(new Error("Expected existing simulation storage.")); };
    });
    try {
      const names = ["metadata", "sessions", "turns", "requestOutcomes"];
      const transaction = db.transaction(names, "readonly");
      const rows = await Promise.all(names.map(name => new Promise<unknown[]>((resolve, reject) => {
        const reading = transaction.objectStore(name).getAll();
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
async function version(page: Page) {
  return ((await snapshot(page)).sessions[0] as { session: { version: number } }).session.version;
}
async function artworkBudget(page: Page) {
  const primitives = await page.locator("[data-motion-artwork]").evaluateAll(elements => elements.map(element =>
    element.querySelectorAll("circle,path,rect,line,polyline,polygon,ellipse").length));
  expect(primitives.length).toBeGreaterThan(0);
  expect(primitives.length).toBeLessThanOrEqual(32);
  expect(Math.max(...primitives)).toBeLessThanOrEqual(36);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  return { route: new URL(page.url()).pathname, artworks: primitives.length, maximumPrimitives: Math.max(...primitives) };
}

test("all24 production treatments are reached through real states while live displays preserve the frozen three-turn journey", async ({ page, context, request }, testInfo) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await captureProductionMotion(page);
  await installLiveFeatureWidgetStubs(page, { silent: ["news"] });
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  const budgets: Awaited<ReturnType<typeof artworkBudget>>[] = [];
  const marketBefore = await (await request.get("/api/market")).json();
  const newsBefore = await (await request.get("/api/news")).json();
  await start(page);
  const before = await snapshot(page);
  await expect(page.locator('[data-motion-preset="preview-signal"]')).toHaveAttribute("data-motion-state", "ready");

  await nav(page, "Home").click();
  await expect(live(page, "summary")).toHaveAttribute("data-live-market-state", "ready");
  const summary = page.getByTestId("live-summary-host").locator("tv-market-summary");
  expect(JSON.parse((await summary.getAttribute("symbol-sectors"))!)).toEqual([
    { sectionName: "US companies", symbols: ["NASDAQ:AAPL", "NASDAQ:MSFT", "NASDAQ:GOOGL"] },
  ]);
  await expect(page.locator("summary").filter({hasText:"Synthetic learning baskets"})).toHaveCount(0);
  budgets.push(await artworkBudget(page));

  await nav(page, "Compare").click();
  await expect(live(page, "comparison")).toHaveAttribute("data-live-market-state", "panel");
  await expect(live(page, "comparison").getByRole("status")).toContainText("Provider panel opened");
  await expect(live(page, "comparison").getByRole("status")).not.toContainText("ready");
  await page.getByLabel("First company", { exact: true }).fill("NASDAQ:GOOGL");
  await page.getByRole("button", { name: "Compare listings", exact: true }).click();
  await expect(live(page, "comparison")).toHaveAttribute("data-live-market-state", "panel");
  const comparisonProbe = await readLiveFeatureProbe(page);
  const comparison = comparisonProbe!.configurations.filter(item => item.kind === "comparison").at(-1)!.configuration;
  expect(comparison.symbols).toEqual([[expect.any(String), "NASDAQ:GOOGL|1D"]]);
  expect(comparison.compareSymbol).toMatchObject({ symbol: "NASDAQ:MSFT" });
  expect(comparison.scaleMode).toBe("Percentage");
  await expect(page.locator("summary").filter({hasText:"Synthetic basket comparison"})).toHaveCount(0);
  await page.getByLabel("First company", { exact: true }).fill("NASDAQ:AAPL|1D");
  await page.getByRole("button", { name: "Compare listings", exact: true }).click();
  await page.locator('[data-motion-preset="empty-line"]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-motion-preset="empty-line"]')).toBeVisible();
  budgets.push(await artworkBudget(page));

  let releaseStatus!: () => void;
  const statusGate = new Promise<void>(resolve => { releaseStatus = resolve; });
  let releaseReply!: () => void;
  const replyGate = new Promise<void>(resolve => { releaseReply = resolve; });
  let mentorPosts = 0;
  await page.route("**/api/mentor-chat", async route => {
    if (route.request().method() === "GET") { await statusGate; return route.fulfill({ json: { configured: true } }); }
    mentorPosts++; await replyGate;
    return route.fulfill(mentorPosts === 1 ? { status: 503, json: { ok: false, error: { code: "MODEL_UNAVAILABLE", message: "Explicit unavailable fixture." } } } : { json: { ok: true, data: { content: CHAT_REPLY, origin: "model" } } });
  });
  await nav(page, "AI Investment Mentor").click();
  await expect(page.locator('[data-motion-preset="query-inline"]').first()).toBeVisible();
  releaseStatus();
  await page.getByLabel("Message your mentor", { exact: true }).fill("Explain uncertainty.");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator('[data-motion-preset="mentor-orbit"]')).toBeVisible();
  releaseReply();
  await expect(page.locator('[data-motion-preset="research-fallback"]')).toBeVisible();
  await page.getByRole("button", { name: "Retry reply", exact: true }).click();
  await expect(page.getByText(CHAT_REPLY, { exact: true })).toBeVisible();
  await expect(page.locator('[data-motion-preset="evidence-arrival"]')).toBeVisible();
  expect(mentorPosts).toBe(2);
  budgets.push(await artworkBudget(page));

  await nav(page, "News & Sentiment Lab").click();
  const news = page.locator("section[data-live-news-state]");
  await expect(news).toHaveAttribute("data-live-news-state", "loading");
  await expect(page.locator('[data-motion-preset="news-skeleton"]')).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator('[data-motion-preset="news-static"]')).toBeVisible();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByTestId("live-news-host").locator("tv-news-feed").evaluate(element =>
    element.dispatchEvent(new CustomEvent("tv-widget-ready", { bubbles: true, composed: true })));
  await expect(news).toHaveAttribute("data-live-news-state", "ready");
  await news.getByRole("button", { name: "Hide live feed", exact: true }).click();
  await expect(news).toHaveAttribute("data-live-news-state", "paused");
  await expect(page.locator('[data-motion-preset="feed-paused"]')).toBeVisible();
  budgets.push(await artworkBudget(page));
  expect(await snapshot(page)).toEqual(before);
  expect(await (await request.get("/api/market")).json()).toEqual(marketBefore);
  expect(await (await request.get("/api/news")).json()).toEqual(newsBefore);

  await nav(page, "Simulation").click();
  await expect(page.getByRole("button", { name: "Advance one year", exact: true })).toBeEnabled();
  const second = await context.newPage();
  await captureProductionMotion(second);
  await second.goto("/simulation");
  await expect(second.getByRole("button", { name: "Advance one year", exact: true })).toBeEnabled();
  await Promise.all([page, second].map(tab => tab.getByRole("button", { name: "Advance one year", exact: true }).click()));
  await expect.poll(async () => {
    const counts = await Promise.all([page, second].map(tab => tab.getByRole("main").getByRole("alert").count()));
    return counts[0] + counts[1];
  }).toBe(1);
  const secondCoverage = await readProductionMotion(second);
  if (await page.getByRole("main").getByRole("alert").count()) await page.getByRole("button", { name: "Reload current state", exact: true }).click();
  await expect(page.getByRole("button", { name: "Confirm funding decision", exact: true })).toBeVisible();
  for (const [index, bill] of [150000, 200000, 300000].entries()) {
    if (index > 0) {
      await expect(page.getByRole("button", { name: "Advance one year", exact: true })).toBeEnabled();
      await page.getByRole("button", { name: "Advance one year", exact: true }).click();
    }
    await page.getByLabel("Cash · Rp", { exact: true }).fill(String(bill));
    await page.getByRole("button", { name: "Confirm funding decision", exact: true }).click();
    await expect.poll(() => version(page)).toBe((index + 1) * 2);
    if (index === 0) expect((await snapshot(page)).sessions[0]).toMatchObject({ session: { balances: { cash: 630000, bonds: 811200, equity: 1123200 } } });
  }
  await expect(page.getByText("Three years complete", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "New session", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Create new session", exact: true }).click();
  await expect(page.locator('[data-motion-preset="reset-confirmed"]')).toBeVisible();
  const reset = await snapshot(page);
  expect(reset.sessions).toHaveLength(2); expect(reset.turns).toHaveLength(3);
  budgets.push(await artworkBudget(page));
  await second.close();

  const unavailable = await context.newPage();
  await captureProductionMotion(unavailable);
  await unavailable.addInitScript(() => Object.defineProperty(window, "indexedDB", { value: undefined }));
  await unavailable.goto("/simulation");
  await expect(unavailable.getByRole("main").getByRole("alert")).toContainText("Local storage is unavailable");
  await expect(unavailable.locator('[data-motion-preset="storage-error"]')).toBeVisible();
  const unavailableCoverage = await readProductionMotion(unavailable);
  await unavailable.close();
  const observed = [...await readProductionMotion(page), ...secondCoverage, ...unavailableCoverage];
  const numbers = [...new Set(observed.map(item => item.number))].sort((a, b) => a - b);
  expect(numbers).toEqual(Array.from({ length: 24 }, (_, index) => index + 1));
  await writeFile("tests/e2e/evidence/production-motion-coverage-"+testInfo.project.name+".json",JSON.stringify({numbers,observed,budgets,scope:"Production UI with explicit provider/research fixtures; no FPS/live-data claim"},null,2)+"\n");
  await testInfo.attach("actual-state-motion-coverage", { body: JSON.stringify({ observed, budgets, scope: "Actual production states with explicit provider/research fixtures; no FPS or live-content claim" }, null, 2), contentType: "application/json" });
  expect(errors).toEqual([]);
});

test("runtime reduced motion preserves input focus, immediate committed money and invalid-preview safety without removed controls", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await installLiveFeatureWidgetStubs(page);
  await start(page);
  const before = await snapshot(page);
  await expect(page.getByRole("button", { name: /^(Pause|Resume) animations$/ })).toHaveCount(0);
  await expect(page.getByRole("switch", { name: "Static motion", exact: true })).toHaveCount(0);
  const cash = page.locator("#allocation-cash");
  await cash.focus();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(cash).toBeFocused();
  await expect(page.locator("[data-motion-scope]")).toHaveAttribute("data-motion-os-reduced", "true");
  await expect(page.locator("[data-motion-scope]")).toHaveAttribute("data-motion-static", "true");
  await expect(page.locator('[data-motion-running="true"]')).toHaveCount(0);
  expect(await page.locator("[data-motion-artwork]").evaluateAll(elements =>
    elements.flatMap(element => element.getAnimations({ subtree: true })).filter(animation => animation.playState === "running").length)).toBe(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await cash.fill("40");
  await expect(page.getByRole("button", { name: "Advance one year", exact: true })).toBeDisabled();
  await expect(page.locator('[data-motion-preset="preview-signal"]')).toHaveAttribute("data-motion-state", "idle");
  await cash.fill("30");
  await expect(page.getByRole("button", { name: "Advance one year", exact: true })).toBeEnabled();
  expect(await snapshot(page)).toEqual(before);
  await page.getByRole("button", { name: "Advance one year", exact: true }).click();
  await expect.poll(() => version(page)).toBe(1);
  const amount = page.locator('[data-motion-preset="turn-confirmed"]').locator("p").filter({ hasText: /2[.\s]714[.\s]400/ }).first();
  await expect(amount).toBeVisible();
  expect(await amount.evaluate(element => {
    for (let node: Element | null = element; node; node = node.parentElement) if (Number(getComputedStyle(node).opacity) < 1) return false;
    return true;
  })).toBe(true);
  const committed = await snapshot(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("[data-motion-scope]")).toHaveAttribute("data-motion-static", "true");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("[data-motion-scope]")).toHaveAttribute("data-motion-static", "false");
  expect(await snapshot(page)).toEqual(committed);
  await page.getByLabel("Cash · Rp", { exact: true }).fill("150000");
  await page.getByRole("button", { name: "Confirm funding decision", exact: true }).click();
  await expect.poll(() => version(page)).toBe(2);
  await artworkBudget(page);
});

test("blocked live panels remain visible failures and never replace or mutate the frozen simulation", async ({ page, request }) => {
  await installLiveFeatureWidgetStubs(page, { blocked: ["chart", "news", "summary", "comparison", "profile", "fundamentals", "technical"] });
  await start(page);
  const before = await snapshot(page);
  const marketBefore = await (await request.get("/api/market")).json();
  await nav(page, "Home").click();
  await expect(live(page, "summary")).toHaveAttribute("data-live-market-state", "error");
  await expect(live(page, "summary").getByRole("alert")).toContainText("couldn’t load");
  await nav(page, "Compare").click();
  await expect(live(page, "comparison")).toHaveAttribute("data-live-market-state", "error");
  await nav(page, "AI Investment Mentor").click();
  await expect(page.locator("[data-live-market-kind]")).toHaveCount(0);
  await expect(page.getByLabel("Message your mentor", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send message", exact: true })).toBeDisabled();
  expect(await snapshot(page)).toEqual(before);
  expect(await (await request.get("/api/market")).json()).toEqual(marketBefore);
  await nav(page, "Simulation").click();
  await page.getByRole("button", { name: "Advance one year", exact: true }).click();
  await page.getByLabel("Cash · Rp", { exact: true }).fill("150000");
  await page.getByRole("button", { name: "Confirm funding decision", exact: true }).click();
  await expect.poll(() => version(page)).toBe(2);
  expect((await snapshot(page)).sessions[0]).toMatchObject({ session: { balances: { cash: 630000, bonds: 811200, equity: 1123200 } } });
  await artworkBudget(page);
});

test("custom-element registration and legacy bootstrap load do not masquerade as provider data readiness", async ({ page }) => {
  await page.clock.install();
  await installLiveFeatureWidgetStubs(page, { silent: ["summary", "comparison"] });
  await page.goto("/dashboard");
  await expect(page.getByTestId("live-summary-host").locator("tv-market-summary")).toBeAttached();
  expect(await page.evaluate(() => Boolean(customElements.get("tv-market-summary")))).toBe(true);
  await expect(live(page, "summary")).toHaveAttribute("data-live-market-state", "loading");
  await nav(page, "Compare").click();
  await expect(page.locator('script[data-vamm-live-widget-embed="comparison"]')).toHaveCount(1);
  await expect(page.getByTestId("live-comparison-host").locator("iframe")).toHaveCount(0);
  await expect(live(page, "comparison")).toHaveAttribute("data-live-market-state", "loading");
  const comparisonHost = page.getByTestId("live-comparison-host");
  await comparisonHost.scrollIntoViewIfNeeded();
  await expect(comparisonHost).toBeInViewport();
  await page.clock.runFor(100);
  await page.clock.fastForward(21000);
  await expect(live(page, "comparison")).toHaveAttribute("data-live-market-state", "error");
  await artworkBudget(page);
});
