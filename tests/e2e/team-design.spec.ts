import { expect, test, type Page } from "@playwright/test";
import { installLiveFeatureWidgetStubs } from "./live-features-widget-stub";

const routes = [
  { path: "/dashboard", name: "Home" },
  { path: "/market", name: "Market" },
  { path: "/research", name: "AI Investment Mentor" },
  { path: "/compare", name: "Compare" },
  { path: "/simulation", name: "Simulation" },
  { path: "/news", name: "News & Sentiment Lab" },
];
const shell = (page: Page) => page.locator("[data-site-motion]");
const mobile = (page: Page) => page.viewportSize()!.width <= 760;
async function openNavigation(page: Page) {
  if (mobile(page) && await shell(page).getAttribute("data-mobile-menu-open") !== "true") {
    await page.getByRole("button", { name: "Open workspace menu", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Workspace menu", exact: true })).toBeVisible();
  }
  const navigation = page.getByRole("navigation", { name: "Main navigation", exact: true });
  await expect(navigation).toHaveCount(1);
  await expect(navigation.getByRole("link")).toHaveCount(6);
  return navigation;
}
async function navigate(page: Page, destination: (typeof routes)[number]) {
  const navigation = await openNavigation(page);
  const link = navigation.getByRole("link", { name: destination.name, exact: true });
  await expect(link).toHaveAttribute("href", destination.path);
  await link.click();
  await expect(page).toHaveURL(new RegExp(destination.path + "(?:[?#].*)?$"));
  await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toHaveCount(1);
  const active = page.locator('nav[aria-label="Main navigation"] a[aria-current="page"]');
  await expect(active).toHaveCount(1);
  await expect(active).toHaveAttribute("href", destination.path);
  if (mobile(page)) await expect(shell(page)).toHaveAttribute("data-mobile-menu-open", "false");
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
}
async function records(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("vamm-demo-v2", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onupgradeneeded = () => { request.transaction?.abort(); reject(new Error("Expected initialized VAMM v2 storage.")); };
    });
    try {
      const names = ["metadata", "sessions", "turns", "requestOutcomes"];
      const transaction = db.transaction(names, "readonly");
      const rows = await Promise.all(names.map(name => new Promise<unknown[]>((resolve, reject) => {
        const request = transaction.objectStore(name).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })));
      return Object.fromEntries(names.map((name, index) => [name, rows[index]]));
    } finally { db.close(); }
  });
}
async function exerciseShellControl(page: Page) {
  if (mobile(page)) {
    const scrollBefore = await page.evaluate(() => ({ inline: document.body.style.overflow, computed: getComputedStyle(document.body).overflow }));
    const opener = page.getByRole("button", { name: "Open workspace menu", exact: true });
    await opener.focus();
    await opener.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Workspace menu", exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).overflow)).toBe("hidden");
    await expect(shell(page)).toHaveAttribute("data-mobile-menu-open", "true");
    await expect(dialog.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("link")).toHaveCount(6);
    expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
    const focusable = dialog.locator('a[href],button:not([disabled]),[tabindex="0"]').filter({ visible: true });
    await focusable.first().focus();
    await page.keyboard.press("Shift+Tab");
    await expect(focusable.last()).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(focusable.first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(shell(page)).toHaveAttribute("data-mobile-menu-open", "false");
    await expect(opener).toBeFocused();
    await expect.poll(() => page.evaluate(() => ({ inline: document.body.style.overflow, computed: getComputedStyle(document.body).overflow }))).toEqual(scrollBefore);
    await opener.click();
    await dialog.getByRole("button", { name: "Close workspace menu", exact: true }).click();
    await expect(opener).toBeFocused();
    await expect.poll(() => page.evaluate(() => ({ inline: document.body.style.overflow, computed: getComputedStyle(document.body).overflow }))).toEqual(scrollBefore);
  } else {
    const toggle = page.getByRole("button", { name: "Hide sidebar", exact: true });
    await expect(toggle).toHaveAttribute("aria-controls", "workspace-context");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await toggle.focus();
    await toggle.press("Enter");
    await expect(shell(page)).toHaveAttribute("data-context-collapsed", "true");
    const reopen = page.getByRole("button", { name: "Show sidebar", exact: true });
    await expect(reopen).toHaveAttribute("aria-expanded", "false");
    await expect(reopen).toBeFocused();
    await expect(page.locator("#workspace-context")).not.toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("link")).toHaveCount(6);
    await reopen.press("Enter");
    await expect(shell(page)).toHaveAttribute("data-context-collapsed", "false");
    await expect(page.locator("#workspace-context")).toBeVisible();
  }
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
}

test.beforeEach(async ({ page }) => { await installLiveFeatureWidgetStubs(page); });

test("teammate visual shell preserves six routes and accessible responsive navigation", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/dashboard");
  await expect(shell(page)).toHaveCount(1);
  const tokens = await shell(page).evaluate(element => {
    const style = getComputedStyle(element);
    return Object.fromEntries(["--team-canvas", "--team-ink", "--team-cobalt", "--team-lime"].map(name => [name, style.getPropertyValue(name).trim().toLowerCase()]));
  });
  expect(tokens).toEqual({ "--team-canvas": "#f4f4ef", "--team-ink": "#202334", "--team-cobalt": "#3458e8", "--team-lime": "#d6ef87" });
  expect(await shell(page).evaluate(element => getComputedStyle(element).backgroundColor)).toBe("rgb(244, 244, 239)");
  const currentLink = page.locator('nav[aria-label="Main navigation"] a[aria-current="page"]');
  expect(await currentLink.evaluate(element => getComputedStyle(element).backgroundColor)).toBe("rgb(52, 88, 232)");
  await exerciseShellControl(page);
  for (const destination of routes) {
    await navigate(page, destination);
    if (destination.path === "/research") {
      // A QA screenshot is not an application image-upload/analysis feature.
      await expect(page.locator('input[type="file"]')).toHaveCount(0);
      await expect(page.getByRole("button", { name: /upload (?:a )?(?:chart|screenshot)|analy[sz]e (?:a )?(?:chart image|screenshot)|buy virtually|sell virtually/i })).toHaveCount(0);
    }
  }
  expect(errors).toEqual([]);
  await testInfo.attach("team-shell-" + testInfo.project.name, { body: await page.screenshot({ fullPage: true, animations: "disabled" }), contentType: "image/png" });
});

test("shell changes, routes and static motion preserve exact committed financial records", async ({ page }) => {
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/simulation");
  await page.getByRole("button", { name: "Start your simulation", exact: true }).click();
  await page.getByRole("button", { name: "Advance one year", exact: true }).click();
  await page.getByLabel("Cash · Rp", { exact: true }).fill("150000");
  await page.getByRole("button", { name: "Confirm funding decision", exact: true }).click();
  await expect.poll(async () => ((await records(page)).sessions[0] as { session: { version: number } }).session.version).toBe(2);
  const committed = await records(page);
  expect(committed.sessions).toHaveLength(1);
  expect(committed.turns).toHaveLength(1);
  expect(committed.requestOutcomes).toHaveLength(3);
  expect(committed.sessions[0]).toMatchObject({ session: { version: 2, turnIndex: 1, phase: "ready", balances: { cash: 630000, bonds: 811200, equity: 1123200 } } });

  await exerciseShellControl(page);
  expect(await records(page)).toEqual(committed);
  await page.getByRole("button", { name: "Pause animations", exact: true }).click();
  await expect(page.getByRole("button", { name: "Resume animations", exact: true })).toHaveAttribute("aria-pressed", "true");
  const staticMotion = page.getByRole("switch", { name: "Static motion", exact: true });
  await staticMotion.click();
  await expect(staticMotion).toHaveAttribute("aria-checked", "true");
  for (const destination of routes) {
    await navigate(page, destination);
    expect(await records(page)).toEqual(committed);
    await expect(page.getByRole("switch", { name: "Static motion", exact: true })).toHaveAttribute("aria-checked", "true");
  }
  await navigate(page, routes.find(destination => destination.path === "/simulation")!);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByRole("switch", { name: "Static motion", exact: true })).toBeDisabled();
  expect(await records(page)).toEqual(committed);
  await page.reload();
  await expect(page.getByText("Age 16 · Turn 1 of 3", { exact: true })).toBeVisible();
  expect(await records(page)).toEqual(committed);
});
