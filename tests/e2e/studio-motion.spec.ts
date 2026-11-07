import { expect, test, type Locator, type Page } from "@playwright/test";
import { installLiveFeatureWidgetStubs } from "./live-features-widget-stub";
import { installTradingViewStub } from "./tradingview-stub";

const artwork = (page: Page) => page.locator("[data-studio-artwork]");
const nav = (page: Page, name: string) => page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("link", { name, exact: true });
const calls = new WeakMap<Page, string[]>();
async function animations(element: Locator) {
  return element.evaluate(root => root.getAnimations({ subtree: true }).filter(animation => {
    const target = (animation.effect as KeyframeEffect | null)?.target;
    return target instanceof Element && target.closest("[data-studio-part]");
  }).map(animation => ({ state: animation.playState, time: Number(animation.currentTime), pending: animation.pending })));
}
async function motionState(page: Page, state: "running" | "paused") {
  await expect(artwork(page)).toHaveAttribute("data-studio-running", String(state === "running"));
  await expect.poll(async () => {
    const measured = await animations(artwork(page));
    return measured.length === 8 && measured.every(animation => animation.state === state && !animation.pending);
  }).toBe(true);
}
async function ringSample(page: Page) {
  return artwork(page).locator('[data-studio-part="ring"]').first().evaluate(async element => {
    const animation = element.getAnimations()[0];
    if (!animation) throw new Error("Expected a real studio ring animation.");
    await animation.ready;
    const before = Number(animation.currentTime);
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    return { before, after: Number(animation.currentTime), state: animation.playState };
  });
}
async function revealArtwork(page: Page) {
  await expect(artwork(page)).toHaveCount(1);
  await artwork(page).scrollIntoViewIfNeeded();
  await expect(artwork(page)).toBeInViewport();
}
async function financialRecords(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("vamm-demo-v2", 1);
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
      request.onupgradeneeded = () => { request.transaction?.abort(); reject(new Error("Expected initialized financial storage.")); };
    });
    try {
      const names = ["metadata", "sessions", "turns", "requestOutcomes"];
      const tx = db.transaction(names, "readonly");
      const rows = await Promise.all(names.map(name => new Promise<unknown[]>((resolve, reject) => {
        const request = tx.objectStore(name).getAll();
        request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
      })));
      return Object.fromEntries(names.map((name, index) => [name, rows[index]]));
    } finally { db.close(); }
  });
}
async function opaqueContent(element: Locator) {
  await expect(element).toBeVisible();
  expect(await element.evaluate(item => {
    for (let node: Element | null = item; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (Number(style.opacity) < 1 || style.visibility === "hidden" || style.display === "none") return false;
    }
    return true;
  })).toBe(true);
}

test.beforeEach(async ({ page }) => {
  await installLiveFeatureWidgetStubs(page);
  await installTradingViewStub(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const requests: string[] = []; calls.set(page, requests);
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    // Explicit unrelated guest account fixture; decorative motion still cannot invoke financial/model APIs.
    if (new URL(route.request().url()).pathname === "/api/account" && route.request().method() === "GET") {
      await route.fulfill({ json: { configured: false, user: null } }); return;
    }
    requests.push(new URL(route.request().url()).pathname); await route.abort("blockedbyclient");
  });
  await page.route(/^https:\/\/(?:api\.openai\.com|generativelanguage\.googleapis\.com)\//, async route => {
    requests.push(new URL(route.request().url()).origin); await route.abort("blockedbyclient");
  });
});
test.afterEach(async ({ page }) => { expect(calls.get(page), "Decorative motion must not request APIs or model providers.").toEqual([]); });

test("studio timelines run and automatically pause or become static with live OS/offscreen/visibility state", async ({ page }) => {
  test.setTimeout(60000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto("/dashboard");
  await revealArtwork(page);
  await expect(artwork(page)).toHaveAttribute("aria-hidden", "true");
  await expect(artwork(page).locator("a,button,input,select,textarea,[tabindex]")).toHaveCount(0);
  await expect(artwork(page).locator("[data-studio-part]")).toHaveCount(8);
  expect(await artwork(page).locator("[data-studio-part]").evaluateAll(elements => [...new Set(elements.map(element => element.getAttribute("data-studio-part")))].sort()))
    .toEqual(["core", "ring", "signal", "speck", "token"]);
  await motionState(page, "running");
  const running = await ringSample(page);
  expect(running.after).toBeGreaterThan(running.before);

  await expect(page.getByRole("button", { name: /^(Pause|Resume) animations$/ })).toHaveCount(0);
  await expect(page.getByRole("switch", { name: "Static motion", exact: true })).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("[data-motion-scope]")).toHaveAttribute("data-motion-os-reduced", "true");
  await expect(artwork(page)).toHaveAttribute("data-studio-static", "true");
  await expect.poll(() => animations(artwork(page))).toEqual([]);
  await opaqueContent(page.getByRole("main").getByRole("heading", { level: 1 }));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(artwork(page)).toHaveAttribute("data-studio-static", "false");
  await revealArtwork(page); await motionState(page, "running");

  await page.getByRole("main").locator("footer").last().scrollIntoViewIfNeeded();
  await expect(artwork(page)).not.toBeInViewport();
  await motionState(page, "paused");
  const offscreen = await ringSample(page); expect(offscreen.after).toBe(offscreen.before);
  await revealArtwork(page); await motionState(page, "running");

  // Explicit visibility-event fixture; actual CSS animation states are still measured.
  await page.evaluate(() => {
    const state = window as Window & { __studioHiddenDescriptor?: PropertyDescriptor };
    state.__studioHiddenDescriptor = Object.getOwnPropertyDescriptor(document, "hidden");
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await motionState(page, "paused");
  await page.evaluate(() => {
    const state = window as Window & { __studioHiddenDescriptor?: PropertyDescriptor };
    if (state.__studioHiddenDescriptor) Object.defineProperty(document, "hidden", state.__studioHiddenDescriptor);
    else Reflect.deleteProperty(document, "hidden");
    delete state.__studioHiddenDescriptor;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await motionState(page, "running");
  await nav(page, "Learning Academy").click();
  await expect(artwork(page)).toHaveCount(0);
  await nav(page, "Home").click();
  await revealArtwork(page); await motionState(page, "running");
  await expect(artwork(page).locator("[data-studio-part]")).toHaveCount(8);
  expect(errors).toEqual([]);
});

test("automatic studio motion preserves exact financial records, visible money/dialogs and localStorage", async ({ page }) => {
  test.setTimeout(60000);
  await page.goto("/simulation");
  await page.getByRole("button", { name: "Start your simulation", exact: true }).click();
  await page.getByRole("button", { name: "Advance one year", exact: true }).click();
  await page.getByLabel("Cash · Rp", { exact: true }).fill("150000");
  await page.getByRole("button", { name: "Confirm funding decision", exact: true }).click();
  await expect.poll(async () => ((await financialRecords(page)).sessions[0] as { session: { version: number } }).session.version).toBe(2);
  const saved = await financialRecords(page);
  expect(saved.sessions[0]).toMatchObject({ session: { version: 2, balances: { cash: 630000, bonds: 811200, equity: 1123200 } } });
  expect(saved.requestOutcomes).toHaveLength(3);
  const storage = await page.evaluate(() => Object.entries(localStorage).sort(([a], [b]) => a.localeCompare(b)));
  await nav(page, "Home").click();
  await revealArtwork(page); await motionState(page, "running");
  await opaqueContent(page.getByRole("img", { name: "VAMM AI Teknologi logo", exact: true }));
  await page.getByRole("main").locator("footer").last().scrollIntoViewIfNeeded();
  await expect(artwork(page)).not.toBeInViewport(); await motionState(page, "paused");
  expect(await financialRecords(page)).toEqual(saved);
  await revealArtwork(page); await motionState(page, "running");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(artwork(page)).toHaveAttribute("data-studio-static", "true");
  await expect.poll(() => animations(artwork(page))).toEqual([]);
  expect(await page.evaluate(() => Object.entries(localStorage).sort(([a], [b]) => a.localeCompare(b)))).toEqual(storage);
  await nav(page, "Simulation").click();
  const money = page.locator('[data-motion-preset="shock-settled"]').locator("p").filter({ hasText: /Rp\s*2[.\s]564[.\s]400/ }).first();
  await opaqueContent(money);
  await page.getByRole("button", { name: "New session", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Make room for a fresh start?", exact: true });
  await opaqueContent(dialog);
  await expect(dialog.getByRole("button", { name: "Create new session", exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Keep this session", exact: true }).click();
  await opaqueContent(money);
  expect(await financialRecords(page)).toEqual(saved);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
});
