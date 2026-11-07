import { expect, test, type Page } from "@playwright/test";

const MODULE_URL = "https://widgets.tradingview-widget.com/w/en/tv-advanced-chart.js";
const ERROR_MESSAGE = "TradingView couldn’t load this chart here.";
const LOADING_MESSAGE = "Loading TradingView chart…";
type WidgetMode = "ready" | "silent" | "error";
interface WidgetProbe { modules: number; connected: number; disconnected: number; }
type ProbeWindow = Window & { __vammWidgetProbe?: WidgetProbe; __vammWidgetMode?: WidgetMode };

/**
 * This fixture tests the VAMM host integration, not TradingView market rendering.
 * It replaces only the exact official ES module URL and emits the verified public
 * tv-widget-ready / tv-widget-error events. It makes no third-party requests.
 */
async function stubOfficialModule(page: Page, mode: WidgetMode = "ready") {
  await page.addInitScript((initialMode: WidgetMode) => {
    (window as ProbeWindow).__vammWidgetMode = initialMode;
  }, mode);
  let requests = 0;
  await page.route(MODULE_URL, async route => {
    requests += 1;
    await route.fulfill({
      contentType: "application/javascript",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: `
        const probe = window.__vammWidgetProbe ??= { modules: 0, connected: 0, disconnected: 0 };
        probe.modules += 1;
        if (!customElements.get("tv-advanced-chart")) {
          customElements.define("tv-advanced-chart", class extends HTMLElement {
            constructor() {
              super();
              const shadow = this.attachShadow({ mode: "closed" });
              shadow.innerHTML = '<style>:host{display:block;width:100%;height:100%;min-width:0}div{height:100%;display:grid;place-items:center;color:#ddd;background:#151515}</style><div role="img" aria-label="Deterministic chart integration stub">Chart integration stub — no live market data</div>';
            }
            connectedCallback() {
              probe.connected += 1;
              this.setAttribute("data-tv-probe-instance", String(probe.connected));
              this.timer = setTimeout(() => {
                if (!this.isConnected || window.__vammWidgetMode === "silent") return;
                const failed = window.__vammWidgetMode === "error";
                this.setAttribute("data-tv-probe-result", failed ? "error" : "ready");
                this.dispatchEvent(new CustomEvent(failed ? "tv-widget-error" : "tv-widget-ready", {
                  bubbles: true, composed: true,
                  detail: failed ? { reason: "<script>untrusted-provider-reason</script>" } : undefined
                }));
              }, 40);
            }
            disconnectedCallback() { clearTimeout(this.timer); probe.disconnected += 1; }
          });
        }
      `,
    });
  });
  return { requests: () => requests };
}
function marketNavigation(page: Page) {
  return page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Market", exact: true });
}
function navigation(page: Page, label: string) {
  return page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: label, exact: true });
}
function widgetRegion(page: Page) { return page.getByRole("region", { name: "TradingView market chart", exact: true }); }
function widget(page: Page) { return page.getByTestId("tradingview-host").locator("tv-advanced-chart"); }
async function noHorizontalOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(page.viewportSize()!.width);
}
async function readyStub(page: Page) {
  await expect(widget(page)).toHaveAttribute("data-tv-probe-result", "ready");
  await expect(widgetRegion(page).getByRole("status")).toHaveText("Chart loaded by TradingView.");
  await expect(widgetRegion(page).getByRole("alert")).toHaveCount(0);
}
async function simulationSnapshot(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const opening = indexedDB.open("vamm-demo-v2", 1);
      opening.onsuccess = () => resolve(opening.result);
      opening.onerror = () => reject(opening.error);
      opening.onupgradeneeded = () => { opening.transaction?.abort(); reject(new Error("Expected an existing simulation database.")); };
    });
    try {
      const stores = ["metadata", "sessions", "turns", "requestOutcomes"];
      const tx = db.transaction(stores, "readonly");
      const rows = await Promise.all(stores.map(name => new Promise<unknown[]>((resolve, reject) => {
        const reading = tx.objectStore(name).getAll();
        reading.onsuccess = () => resolve(reading.result);
        reading.onerror = () => reject(reading.error);
      })));
      return Object.fromEntries(stores.map((name, index) => [name, rows[index]]));
    } finally { db.close(); }
  });
}

test("stubbed official widget defaults, client navigation, singleton loader and responsive dashboard provenance", async ({ page }) => {
  const probe = await stubOfficialModule(page);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/dashboard");
  await readyStub(page);
  await expect(widget(page)).toHaveAttribute("symbol", "NASDAQ:AAPL");
  await expect(widget(page)).toHaveAttribute("interval", "1D");
  await expect(widget(page)).toHaveAttribute("theme", "dark");
  await expect(widget(page)).toHaveAttribute("allow-symbol-change", "");
  await expect(page.locator(`script[src="${MODULE_URL}"]`)).toHaveCount(1);
  await expect(page.locator(`script[src="${MODULE_URL}"]`)).toHaveAttribute("type", "module");
  await expect(page.getByRole("heading", { name: "Meet the educational baskets", exact: true })).toBeVisible();
  await expect(page.getByText("Simulated cash", { exact: true })).toBeVisible();
  await expect(page.getByText(/Synthetic teaching data · IDR · 6 Nov 2026/)).toBeVisible();
  await noHorizontalOverflow(page);
  const firstInstance = await widget(page).getAttribute("data-tv-probe-instance");

  await marketNavigation(page).click();
  await expect(page).toHaveURL(/\/market$/);
  await expect(page.getByRole("heading", { level: 1, name: "Market", exact: true })).toBeVisible();
  await expect(marketNavigation(page)).toHaveAttribute("aria-current", "page");
  await readyStub(page);
  expect(await widget(page).getAttribute("data-tv-probe-instance")).not.toBe(firstInstance);
  await expect(page.getByTestId("tradingview-host")).toHaveCount(1);
  await noHorizontalOverflow(page);

  await navigation(page, "Home").click();
  await readyStub(page);
  await expect(page.locator(`script[src="${MODULE_URL}"]`)).toHaveCount(1);
  expect(probe.requests()).toBe(1);
  const lifecycle = await page.evaluate(() => (window as ProbeWindow).__vammWidgetProbe);
  expect(lifecycle?.modules).toBe(1);
  expect(lifecycle?.disconnected).toBeGreaterThanOrEqual(2);
  expect(lifecycle?.connected).toBeGreaterThanOrEqual(3);
  await noHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test("blocked external module gives a useful fallback while the deterministic journey remains usable", async ({ page }) => {
  await page.route(MODULE_URL, route => route.abort("blockedbyclient"));
  await page.goto("/market");
  await expect(widgetRegion(page).getByRole("alert")).toHaveText(ERROR_MESSAGE);
  await expect(page.getByRole("button", { name: "Reload page", exact: true })).toBeVisible();
  const providerLink = widgetRegion(page).getByRole("link", { name: "Open on TradingView", exact: false });
  await expect(providerLink).toBeVisible();
  await expect(providerLink).toHaveAttribute("target", "_blank");
  await expect(providerLink).toHaveAttribute("rel", /\b(?:noopener|noreferrer)\b/);
  await noHorizontalOverflow(page);
  await page.getByRole("tab", { name: "Original Chart for Learning", exact: true }).click();
  await expect(page.getByRole("img", { name: /Synthetic index chart/ })).toBeVisible();
  await noHorizontalOverflow(page);
  await navigation(page, "Simulation").click();
  await page.getByRole("button", { name: "Start your simulation", exact: true }).click();
  await expect(page.getByRole("button", { name: "Advance one year", exact: true })).toBeEnabled();
  await expect(page.getByText("Age 15 · Turn 0 of 3", { exact: true })).toBeVisible();
  await noHorizontalOverflow(page);
});

test("module registration alone does not claim readiness and a silent widget reaches a visible timeout", async ({ page }) => {
  await page.clock.install();
  await stubOfficialModule(page, "silent");
  await page.goto("/market");
  await expect(widget(page)).toHaveAttribute("data-tv-probe-instance", /\d+/);
  expect(await page.evaluate(() => Boolean(customElements.get("tv-advanced-chart")))).toBe(true);
  await expect(widgetRegion(page).getByRole("status")).toHaveText(LOADING_MESSAGE);
  await expect(widgetRegion(page).getByRole("alert")).toHaveCount(0);
  await page.clock.fastForward(21000);
  await expect(widgetRegion(page).getByRole("alert")).toHaveText(ERROR_MESSAGE);
  await expect(page.getByRole("button", { name: "Retry chart", exact: true })).toBeEnabled();
  await noHorizontalOverflow(page);
});

test("verified widget error events are sanitized and manual retry remounts without downloading a second module", async ({ page }) => {
  const probe = await stubOfficialModule(page, "error");
  await page.goto("/market");
  await expect(widgetRegion(page).getByRole("alert")).toHaveText(ERROR_MESSAGE);
  await expect(page.getByText("untrusted-provider-reason", { exact: false })).toHaveCount(0);
  const oldInstance = await widget(page).getAttribute("data-tv-probe-instance");
  await page.evaluate(() => { (window as ProbeWindow).__vammWidgetMode = "ready"; });
  await page.getByRole("button", { name: "Retry chart", exact: true }).click();
  await readyStub(page);
  expect(await widget(page).getAttribute("data-tv-probe-instance")).not.toBe(oldInstance);
  await expect(page.getByTestId("tradingview-host")).toHaveCount(1);
  await expect(page.locator(`script[src="${MODULE_URL}"]`)).toHaveCount(1);
  expect(probe.requests()).toBe(1);
});

const verifiedSources = [
  { title: "Apple reports fourth quarter results", publisher: "Apple", date: "2 Nov 2026", url: "https://www.apple.com/newsroom/2026/11/apple-reports-fourth-quarter-results/" },
  { title: "Federal Reserve issues FOMC statement", publisher: "Federal Reserve", date: "28 Oct 2026", url: "https://www.federalreserve.gov/newsevents/pressreleases/monetary20261028a.htm" },
  { title: "When index funds mix but don’t match", publisher: "Vanguard", date: "4 Jun 2025", url: "https://corporate.vanguard.com/content/corporatesite/us/en/corp/articles/when-index-funds-mix-dont-match.html" },
] as const;

test("real publisher reading uses verified links and no invented sentiment, with synthetic practice explicitly separate", async ({ page }) => {
  let practiceRequests = 0;
  page.on("request", request => { if (new URL(request.url()).pathname === "/api/news") practiceRequests += 1; });
  await page.goto("/news");
  const reading = page.getByRole("region", { name: "Curated source reading", exact: true });
  await expect(reading).toBeVisible();
  await expect(reading.getByRole("article")).toHaveCount(3);
  for (const source of verifiedSources) {
    const article = reading.getByRole("article").filter({ has: page.getByRole("heading", { name: source.title, exact: true }) });
    await expect(article).toBeVisible();
    const link = article.getByRole("link");
    await expect(link).toHaveAccessibleName(source.title + " — " + source.publisher + " (opens in a new tab)");
    await expect(link).toHaveAttribute("href", source.url);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/);
    await expect(link).toHaveAttribute("rel", /noreferrer/);
    await expect(article).toContainText(source.publisher);
    await expect(article).toContainText(source.date);
  }
  for (const sentiment of ["Positive", "Neutral", "Negative", "Mixed"]) {
    await expect(reading.getByText(sentiment, { exact: true })).toHaveCount(0);
  }
  await expect(page.getByText("Curated · not live", { exact: true })).toBeVisible();
  await expect(page.getByRole("main").locator("footer").last()).toContainText("Publisher reading and synthetic practice labeled separately");
  expect(practiceRequests).toBe(0);
  await noHorizontalOverflow(page);
  await page.locator("summary").filter({ hasText: "Synthetic practice" }).click();
  await expect(page.getByText("Synthetic scenario: bond basket records a modest gain", { exact: true })).toBeVisible();
  await expect(page.getByText("Mixed", { exact: true })).toBeVisible();
  expect(practiceRequests).toBe(1);
  await expect(reading).toBeVisible();
  await noHorizontalOverflow(page);
});

test("independent widget and source-news interactions preserve saved simulation state and first-turn math", async ({ page, request }) => {
  await stubOfficialModule(page);
  const marketBefore = await (await request.get("/api/market")).json();
  const newsBefore = await (await request.get("/api/news")).json();
  await page.goto("/simulation");
  await page.getByRole("button", { name: "Start your simulation", exact: true }).click();
  await expect(page.getByRole("button", { name: "Advance one year", exact: true })).toBeEnabled();
  const before = await simulationSnapshot(page);

  await marketNavigation(page).click();
  await readyStub(page);
  await widget(page).evaluate(element => {
    element.setAttribute("symbol", "NYSE:IBM");
    element.dispatchEvent(new CustomEvent("tv-widget-ready", { bubbles: true, composed: true, detail: { price: 999999, balances: { cash: 10000000 } } }));
  });
  await expect(widget(page)).toHaveAttribute("symbol", "NYSE:IBM");
  await navigation(page, "News & Sentiment Lab").click();
  await expect(page.getByRole("region", { name: "Curated source reading", exact: true })).toBeVisible();
  await page.locator("summary").filter({ hasText: "Synthetic practice" }).click();
  await expect(page.getByText("Synthetic scenario: bond basket records a modest gain", { exact: true })).toBeVisible();
  expect(await simulationSnapshot(page)).toEqual(before);
  expect(await (await request.get("/api/market")).json()).toEqual(marketBefore);
  expect(await (await request.get("/api/news")).json()).toEqual(newsBefore);

  await navigation(page, "Simulation").click();
  await page.getByRole("button", { name: "Advance one year", exact: true }).click();
  await page.getByLabel("Cash · Rp", { exact: true }).fill("150000");
  await page.getByRole("button", { name: "Confirm funding decision", exact: true }).click();
  await expect.poll(async () => {
    const snapshot = await simulationSnapshot(page);
    return (snapshot.sessions[0] as { session: { version: number } }).session.version;
  }).toBe(2);
  const after = await simulationSnapshot(page);
  expect(after.turns).toHaveLength(1);
  expect(after.sessions[0]).toMatchObject({ session: { age: 16, turnIndex: 1, version: 2,
    balances: { cash: 630000, bonds: 811200, equity: 1123200 } } });
  await noHorizontalOverflow(page);
});

test("Practice Workspace exposes the original index chart and preserves TradingView selection", async ({ page }) => {
  await stubOfficialModule(page);
  const marketBefore = await (await page.request.get("/api/market")).json();
  await page.goto("/market");
  await readyStub(page);
  const tradingTab = page.getByRole("tab", { name: "TradingView Chart", exact: true });
  const learningTab = page.getByRole("tab", { name: "Original Chart for Learning", exact: true });
  await expect(tradingTab).toHaveAttribute("aria-selected", "true");
  const provider = widget(page);
  const instance = await provider.getAttribute("data-tv-probe-instance");
  await provider.evaluate(element => element.setAttribute("symbol", "NYSE:IBM"));

  await learningTab.click();
  await expect(learningTab).toHaveAttribute("aria-selected", "true");
  await expect(provider).toBeHidden();
  const learning = page.getByRole("tabpanel", { name: "Original Chart for Learning", exact: true });
  const instruments = learning.getByRole("list", { name: "Available educational instruments" });
  await expect(instruments.getByRole("listitem")).toHaveText([
    "Simulated cash", "Simulated bond basket", "Simulated diversified equity basket"
  ]);
  await expect(learning.getByRole("img", { name: /Synthetic index chart/ })).toBeVisible();
  await expect(learning.getByText(/Synthetic teaching data · IDR · 6 Nov 2026/)).toBeVisible();
  await learning.locator("summary").filter({ hasText: "View index values as a table" }).click();
  await expect(learning.getByRole("row", { name: "2026-11-06 100.00 112.48 104.54" })).toBeVisible();
  await noHorizontalOverflow(page);

  await learningTab.focus();
  await page.keyboard.press("Home");
  await expect(tradingTab).toBeFocused();
  await expect(tradingTab).toHaveAttribute("aria-selected", "true");
  await expect(provider).toHaveAttribute("symbol", "NYSE:IBM");
  await expect(provider).toHaveAttribute("data-tv-probe-instance", instance!);
  expect(await (await page.request.get("/api/market")).json()).toEqual(marketBefore);
  await noHorizontalOverflow(page);
});
