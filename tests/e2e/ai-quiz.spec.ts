import { expect, test } from "@playwright/test";
const questions = [
  { id: "q1", question: "What does diversification do?", choices: ["Spreads exposure", "Guarantees profit", "Removes all risk", "Fixes prices"], correctIndex: 0, explanation: "Different exposures can reduce concentration, but not all risk." },
  { id: "q2", question: "Which statement describes risk?", choices: ["Losses are impossible", "Outcomes are uncertain", "Prices always rise", "Fees do not matter"], correctIndex: 1, explanation: "Outcomes can differ from expectations, including losses." },
  { id: "q3", question: "Why compare fees?", choices: ["They guarantee quality", "They eliminate risk", "They affect net outcomes", "They predict tomorrow"], correctIndex: 2, explanation: "Fees reduce the amount retained by the investor." },
];
test("AI quiz generation is explicit, grades deterministically, and leaves reviewed progress unchanged", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/quiz-generation", route => {
    if (route.request().method() === "GET") return route.fulfill({ json: { configured: true } });
    calls++; expect(route.request().postDataJSON()).toEqual({ topic: "risk" });
    return route.fulfill({ json: { ok: true, data: { topic: "risk", origin: "model", questions } } });
  });
  await page.goto("/missions");
  const panel = page.locator("[data-ai-quiz]");
  await expect(page.getByTestId("learning-xp")).toHaveText("0"); expect(calls).toBe(0);
  await panel.getByRole("combobox", { name: "AI quiz topic", exact: true }).selectOption("risk");
  await panel.getByRole("button", { name: "Generate 3 questions", exact: true }).click();
  await expect(panel.getByRole("form", { name: "AI-generated practice questions", exact: true })).toBeVisible();
  for (const [index, question] of questions.entries()) await panel.getByRole("group").nth(index).getByRole("radio", { name: question.choices[question.correctIndex], exact: true }).check();
  await panel.getByRole("button", { name: "Submit AI answers", exact: true }).click();
  await expect(panel.getByRole("status").filter({ hasText: "Score:" })).toHaveText("Score: 3/3 · 100%");
  for (const question of questions) await expect(panel.getByText(question.explanation, { exact: true })).toBeVisible();
  await panel.getByRole("button", { name: "Try these questions again", exact: true }).click();
  await expect(panel.getByRole("radio", { checked: true })).toHaveCount(0);
  await expect(page.getByTestId("learning-xp")).toHaveText("0"); expect(calls).toBe(1);
  await expect(page.getByRole("heading", { name: "Quiz Center", exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
});
test("rejected model credentials show the cause and reviewed quiz challenges remain available", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/quiz-generation", route => {
    if (route.request().method() === "GET") return route.fulfill({ json: { configured: true } });
    calls++; return route.fulfill({ status: 502, json: { ok: false, error: { code: "MODEL_AUTH_FAILED", message: "Private provider details must not be rendered." } } });
  });
  await page.goto("/missions"); const panel = page.locator("[data-ai-quiz]");
  await panel.getByRole("button", { name: "Generate 3 questions", exact: true }).click();
  await expect(panel.getByRole("alert")).toContainText("credentials were rejected");
  await expect(page.getByText("Private provider details must not be rendered.", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Start challenge: Stock Basics", exact: true })).toBeVisible();
  expect(calls).toBe(1);
});
