import { CHAT_REPLY, installMentorFixture, seedLegacyAnswer, sendMentorMessage } from "./mentor-chat-fixture";
import { expect, test, type Page } from "@playwright/test";
import { getMarketData } from "../../src/lib/data/fixtures";
import { TRACKS } from "../../src/lib/learning/catalog";
import { installLiveFeatureWidgetStubs } from "./live-features-widget-stub";

// Account, Google redirect and research responses below are explicit browser fixtures.
// They prove UI behavior/isolation, never a successful Google consent or token exchange.
type Account = { configured: boolean; user: null | { name: string; email: string | null } };
const panel = (page: Page) => page.getByRole("region", { name: "Google account", exact: true });
const toolbar = (page: Page) => page.getByRole("group", { name: "Account toolbar", exact: true });
const unexpected = new WeakMap<Page, string[]>();
function gate() { let release!: () => void; const promise = new Promise<void>(resolve => { release = resolve; }); return { promise, release }; }
async function noOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
}
async function deviceRecords(page: Page) {
  return page.evaluate(async () => {
    const catalog = { "vamm-demo-v2": ["metadata", "sessions", "turns", "requestOutcomes"], "vamm-learning-v1": ["progress"], "vamm-mentor-history-v1": ["answers"], "vamm-mentor-chat-v1": ["sessions"] };
    const all: Record<string, Record<string, { keys: IDBValidKey[]; values: unknown[] }>> = {};
    for (const [name, stores] of Object.entries(catalog)) {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const opening = indexedDB.open(name, 1);
        opening.onsuccess = () => resolve(opening.result); opening.onerror = () => reject(opening.error);
        opening.onupgradeneeded = () => { opening.transaction?.abort(); reject(new Error("Expected initialized test-owned device database: " + name)); };
      });
      try {
        const tx = db.transaction(stores, "readonly"); const saved: Record<string, { keys: IDBValidKey[]; values: unknown[] }> = {};
        await Promise.all(stores.map(async store => {
          const read = <T,>(request: IDBRequest<T>) => new Promise<T>((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
          const [keys, values] = await Promise.all([read(tx.objectStore(store).getAllKeys()), read(tx.objectStore(store).getAll())]);
          saved[store] = { keys, values };
        }));
        all[name] = saved;
      } finally { db.close(); }
    }
    return all;
  });
}
async function seedDeviceRecordsThroughUI(page: Page) {
  await page.goto("/simulation");
  await page.getByRole("button", { name: "Start your simulation", exact: true }).click();
  await page.getByRole("button", { name: "Advance one year", exact: true }).click();
  await page.getByLabel("Cash · Rp", { exact: true }).fill("150000");
  await page.getByRole("button", { name: "Confirm funding decision", exact: true }).click();
  await expect(page.getByText("Age 16 · Turn 1 of 3", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Advance one year", exact: true })).toBeEnabled();
  await page.goto("/academy");
  const track = TRACKS.find(item => item.id === "stock-essentials")!;
  await page.getByRole("link", { name: "Start course: " + track.title, exact: true }).click();
  await page.getByRole("button", { name: "Mark lesson complete", exact: true }).click();
  await expect(page.getByTestId("learning-academy-points")).toHaveText("10");

  const market = getMarketData();
  const researchRequests = await installMentorFixture(page);
  await page.goto("/research");
  await sendMentorMessage(page, "Explain uncertainty for this auth-isolation fixture.");
  await expect(page.getByText(CHAT_REPLY, { exact: true })).toBeVisible();
  await seedLegacyAnswer(page, { id: "10000000-0000-4000-8000-000000000001", question: "Prior saved answer", instrumentIds: ["edu-bonds"], createdAt: "2026-11-07T00:00:00Z", response: { summary: "Explicit legacy browser fixture", facts: [], limitations: ["No model call"], evidence: market.evidence.filter(item => item.id === "ev-demo-method"), origin: "prewritten" } });
  const records = await deviceRecords(page);
  expect(records["vamm-demo-v2"].sessions.values[0]).toMatchObject({ session: { version: 2, balances: { cash: 630000, bonds: 811200, equity: 1123200 } } });
  expect(records["vamm-demo-v2"].requestOutcomes.values).toHaveLength(3);
  expect(records["vamm-learning-v1"].progress.values[0]).toMatchObject({ completedLessonIds: ["stocks"] });
  expect(records["vamm-mentor-history-v1"].answers.values).toHaveLength(1);
  expect(records["vamm-mentor-chat-v1"].sessions.values).toHaveLength(1);
  return { records, researchRequests };
}

test.beforeEach(async ({ page }) => {
  await installLiveFeatureWidgetStubs(page);
  const calls: string[] = []; unexpected.set(page, calls);
  await page.route(url => url.pathname.startsWith("/api/"), async route => { calls.push(route.request().method() + " " + new URL(route.request().url()).pathname); await route.abort("blockedbyclient"); });
  await page.route(/^https:\/\/(?:accounts\.google\.com|oauth2\.googleapis\.com|api\.openai\.com|generativelanguage\.googleapis\.com)\//, async route => { calls.push(new URL(route.request().url()).origin); await route.abort("blockedbyclient"); });
});
test.afterEach(async ({ page }) => { expect(unexpected.get(page), "Only explicit account/provider/research fixtures are allowed; no real consent/model call.").toEqual([]); });

test("account checking and failed status retry leave anonymous routes available and missing configuration honest", async ({ page }) => {
  const held = gate(); let reads = 0;
  await page.route("**/api/account", async route => {
    reads++;
    if (reads === 1) { await held.promise; await route.fulfill({ status: 503, json: { error: "Explicit account status failure fixture." } }); }
    else await route.fulfill({ headers: { "Cache-Control": "no-store" }, json: { configured: false, user: null } });
  });
  await page.goto("/profile");
  await expect(page.getByRole("main").getByRole("heading", { level: 1, name: "Learning Profile", exact: true })).toBeVisible();
  await expect(panel(page)).toHaveAttribute("data-account-state", "checking");
  await expect(toolbar(page)).toHaveAttribute("data-account-state", "checking");
  await expect(panel(page).getByRole("status")).toHaveText("Checking account…");
  held.release();
  await expect(panel(page)).toHaveAttribute("data-account-state", "error");
  await expect(panel(page).getByRole("alert")).toContainText("device history has not changed");
  expect(reads).toBe(1);
  const retry = panel(page).getByRole("button", { name: "Check account again", exact: true });
  await retry.focus(); await retry.press("Enter");
  await expect(panel(page)).toHaveAttribute("data-account-state", "unconfigured");
  await expect(retry).toBeFocused();
  await expect(panel(page)).toContainText("Google sign-in is not configured");
  const unavailable = panel(page).getByRole("button", { name: "Continue with Google", exact: true });
  await expect(unavailable).toHaveAttribute("aria-disabled", "true"); await unavailable.focus(); await unavailable.press("Enter");
  await expect(page.getByRole("button", { name: /^(Pause|Resume) animations$/ })).toHaveCount(0);
  await expect(page.getByRole("switch", { name: "Static motion", exact: true })).toHaveCount(0);
  await expect(page.getByText("V", { exact: true })).toHaveCount(0);
  await expect(panel(page)).toContainText("does not sync, transfer, erase");
  await page.goto("/simulation");
  await expect(page.getByRole("button", { name: "Start your simulation", exact: true })).toBeEnabled();
  await noOverflow(page);
});

test("signed-in account fixtures, failed/successful sign-out and account changes preserve nonempty financial, learning and saved-research records", async ({ page }) => {
  test.setTimeout(60000);
  let account: Account = { configured: true, user: { name: "Fixture Student <img src=x>", email: "student@example.test" } };
  await page.route("**/api/account", route => route.fulfill({ headers: { "Cache-Control": "no-store" }, json: account }));
  const signOutGate = gate(); const posts: unknown[] = [];
  await page.route("**/api/auth/sign-out", async route => {
    expect(route.request().method()).toBe("POST"); posts.push(route.request().postDataJSON());
    if (posts.length === 1) { await signOutGate.promise; await route.fulfill({ status: 403, json: { message: "Explicit sign-out failure fixture." } }); }
    else { account = { configured: true, user: null }; await route.fulfill({ json: { success: true } }); }
  });
  const { records, researchRequests } = await seedDeviceRecordsThroughUI(page);
  const local = await page.evaluate(() => Object.entries(localStorage).sort());
  await page.goto("/profile");
  await expect(panel(page)).toHaveAttribute("data-account-state", "signed-in");
  await expect(panel(page).getByText(account.user!.name, { exact: true })).toBeVisible();
  await expect(panel(page).locator("img")).toHaveCount(0);
  expect(await deviceRecords(page)).toEqual(records);
  const signOut = panel(page).getByRole("button", { name: "Sign out", exact: true });
  await signOut.focus(); await signOut.press("Enter");
  await expect(panel(page)).toHaveAttribute("data-account-state", "pending");
  const pending = panel(page).getByRole("button", { name: "Signing out…", exact: true });
  await expect(pending).toBeFocused(); await expect(pending).toHaveAttribute("aria-disabled", "true");
  await pending.press("Enter"); expect(posts).toEqual([{}]); expect(await deviceRecords(page)).toEqual(records);
  signOutGate.release();
  await expect(panel(page)).toHaveAttribute("data-account-state", "error");
  await expect(panel(page).getByRole("alert")).toContainText("Sign-out could not be confirmed");
  await expect(signOut).toBeFocused(); expect(await deviceRecords(page)).toEqual(records);
  await signOut.press("Enter");
  await expect(panel(page)).toHaveAttribute("data-account-state", "guest");
  expect(posts).toEqual([{}, {}]); expect(await deviceRecords(page)).toEqual(records);
  await page.reload(); await expect(panel(page)).toHaveAttribute("data-account-state", "guest");
  expect(await deviceRecords(page)).toEqual(records);
  account = { configured: true, user: { name: "Different Fixture Account", email: null } };
  await page.reload(); await expect(panel(page)).toHaveAttribute("data-account-state", "signed-in");
  await expect(panel(page).getByText("Different Fixture Account", { exact: true })).toBeVisible();
  expect(await deviceRecords(page)).toEqual(records);
  expect(await page.evaluate(() => Object.entries(localStorage).sort())).toEqual(local);
  expect(researchRequests).toHaveLength(1);
  await noOverflow(page);
});

test("Google sign-in fixtures use fixed local callbacks, reject hostile redirect URLs and keep server configuration out of client assets", async ({ page }) => {
  await page.route("**/api/account", route => route.fulfill({ json: { configured: true, user: null } }));
  const held = gate(); const payloads: unknown[] = []; let attempted = 0;
  const hostile = ["https://accounts.google.com.evil.example/oauth", "https://user:pass@accounts.google.com/o/oauth2/v2/auth", "javascript:alert(1)"];
  const googleFixture = "https://accounts.google.com/o/oauth2/v2/auth?client_id=browser-fixture&scope=openid%20email%20profile&state=deterministic-fixture";
  await page.route("**/api/auth/sign-in/social", async route => {
    expect(route.request().method()).toBe("POST"); payloads.push(route.request().postDataJSON());
    const index = attempted++;
    if (index === 0) await held.promise;
    await route.fulfill({ json: { redirect: true, url: hostile[index] ?? googleFixture } });
  });
  const googleVisits: string[] = [];
  await page.route("https://accounts.google.com/**", route => {
    googleVisits.push(route.request().url()); return route.fulfill({ contentType: "text/html", body: "<!doctype html><title>Explicit Google redirect fixture</title><h1>Provider redirect fixture; no consent or token exchange</h1>" });
  });
  const jobs: Promise<void>[] = []; const markers = new Set<string>(); let scripts = 0;
  page.on("response", response => {
    if (!new URL(response.url()).pathname.startsWith("/_next/static/") || response.request().resourceType() !== "script") return;
    jobs.push(response.text().then(body => { scripts++; if (/\b(?:BETTER_AUTH_SECRET|GOOGLE_CLIENT_SECRET|OPENAI_API_KEY)\b/.test(body)) markers.add("server-only secret configuration"); }));
  });
  await page.goto("/profile?authError=oauth");
  await expect(panel(page).getByRole("alert")).toContainText("cancelled or could not finish");
  const signIn = panel(page).getByRole("button", { name: "Continue with Google", exact: true });
  await signIn.focus(); await signIn.press("Enter");
  const pending = panel(page).getByRole("button", { name: "Opening Google…", exact: true });
  await expect(pending).toHaveAttribute("aria-disabled", "true"); await expect(pending).toBeFocused();
  await pending.press("Enter"); expect(payloads).toHaveLength(1); held.release();
  for (let index = 0; index < hostile.length; index++) {
    if (index) await signIn.press("Enter");
    await expect(panel(page)).toHaveAttribute("data-account-state", "error");
    await expect(signIn).toHaveAttribute("aria-disabled", "false");
    await expect(panel(page).getByRole("alert").filter({ hasText: "could not start" })).toBeVisible();
    await expect(page).toHaveURL(/\/profile\?authError=oauth$/); expect(googleVisits).toEqual([]);
  }
  await Promise.all(jobs); expect(scripts).toBeGreaterThan(0); expect([...markers]).toEqual([]);
  await signIn.press("Enter");
  await expect(page).toHaveURL(googleFixture);
  await expect(page.getByRole("heading", { name: "Provider redirect fixture; no consent or token exchange", exact: true })).toBeVisible();
  expect(googleVisits).toEqual([googleFixture]);
  expect(payloads).toEqual(Array.from({ length: 4 }, () => ({ provider: "google", callbackURL: "/profile", errorCallbackURL: "/profile?authError=oauth" })));
});
