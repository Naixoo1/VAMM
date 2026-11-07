import { randomUUID } from "node:crypto";
import { IDBFactory, IDBObjectStore } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Result } from "@/contracts";
import { ACADEMY_MILESTONES, GLOSSARY, isLessonAvailable, LESSONS, QUIZ_PACKS, TRACKS } from "@/lib/learning/catalog";
import { completeLesson, getLearningSummary, gradeAttempt, readLearningProgress, saveQuizDraft, startQuizAttempt, submitQuizAttempt } from "@/lib/learning/progress";
import { LEARNING_DATABASE_NAME, LEARNING_RECORD_KEY, LEARNING_STORE_NAME, MAX_LEARNING_ATTEMPTS } from "@/lib/learning/types";
import type { LearningProgress, SaveQuizDraftRequest } from "@/lib/learning/types";

const correct = [1, 2, 0, 1, 3];
const wrong = [0, 0, 1, 0, 0];
function value<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(result.error.code + ": " + result.error.message);
  return result.data;
}
function request<T>(operation: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => { operation.onsuccess = () => resolve(operation.result); operation.onerror = () => reject(operation.error); });
}
async function stored(edit?: (raw: LearningProgress) => unknown): Promise<LearningProgress | undefined> {
  const opening = indexedDB.open(LEARNING_DATABASE_NAME, 1);
  const db = await request(opening);
  try {
    const tx = db.transaction(LEARNING_STORE_NAME, edit ? "readwrite" : "readonly");
    const done = new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error); });
    const store = tx.objectStore(LEARNING_STORE_NAME);
    const raw = await request(store.get(LEARNING_RECORD_KEY));
    if (edit) await request(store.put(edit(raw), LEARNING_RECORD_KEY));
    await done;
    return raw;
  } finally { db.close(); }
}
async function start(progress?: LearningProgress) {
  const current = progress ?? value(await readLearningProgress());
  const attemptId = randomUUID();
  const result = value(await startQuizAttempt({ quizId: "stocks-101", requestId: attemptId, expectedRevision: current.revision }));
  return { progress: result.progress, attemptId };
}

beforeEach(() => { vi.stubGlobal("indexedDB", new IDBFactory()); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("authored learning catalog and grading", () => {
  it("contains the approved ten lessons, four ordered tracks, three reviewed packs and five terms", () => {
    expect(LESSONS).toHaveLength(10); expect(TRACKS).toHaveLength(4); expect(GLOSSARY).toHaveLength(5);
    expect(TRACKS.flatMap(track => track.lessons)).toEqual(LESSONS.map(lesson => lesson.id));
    expect(QUIZ_PACKS.map(pack => pack.id)).toEqual(["stocks-101", "risk-and-return", "facts-and-news"]);
    for (const pack of QUIZ_PACKS) {
      expect(pack.questions).toHaveLength(5);
      expect(new Set(pack.questions.map(question => question.id)).size).toBe(5);
      for (const question of pack.questions) {
        expect([2, 4]).toContain(question.choices.length);
        expect(question.answer).toBeGreaterThanOrEqual(0); expect(question.answer).toBeLessThan(question.choices.length);
        expect(question.why.length).toBeGreaterThan(0); expect(question.tag.length).toBeGreaterThan(0);
      }
    }
    expect(ACADEMY_MILESTONES.map(item => [item.points, item.xp])).toEqual([[20, 20], [50, 30], [80, 40], [100, 50]]);
    expect(LESSONS.every(lesson => lesson.sources.length > 0 && lesson.sources.every(source => new URL(source.url).protocol === "https:"))).toBe(true);
    expect(JSON.stringify(LESSONS)).not.toMatch(/our simulator generates|buy virtually|generated demo execution/i);
  });

  it.each([
    [correct, 100, true], [[1, 2, 0, 1, 0], 80, true], [[1, 2, 0, 0, 0], 60, false], [wrong, 0, false],
  ])("grades complete answers deterministically with an exact 80 percent pass boundary", (answers, score, passed) => {
    expect(value(gradeAttempt("stocks-101", answers))).toMatchObject({ score, passed, total: 5 });
  });

  it.each([{ answers: [null, 2, 0, 1, 3] }, { answers: [1, 2] }, { answers: [1, 2, 0, 3, 3] }, { answers: [1, 2, 0, 1, Number.NaN] }, { answers: [1, 2, 0, 1, 3.5] }])("rejects incomplete, noninteger or out-of-choice answers", ({ answers }) => {
    expect(gradeAttempt("stocks-101", answers)).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
  });
  it("rejects unknown quiz IDs without inventing a question set", () => {
    expect(gradeAttempt("unknown", correct)).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
  });
});

describe("isolated transactional learning progress", () => {
  it("reads fresh progress without a record write and only opens the learning database", async () => {
    const open = vi.spyOn(indexedDB, "open");
    const progress = value(await readLearningProgress());
    expect(progress).toMatchObject({ revision: 0, attempts: [], completedLessonIds: [] });
    expect(getLearningSummary(progress)).toMatchObject({ xp: 0, academyPoints: 0, completedLessons: 0 });
    expect(await stored()).toBeUndefined();
    expect(open.mock.calls.every(([name]) => name === LEARNING_DATABASE_NAME)).toBe(true);
  });

  it("enforces prerequisites within each track and makes lesson completion idempotent", async () => {
    expect(isLessonAvailable("stocks", [])).toBe(true); expect(isLessonAvailable("risk", [])).toBe(true);
    expect(isLessonAvailable("prices", [])).toBe(false);
    expect(await completeLesson({ lessonId: "prices", expectedRevision: 0 })).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    const first = value(await completeLesson({ lessonId: "stocks", expectedRevision: 0 }));
    expect(getLearningSummary(first.progress).academyPoints).toBe(10);
    const second = value(await completeLesson({ lessonId: "prices", expectedRevision: 1 }));
    const replay = value(await completeLesson({ lessonId: "stocks", expectedRevision: 0 }));
    expect(replay).toEqual({ progress: second.progress, replayed: true });
    expect(getLearningSummary(replay.progress)).toMatchObject({ academyPoints: 20, xp: 20 });
  });

  it("derives all milestone rewards once from unique completed lessons", async () => {
    let progress = value(await readLearningProgress());
    for (const track of TRACKS) for (const lessonId of track.lessons) {
      progress = value(await completeLesson({ lessonId, expectedRevision: progress.revision })).progress;
    }
    expect(getLearningSummary(progress)).toMatchObject({ completedLessons: 10, academyPoints: 100, xp: 140 });
    expect(getLearningSummary(value(await readLearningProgress()))).toEqual(getLearningSummary(progress));
  });

  it("restores saved draft answers and navigation with a fresh read", async () => {
    const { progress, attemptId } = await start();
    const answers = [1, null, 0, null, null];
    const saved = value(await saveQuizDraft({ quizId: "stocks-101", attemptId, expectedRevision: progress.revision, answers, activeIndex: 2 }));
    const restored = value(await readLearningProgress());
    expect(restored).toEqual(saved.progress);
    expect(getLearningSummary(restored).quizzes["stocks-101"].draft).toMatchObject({ id: attemptId, answers, activeIndex: 2 });
    expect(getLearningSummary(restored).xp).toBe(0);
  });

  it("awards first-pass XP once, retains latest/best scores, and replays an old submit after newer attempts", async () => {
    const first = await start();
    const firstResult = value(await submitQuizAttempt({ quizId: "stocks-101", attemptId: first.attemptId, expectedRevision: first.progress.revision, answers: correct }));
    expect(firstResult.result).toMatchObject({ score: 100, passed: true, awardedXp: 100 });
    const second = await start(firstResult.progress);
    const secondResult = value(await submitQuizAttempt({ quizId: "stocks-101", attemptId: second.attemptId, expectedRevision: second.progress.revision, answers: wrong }));
    const replay = value(await submitQuizAttempt({ quizId: "stocks-101", attemptId: first.attemptId, expectedRevision: 1, answers: correct }));
    expect(replay.replayed).toBe(true); expect(replay.progress).toEqual(secondResult.progress); expect(replay.result).toEqual(firstResult.result);
    expect(replay.progress.activeAttemptIds["stocks-101"]).toBe(second.attemptId);
    const third = await start(replay.progress);
    const thirdResult = value(await submitQuizAttempt({ quizId: "stocks-101", attemptId: third.attemptId, expectedRevision: third.progress.revision, answers: correct }));
    expect(thirdResult.result.awardedXp).toBe(0);
    expect(getLearningSummary(thirdResult.progress)).toMatchObject({ xp: 100, quizzes: { "stocks-101": { bestScore: 100, attemptCount: 3, rewardEarned: true } } });
  });

  it("does not award XP for a failed attempt and grants it on the first later pass", async () => {
    const first = await start();
    const failed = value(await submitQuizAttempt({ quizId: "stocks-101", attemptId: first.attemptId, expectedRevision: 1, answers: wrong }));
    expect(failed.result).toMatchObject({ score: 0, passed: false, awardedXp: 0 });
    const next = await start(failed.progress);
    const passed = value(await submitQuizAttempt({ quizId: "stocks-101", attemptId: next.attemptId, expectedRevision: next.progress.revision, answers: [1, 2, 0, 1, 0] }));
    expect(passed.result).toMatchObject({ score: 80, awardedXp: 100 });
  });

  it("replays an older start without replacing a newer active draft", async () => {
    const first = await start(); const second = await start(first.progress);
    const replay = value(await startQuizAttempt({ quizId: "stocks-101", requestId: first.attemptId, expectedRevision: 0 }));
    expect(replay).toEqual({ progress: second.progress, replayed: true });
    expect(replay.progress.attempts[0].status).toBe("abandoned");
    expect(getLearningSummary(replay.progress).quizzes["stocks-101"].draft?.id).toBe(second.attemptId);
    expect(await startQuizAttempt({ quizId: "facts-and-news", requestId: first.attemptId, expectedRevision: 0 })).toMatchObject({ ok: false, error: { code: "IDEMPOTENCY_CONFLICT" } });
  });

  it("refuses changed replay answers and late draft saves after submission", async () => {
    const first = await start();
    const submitted = value(await submitQuizAttempt({ quizId: "stocks-101", attemptId: first.attemptId, expectedRevision: 1, answers: correct }));
    const before = await stored();
    expect(await submitQuizAttempt({ quizId: "stocks-101", attemptId: first.attemptId, expectedRevision: 1, answers: wrong })).toMatchObject({ ok: false, error: { code: "IDEMPOTENCY_CONFLICT" } });
    expect(await saveQuizDraft({ quizId: "stocks-101", attemptId: first.attemptId, expectedRevision: submitted.progress.revision, answers: wrong, activeIndex: 0 })).toMatchObject({ ok: false, error: { code: "STATE_CONFLICT" } });
    expect(await stored()).toEqual(before);
  });

  it("does not let a superseded draft overwrite the current draft", async () => {
    const first = await start(); const second = await start(first.progress);
    expect(await saveQuizDraft({ quizId: "stocks-101", attemptId: first.attemptId, expectedRevision: second.progress.revision, answers: correct, activeIndex: 4 })).toMatchObject({ ok: false, error: { code: "STATE_CONFLICT" } });
    expect(value(await readLearningProgress())).toEqual(second.progress);
  });

  it("serializes concurrent CAS mutations so one stale update cannot replace another", async () => {
    const results = await Promise.all([completeLesson({ lessonId: "stocks", expectedRevision: 0 }), completeLesson({ lessonId: "risk", expectedRevision: 0 })]);
    expect(results.filter(result => result.ok)).toHaveLength(1);
    expect(results.find(result => !result.ok)).toMatchObject({ ok: false, error: { code: "STATE_CONFLICT" } });
    expect(value(await readLearningProgress()).completedLessonIds).toHaveLength(1);
  });

  it("rejects extra fields and out-of-choice draft answers without changing records", async () => {
    const first = await start();
    const before = await stored();
    const draft = { quizId: "stocks-101", attemptId: first.attemptId, expectedRevision: 1, answers: [1, 2, 0, 3, null], activeIndex: 0 };
    expect(await saveQuizDraft(draft)).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    expect(await saveQuizDraft({ ...draft, answers: [1, null, null, null, null], xp: 100000 } as unknown as SaveQuizDraftRequest)).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    expect(await stored()).toEqual(before);
  });

  it.each(["version", "catalog", "question", "answer", "active", "order", "xp"])("reports %s corruption without overwriting or resetting saved bytes", async field => {
    await start();
    await stored(raw => {
      const copy = structuredClone(raw) as unknown as Record<string, unknown>;
      const state = copy as unknown as LearningProgress;
      if (field === "version") copy.schemaVersion = 999;
      if (field === "catalog") copy.catalogVersion = "unknown";
      if (field === "question") state.attempts[0].questionIds[0] = "fabricated-question";
      if (field === "answer") state.attempts[0].answers[3] = 3;
      if (field === "active") state.activeAttemptIds["stocks-101"] = randomUUID();
      if (field === "order") state.attempts[0].startedRevision = 0;
      if (field === "xp") copy.xp = 100000;
      return copy;
    });
    const before = await stored();
    expect(await readLearningProgress()).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE", retryable: false } });
    expect(await completeLesson({ lessonId: "stocks", expectedRevision: 1 })).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE" } });
    expect(await stored()).toEqual(before);
  });

  it("rejects duplicate attempt IDs or conflicting event revisions", async () => {
    const first = await start(); await start(first.progress);
    await stored(raw => ({ ...raw, attempts: raw.attempts.map((attempt, index) => index === 1 ? { ...attempt, id: raw.attempts[0].id } : attempt) }));
    expect(await readLearningProgress()).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE" } });
  });

  it("caps started attempts explicitly without truncating history or blocking old request replay", async () => {
    await readLearningProgress();
    const initial = value(await readLearningProgress());
    const questions = QUIZ_PACKS[0].questions.map(item => item.id);
    const ids = Array.from({ length: MAX_LEARNING_ATTEMPTS }, (_, index) => "00000000-0000-4000-8000-" + String(index).padStart(12, "0"));
    const state: LearningProgress = { ...initial, revision: MAX_LEARNING_ATTEMPTS,
      activeAttemptIds: { ...initial.activeAttemptIds, "stocks-101": ids.at(-1)! },
      attempts: ids.map((id, index) => ({ id, quizId: "stocks-101", questionIds: questions, answers: Array(5).fill(null), activeIndex: 0,
        startedRevision: index + 1, submittedRevision: null, status: index === ids.length - 1 ? "draft" : "abandoned" })) };
    await stored(() => state);
    const before = await stored();
    expect(await startQuizAttempt({ quizId: "stocks-101", requestId: randomUUID(), expectedRevision: state.revision })).toMatchObject({ ok: false, error: { code: "INVALID_INPUT", message: expect.stringContaining("history is full") } });
    expect(value(await startQuizAttempt({ quizId: "stocks-101", requestId: ids[0], expectedRevision: 0 })).replayed).toBe(true);
    expect(await stored()).toEqual(before);
  });

  it("rolls back an aborted storage write and returns an explicit retryable error", async () => {
    const first = await start(); const before = await stored();
    vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(() => { throw new DOMException("Quota exhausted", "QuotaExceededError"); });
    expect(await saveQuizDraft({ quizId: "stocks-101", attemptId: first.attemptId, expectedRevision: 1, answers: correct, activeIndex: 4 })).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE", retryable: true } });
    vi.restoreAllMocks(); expect(await stored()).toEqual(before);
  });

  it("resolves an unavailable IndexedDB as a visible Result error without fallback", async () => {
    vi.stubGlobal("indexedDB", undefined);
    await expect(readLearningProgress()).resolves.toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE", retryable: true } });
  });

  it("settles a blocked database open without waiting indefinitely", async () => {
    vi.spyOn(indexedDB, "open").mockImplementation(() => {
      const opening = {} as IDBOpenDBRequest;
      queueMicrotask(() => opening.onblocked?.call(opening, new Event("blocked") as IDBVersionChangeEvent));
      return opening;
    });
    await expect(readLearningProgress()).resolves.toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE", retryable: true } });
  });
});
