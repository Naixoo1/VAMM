import { expect, test } from "@playwright/test";
import { CHAT_REPLY, PNG_FIXTURE, chatRecords, installMentorFixture, sendMentorMessage } from "./mentor-chat-fixture";

test("screenshot conversations retain follow-up context and reopen every session without resending", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  const calls = await installMentorFixture(page);
  await page.goto("/research");
  await expect(page.getByRole("heading", { level: 1, name: "AI Investment Mentor", exact: true })).toBeVisible();
  await expect(page.locator("[data-live-market-kind]")).toHaveCount(0);
  await page.getByLabel("Upload screenshot", { exact: true }).setInputFiles({ name: "chart.png", mimeType: "image/png", buffer: PNG_FIXTURE });
  await sendMentorMessage(page, "Explain the visible chart and possible scenarios.");
  await expect(page.getByText(CHAT_REPLY, { exact: true })).toBeVisible();
  expect(calls).toHaveLength(1);
  expect(calls[0]).toMatchObject({ messages: [{ role: "user", content: "Explain the visible chart and possible scenarios." }], image: { mimeType: "image/png", dataUrl: expect.stringContaining("data:image/png;base64,") } });
  await sendMentorMessage(page, "What would invalidate those scenarios?");
  await expect.poll(async () => (await chatRecords(page))[0].messages.length).toBe(4);
  expect(calls).toHaveLength(2);
  expect((calls[1] as { messages: unknown[] }).messages).toHaveLength(3);
  await page.getByRole("button", { name: "New chat", exact: true }).click();
  await sendMentorMessage(page, "Explain diversification.");
  await expect.poll(async () => (await chatRecords(page)).length).toBe(2);
  const saved = await chatRecords(page);
  await page.reload();
  await page.getByRole("button", { name: /^Open chat: Explain the visible chart/ }).click();
  await expect(page.getByText("What would invalidate those scenarios?", { exact: true })).toBeVisible();
  expect(await chatRecords(page)).toEqual(saved);
  expect(calls).toHaveLength(3);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(errors).toEqual([]);
});

test("failed replies retry explicitly once and preserve the existing user message", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/mentor-chat", async route => {
    if (route.request().method() === "GET") return route.fulfill({ json: { configured: true } });
    calls++;
    await route.fulfill(calls === 1 ? { status: 503, json: { ok: false, error: { code: "MODEL_UNAVAILABLE", message: "Explicit provider failure fixture." } } } : { json: { ok: true, data: { content: CHAT_REPLY, origin: "model" } } });
  });
  await page.goto("/research");
  await sendMentorMessage(page, "Explain uncertainty.");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Your question is saved");
  expect(calls).toBe(1);
  expect((await chatRecords(page))[0].messages).toHaveLength(1);
  await page.getByRole("button", { name: "Retry reply", exact: true }).click();
  await expect(page.getByText(CHAT_REPLY, { exact: true })).toBeVisible();
  expect(calls).toBe(2);
  expect((await chatRecords(page))[0].messages).toHaveLength(2);
});

test("unconfigured models and unavailable device history are explicit, without synthetic replies", async ({ page }) => {
  let posts = 0;
  await page.route("**/api/mentor-chat", route => {
    if (route.request().method() === "POST") posts++;
    return route.fulfill({ json: { configured: false } });
  });
  await page.goto("/research");
  await expect(page.getByText(/not configured/i).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Send message", exact: true })).toBeDisabled();
  expect(posts).toBe(0);
  await page.addInitScript(() => Object.defineProperty(window, "indexedDB", { value: undefined }));
  await page.reload();
  await expect(page.getByRole("alert").filter({ hasText: /storage|history/i }).first()).toBeVisible();
  expect(posts).toBe(0);
});

test("an unsaved reply survives cancelled navigation and local retry does not call the model again", async ({ page }) => {
  await page.addInitScript(() => {
    const original = IDBObjectStore.prototype.put; let failOnce = true;
    IDBObjectStore.prototype.put = function(value: unknown, key?: IDBValidKey) {
      const row = value as { messages?: { role: string }[] };
      if (failOnce && this.transaction.db.name === "vamm-mentor-chat-v1" && row.messages?.at(-1)?.role === "assistant") {
        failOnce = false; throw new DOMException("Explicit reply-save quota fixture", "QuotaExceededError");
      }
      return key === undefined ? original.call(this, value) : original.call(this, value, key);
    };
  });
  const calls = await installMentorFixture(page);
  await page.goto("/research");
  await page.getByLabel("Upload screenshot", { exact: true }).setInputFiles({ name: "chart.png", mimeType: "image/png", buffer: PNG_FIXTURE });
  await sendMentorMessage(page, "Explain this screenshot's uncertainty.");
  await expect(page.getByRole("article", { name: "Unsaved Mentor reply", exact: true })).toBeVisible();
  expect(calls).toHaveLength(1);
  await expect(page.getByRole("button", { name: "Remove screenshot", exact: true })).toBeDisabled();
  page.once("dialog", async dialog => { expect(dialog.type()).toBe("confirm"); await dialog.dismiss(); });
  await page.getByRole("button", { name: "New chat", exact: true }).click();
  await expect(page.getByRole("article", { name: "Unsaved Mentor reply", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Retry reply", exact: true }).click();
  await expect(page.getByRole("article", { name: "Unsaved Mentor reply", exact: true })).toHaveCount(0);
  expect((await chatRecords(page))[0].messages).toHaveLength(2);
  expect(calls).toHaveLength(1);
});
