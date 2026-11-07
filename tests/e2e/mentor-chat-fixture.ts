import { expect, type Page } from "@playwright/test";
import type { SavedMentorAnswer } from "../../src/lib/learning/mentor-history";

// Explicit fixtures prove browser behavior; they never represent real model/vision success.
export const CHAT_REPLY = "Browser test fixture: the screenshot is a snapshot, not a live feed. A breakout and a rejection are conditional scenarios, not predictions.";
export const PNG_FIXTURE = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a1ioAAAAASUVORK5CYII=", "base64");
export async function installMentorFixture(page: Page, reply = CHAT_REPLY) {
  const calls: unknown[] = [];
  await page.route("**/api/mentor-chat", route => {
    if (route.request().method() === "GET") return route.fulfill({ json: { configured: true } });
    calls.push(route.request().postDataJSON());
    return route.fulfill({ json: { ok: true, data: { content: reply, origin: "model" } } });
  });
  return calls;
}
export async function sendMentorMessage(page: Page, content: string) {
  await page.getByLabel("Message your mentor", { exact: true }).fill(content);
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.getByRole("button", { name: "New chat", exact: true })).toBeEnabled();
}
export async function seedLegacyAnswer(page: Page, entry: SavedMentorAnswer) {
  await page.evaluate(async value => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open("vamm-mentor-history-v1", 1);
      open.onupgradeneeded = () => open.result.createObjectStore("answers", { keyPath: "id" });
      open.onsuccess = () => resolve(open.result); open.onerror = () => reject(open.error);
    });
    try { await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("answers", "readwrite"); tx.objectStore("answers").put(value);
      tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error);
    }); } finally { db.close(); }
  }, entry);
}
export async function chatRecords(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open("vamm-mentor-chat-v1", 1);
      open.onupgradeneeded = () => { open.transaction?.abort(); reject(new Error("Expected chat history")); };
      open.onsuccess = () => resolve(open.result); open.onerror = () => reject(open.error);
    });
    try { return await new Promise<{ id: string; title: string; revision: number; messages: { role: string; content: string; image?: { dataUrl: string } }[] }[]>((resolve, reject) => {
      const read = db.transaction("sessions", "readonly").objectStore("sessions").getAll();
      read.onsuccess = () => resolve(read.result); read.onerror = () => reject(read.error);
    }); } finally { db.close(); }
  });
}
