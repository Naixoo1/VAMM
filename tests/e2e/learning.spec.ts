import { seedLegacyAnswer } from "./mentor-chat-fixture";
import { expect, test, type Page } from "@playwright/test";
import { ACADEMY_MILESTONES, GLOSSARY, QUIZ_PACKS, TRACKS, getLesson } from "../../src/lib/learning/catalog";
import { installLiveFeatureWidgetStubs } from "./live-features-widget-stub";
import { getMarketData } from "../../src/lib/data/fixtures";
import type { SavedMentorAnswer } from "../../src/lib/learning/mentor-history";
import type { LearningProgress } from "../../src/lib/learning/types";

const stockQuiz = QUIZ_PACKS.find(pack => pack.id === "stocks-101")!;
const stockTrack = TRACKS.find(track => track.id === "stock-essentials")!;
// Independently reviewed answer indexes; expected grades never call the production grader.
const correctAnswers = [1, 2, 0, 1, 3];
const wrongAnswers = correctAnswers.map((answer, index) => (answer + 1) % stockQuiz.questions[index].choices.length);
const unexpectedCalls = new WeakMap<Page, string[]>();
const nav = (page: Page, name: string) => page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("link", { name, exact: true });
function activityStat(page: Page, label: string) {
  const activity = page.getByRole("region", { name: "Your learning activity", exact: true });
  return activity.locator("dl > div").filter({ has: page.locator("dt").filter({ hasText: label }) }).locator("dd");
}
async function noOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
}
async function financialRecords(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const opening = indexedDB.open("vamm-demo-v2", 1);
      opening.onsuccess = () => resolve(opening.result); opening.onerror = () => reject(opening.error);
      opening.onupgradeneeded = () => { opening.transaction?.abort(); reject(new Error("Expected initialized financial storage.")); };
    });
    try {
      const names = ["metadata", "sessions", "turns", "requestOutcomes"];
      const tx = db.transaction(names, "readonly");
      const rows = await Promise.all(names.map(name => new Promise<unknown[]>((resolve, reject) => {
        const request = tx.objectStore(name).getAll(); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
      })));
      return Object.fromEntries(names.map((name, index) => [name, rows[index]]));
    } finally { db.close(); }
  });
}
async function learningRecord(page: Page): Promise<LearningProgress> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const opening = indexedDB.open("vamm-learning-v1", 1);
      opening.onsuccess = () => resolve(opening.result); opening.onerror = () => reject(opening.error);
      opening.onupgradeneeded = () => { opening.transaction?.abort(); reject(new Error("Expected initialized learning storage.")); };
    });
    try {
      return await new Promise<LearningProgress>((resolve, reject) => {
        const read = db.transaction("progress", "readonly").objectStore("progress").get("current");
        read.onsuccess = () => resolve(read.result); read.onerror = () => reject(read.error);
      });
    } finally { db.close(); }
  });
}
async function seedFinancialHistory(page: Page) {
  await page.goto("/simulation");
  await page.getByRole("button", { name: "Start your simulation", exact: true }).click();
  await page.getByRole("button", { name: "Advance one year", exact: true }).click();
  await page.getByLabel("Cash · Rp", { exact: true }).fill("150000");
  await page.getByRole("button", { name: "Confirm funding decision", exact: true }).click();
  await expect.poll(async () => ((await financialRecords(page)).sessions[0] as { session: { version: number } }).session.version).toBe(2);
  const saved = await financialRecords(page);
  expect(saved.sessions[0]).toMatchObject({ session: { balances: { cash: 630000, bonds: 811200, equity: 1123200 }, turnIndex: 1, version: 2 } });
  return saved;
}
async function startStockQuiz(page: Page) {
  await page.goto("/missions");
  await expect(page.getByRole("heading", { level: 1, name: "Missions & Challenges", exact: true })).toBeVisible();
  await expect(page.getByTestId("learning-xp")).toHaveText("0");
  await page.getByRole("link", { name: "Start challenge: " + stockQuiz.title, exact: true }).click();
  await page.getByRole("button", { name: "Start quiz", exact: true }).click();
  await expect(page.locator("fieldset")).toContainText(stockQuiz.questions[0].prompt);
}
async function answerQuestion(page: Page, index: number, answer: number) {
  await expect(page.locator("fieldset")).toContainText(stockQuiz.questions[index].prompt);
  await expect(page.getByRole("radio")).toHaveCount(stockQuiz.questions[index].choices.length);
  await page.getByRole("radio").nth(answer).check();
  await expect(page.getByRole("radio").nth(answer)).toBeChecked();
}
async function finishQuiz(page: Page, answers: number[], startIndex = 0) {
  for (let index = startIndex; index < answers.length; index++) {
    await answerQuestion(page, index, answers[index]);
    if (index < answers.length - 1) await page.getByRole("button", { name: "Next question", exact: true }).click();
  }
  await page.getByRole("button", { name: "Submit answers", exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await installLiveFeatureWidgetStubs(page);
  const calls: string[] = []; unexpectedCalls.set(page, calls);
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    // Optional account projection is an explicit unrelated guest fixture, not a learning/model API.
    if (new URL(route.request().url()).pathname === "/api/account" && route.request().method() === "GET") {
      await route.fulfill({ json: { configured: false, user: null } }); return;
    }
    calls.push(new URL(route.request().url()).pathname); await route.abort("blockedbyclient");
  });
  await page.route(/^https:\/\/(?:api\.openai\.com|generativelanguage\.googleapis\.com)\//, async route => {
    calls.push(new URL(route.request().url()).origin); await route.abort("blockedbyclient");
  });
});
test.afterEach(async ({ page }) => { expect(unexpectedCalls.get(page), "Authored learning must not invoke any API or model provider.").toEqual([]); });

test("Academy order, completion and milestone rewards persist without changing financial history", async ({ page }) => {
  const financial = await seedFinancialHistory(page);
  await nav(page, "Learning Academy").click();
  await expect(page.getByRole("heading", { level: 1, name: "Learning Academy", exact: true })).toBeVisible();
  await expect(page.getByTestId("learning-academy-points")).toHaveText("0");
  const search = page.getByLabel("Search lessons", { exact: true });
  await search.fill("zz-no-matching-lesson");
  await expect(page.getByText("No lessons match your search.", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Start course:/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Clear lesson search", exact: true }).click();
  await expect(search).toHaveValue("");
  await expect(page.getByRole("link", { name: /^Start course:/ })).toHaveCount(4);
  const glossary = page.locator("section").filter({ has: page.getByRole("heading", { name: "Quick glossary", exact: true }) });
  await glossary.locator("summary").filter({ hasText: GLOSSARY[0].term }).click();
  await expect(glossary).toContainText(GLOSSARY[0].definition);
  await page.getByRole("link", { name: "Start course: " + stockTrack.title, exact: true }).click();
  const courseLessons = page.getByRole("list", { name: "Course lessons", exact: true });
  await expect(courseLessons.getByRole("button")).toHaveCount(2);
  await expect(courseLessons.getByRole("button").first()).toBeDisabled();
  await expect(courseLessons.getByRole("button").last()).toBeDisabled();
  const next = page.getByRole("link", { name: "Next lesson", exact: true });
  if (await next.count()) await expect(next).toHaveAttribute("aria-disabled", "true");
  await page.getByRole("button", { name: "Mark lesson complete", exact: true }).click();
  await expect.poll(async () => (await learningRecord(page)).completedLessonIds).toEqual(["stocks"]);
  await expect(page.getByTestId("learning-academy-points")).toHaveText("10");
  await expect(page.getByTestId("learning-xp")).toHaveText("0");
  await next.click();
  await page.getByRole("button", { name: "Mark lesson complete", exact: true }).click();
  await expect.poll(async () => (await learningRecord(page)).completedLessonIds).toEqual(["stocks", "prices"]);
  await expect(page.getByTestId("learning-academy-points")).toHaveText("20");
  await expect(page.getByTestId("learning-xp")).toHaveText("20");
  const learning = await learningRecord(page);
  await page.reload();
  await expect(page.getByTestId("learning-academy-points")).toHaveText("20");
  await expect(page.getByTestId("learning-xp")).toHaveText("20");
  expect(await learningRecord(page)).toEqual(learning);
  await nav(page, "Home").click();
  await expect(activityStat(page, "Academy points")).toHaveText("20");
  await expect(activityStat(page, "Learning XP")).toHaveText("20 XP");
  await page.getByRole("link", { name: "View learning profile", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Learning Profile", exact: true })).toBeVisible();
  await expect(activityStat(page, "Lessons completed")).toHaveText("2 / 10");
  await expect(activityStat(page, "Academy points")).toHaveText("20");
  await expect(activityStat(page, "Learning XP")).toHaveText("20 XP");
  const milestone = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: ACADEMY_MILESTONES[0].title, exact: true }) });
  await expect(milestone.getByText("Earned", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: getLesson("stocks")!.title, exact: true })).toBeVisible();
  expect(await learningRecord(page)).toEqual(learning);
  expect(await financialRecords(page)).toEqual(financial);
  await noOverflow(page);
});

test("reviewed quiz saves and resumes editable answers, grades wrong/correct attempts and awards first-pass XP once", async ({ page }) => {
  test.setTimeout(90000);
  const financial = await seedFinancialHistory(page);
  await startStockQuiz(page);
  await answerQuestion(page, 0, correctAnswers[0]);
  await answerQuestion(page, 0, wrongAnswers[0]);
  await page.getByRole("button", { name: "Next question", exact: true }).click();
  await answerQuestion(page, 1, wrongAnswers[1]);
  await page.getByRole("button", { name: "Previous question", exact: true }).click();
  await expect(page.getByRole("radio").nth(wrongAnswers[0])).toBeChecked();
  await page.getByRole("button", { name: "Next question", exact: true }).click();
  await expect(page.getByRole("radio").nth(wrongAnswers[1])).toBeChecked();
  await page.getByRole("button", { name: "Next question", exact: true }).click();
  await page.getByRole("button", { name: "Exit quiz", exact: true }).click();
  const exit = page.getByRole("dialog");
  await expect(exit).toBeVisible();
  await exit.getByRole("button", { name: "Save and exit", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Quiz Center", exact: true })).toBeVisible();
  const draft = (await learningRecord(page)).attempts.at(-1)!;
  expect(draft).toMatchObject({ quizId: "stocks-101", status: "draft", activeIndex: 2 });
  expect(draft.answers).toEqual([wrongAnswers[0], wrongAnswers[1], null, null, null]);
  await page.reload();
  await page.getByRole("link", { name: "Continue quiz: " + stockQuiz.title, exact: true }).click();
  await finishQuiz(page, wrongAnswers, 2);
  const result = page.locator('[data-quiz-stage="result"]');
  await expect(result.getByRole("heading", { name: "Keep practicing", exact: true })).toBeVisible();
  await expect(page.getByTestId("quiz-score")).toHaveText("0/100");
  for (const question of stockQuiz.questions) await expect(result.getByText(question.why, { exact: true })).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(0);
  await result.getByRole("link", { name: "Back to Quiz Center", exact: true }).click();
  await expect(page.getByTestId("learning-xp")).toHaveText("0");
  const beforeReview = await learningRecord(page);
  await page.getByRole("link", { name: "Review answers: " + stockQuiz.title, exact: true }).click();
  await expect(page.getByTestId("quiz-score")).toHaveText("0/100");
  expect(await learningRecord(page)).toEqual(beforeReview);
  await result.getByRole("button", { name: "Try again", exact: true }).click();
  await finishQuiz(page, correctAnswers);
  await expect(result.getByRole("heading", { name: "Learning target met", exact: true })).toBeVisible();
  await expect(page.getByTestId("quiz-score")).toHaveText("100/100");
  await expect(result.getByText("+100 XP earned on this attempt.", { exact: true })).toBeVisible();
  await result.getByRole("button", { name: "Try again", exact: true }).click();
  await finishQuiz(page, correctAnswers);
  await expect(page.getByTestId("quiz-score")).toHaveText("100/100");
  await expect(result).toContainText("Retrying earns no duplicate reward.");
  const progress = await learningRecord(page);
  expect(progress.attempts).toHaveLength(3);
  expect(progress.attempts.every(attempt => attempt.status === "submitted")).toBe(true);
  await result.getByRole("link", { name: "Back to Quiz Center", exact: true }).click();
  await expect(page.getByTestId("learning-xp")).toHaveText("100");
  await page.reload();
  await expect(page.getByTestId("learning-xp")).toHaveText("100");
  await page.goto("/profile");
  await expect(activityStat(page, "Learning XP")).toHaveText("100 XP");
  const quizRecord = page.getByRole("listitem").filter({ has: page.getByRole("link", { name: stockQuiz.title, exact: true }) });
  await expect(quizRecord).toContainText("3 submitted attempts");
  await expect(quizRecord).toContainText("Latest 100% · Best 100%");
  expect(await financialRecords(page)).toEqual(financial);
  await noOverflow(page);
});

test("corrupt learning state stays visible and retained while the existing financial session remains usable", async ({ page }) => {
  const financial = await seedFinancialHistory(page);
  await page.goto("/academy");
  await page.getByRole("link", { name: "Start course: " + stockTrack.title, exact: true }).click();
  await page.getByRole("button", { name: "Mark lesson complete", exact: true }).click();
  await expect.poll(async () => (await learningRecord(page)).completedLessonIds).toEqual(["stocks"]);
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const opening = indexedDB.open("vamm-learning-v1", 1); opening.onsuccess = () => resolve(opening.result); opening.onerror = () => reject(opening.error);
    });
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("progress", "readwrite"); const store = tx.objectStore("progress");
        const read = store.get("current"); read.onsuccess = () => store.put({ ...read.result, schemaVersion: 999 }, "current");
        tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
  });
  await page.reload();
  await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(/learning|saved|storage|progress/i);
  await expect(page.getByTestId("learning-academy-points")).toHaveText("—");
  const complete = page.getByRole("button", { name: "Mark lesson complete", exact: true });
  await expect(complete).toHaveAttribute("aria-disabled", "true");
  expect((await learningRecord(page)).schemaVersion).toBe(999);
  expect(await financialRecords(page)).toEqual(financial);
  await nav(page, "Simulation").click();
  await expect(page.getByText("Age 16 · Turn 1 of 3", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Advance one year", exact: true })).toBeEnabled();
  expect(await financialRecords(page)).toEqual(financial);
});

test("authored learning is keyboard accessible, respects reduced motion and keeps provider credentials out of browser assets", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const jobs: Promise<void>[] = [];
  const markers = new Set<string>(); let scanned = 0;
  page.on("response", response => {
    const url = new URL(response.url());
    if (url.origin !== "http://127.0.0.1:3000" || response.request().resourceType() !== "script") return;
    jobs.push(response.text().then(body => {
      scanned++;
      // Report marker categories only: never credentials, headers, source bodies or .env files.
      if (/\b(?:OPENAI_API_KEY|GEMINI_API_KEY)\b/.test(body)) markers.add("server-only provider configuration");
      if (/sk-(?:proj|svcacct)-[A-Za-z0-9_-]{12,}/.test(body)) markers.add("OpenAI credential marker");
      if (/AIza[0-9A-Za-z_-]{25,}/.test(body)) markers.add("Google credential marker");
    }));
  });
  await page.goto("/academy");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await expect(page.getByRole("switch", { name: "Static motion", exact: true })).toHaveCount(0);
  await expect(page.locator("[data-motion-scope]")).toHaveAttribute("data-motion-os-reduced", "true");
  await expect(page.locator("[data-motion-scope]")).toHaveAttribute("data-motion-static", "true");
  await noOverflow(page);
  await nav(page, "Missions & Challenges").click();
  await expect(page.getByRole("heading", { name: "Quiz Center", exact: true })).toBeVisible();
  await noOverflow(page);
  await page.waitForLoadState("networkidle"); await Promise.all(jobs);
  expect(scanned).toBeGreaterThan(0);
  expect([...markers], "Learning browser assets must not contain provider credentials/configuration.").toEqual([]);
});



async function savedMentorRecords(page: Page): Promise<SavedMentorAnswer[]> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const opening = indexedDB.open("vamm-mentor-history-v1", 1);
      opening.onsuccess = () => resolve(opening.result); opening.onerror = () => reject(opening.error);
      opening.onupgradeneeded = () => { opening.transaction?.abort(); reject(new Error("Expected initialized saved-research storage.")); };
    });
    try {
      return await new Promise<SavedMentorAnswer[]>((resolve, reject) => {
        const request = db.transaction("answers", "readonly").objectStore("answers").getAll();
        request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
      });
    } finally { db.close(); }
  });
}

test("a failed learning write preserves choices and financial records, then explicit retry earns points once", async ({ page }) => {
  const financial = await seedFinancialHistory(page);
  await page.addInitScript(() => {
    const originalPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function(value: unknown, key?: IDBValidKey) {
      const state = window as Window & { __failLearningWriteOnce?: boolean };
      if (this.transaction.db.name === "vamm-learning-v1" && state.__failLearningWriteOnce) {
        state.__failLearningWriteOnce = false;
        throw new DOMException("Explicit learning write failure fixture.", "QuotaExceededError");
      }
      return key === undefined ? originalPut.call(this, value) : originalPut.call(this, value, key);
    };
  });
  await page.goto("/academy");
  await expect(page.getByTestId("learning-academy-points")).toHaveText("0");
  await page.getByRole("link", { name: "Start course: " + stockTrack.title, exact: true }).click();
  await page.evaluate(() => { (window as Window & { __failLearningWriteOnce?: boolean }).__failLearningWriteOnce = true; });
  await page.getByRole("button", { name: "Mark lesson complete", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
  await expect(page.getByTestId("learning-academy-points")).toHaveText("0");
  expect(await financialRecords(page)).toEqual(financial);
  const retry = page.getByRole("button", { name: "Retry saved learning action", exact: true });
  await retry.focus(); await retry.press("Enter");
  await expect(page.getByTestId("learning-academy-points")).toHaveText("10");
  await expect(page.getByRole("button", { name: "Refresh learning progress", exact: true })).toBeFocused();
  expect((await learningRecord(page)).completedLessonIds).toEqual(["stocks"]);
  expect(await financialRecords(page)).toEqual(financial);
});

test("earlier basket answers remain readable after reload without model calls or financial changes", async ({ page }) => {
  const financial = await seedFinancialHistory(page);
  const question = "Explain synthetic basket fees.";
  let posts = 0;
  await page.route("**/api/mentor-chat", route => { if (route.request().method() === "POST") posts++; return route.fulfill({ json: { configured: false } }); });
  await page.route("**/api/research", route => { posts++; return route.abort(); });
  const market = getMarketData();
  const entry: SavedMentorAnswer = { id: "10000000-0000-4000-8000-000000000002", question, instrumentIds: ["edu-bonds", "edu-equity"], createdAt: "2026-11-07T00:00:00Z", response: {
    summary: "Explicit preserved-history browser fixture; no model call.", facts: [{ text: "Annual fees are not modeled.", evidenceIds: ["ev-demo-method"] }],
    limitations: ["Synthetic snapshot, not a live forecast."], evidence: market.evidence.filter(item => item.id === "ev-demo-method"), origin: "prewritten"
  } };
  await seedLegacyAnswer(page, entry);
  await page.goto("/research");
  await page.getByRole("button", { name: "Earlier basket answers", exact: true }).click();
  await page.getByRole("button", { name: "Open earlier answer: " + question, exact: true }).click();
  await expect(page.getByText(entry.response.summary, { exact: true })).toBeVisible();
  await expect(page.getByText(entry.response.limitations[0], { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete saved answer", exact: true })).toHaveCount(0);
  expect(await savedMentorRecords(page)).toEqual([entry]);
  await page.reload();
  await page.getByRole("button", { name: "Earlier basket answers", exact: true }).click();
  await page.getByRole("button", { name: "Open earlier answer: " + question, exact: true }).click();
  await expect(page.getByText(entry.response.summary, { exact: true })).toBeVisible();
  expect(await savedMentorRecords(page)).toEqual([entry]);
  expect(await financialRecords(page)).toEqual(financial);
  expect(posts).toBe(0); await noOverflow(page);
});
