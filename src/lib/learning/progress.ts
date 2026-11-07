import type { ErrorCode, Result } from "@/contracts";
import { z } from "zod";
import { ACADEMY_MILESTONES, getLesson, getQuizPack, isLessonAvailable, LESSON_POINTS, QUIZ_PACKS, QUIZ_PASS_XP } from "./catalog";
import { LEARNING_CATALOG_VERSION, LEARNING_DATABASE_NAME, LEARNING_RECORD_KEY, LEARNING_SCHEMA_VERSION, LEARNING_STORE_NAME, MAX_LEARNING_ATTEMPTS } from "./types";
import type { CompleteLessonRequest, LearningAttempt, LearningMutationResult, LearningProgress, LearningSummary, QuizAttemptResult, QuizGrade, QuizId, QuizSubmissionResult, SaveQuizDraftRequest, StartQuizRequest, SubmitQuizRequest } from "./types";

const revision = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const quizId = z.enum(["stocks-101", "risk-and-return", "facts-and-news"]);
const lessonId = z.enum(["stocks", "prices", "returns", "risk", "diversification", "fundamentals", "technical", "compounding", "inflation", "costs"]);
const answers = z.array(z.number().int().min(0).max(3).nullable()).length(5);
const attemptSchema = z.object({
  id: z.string().uuid(), quizId, questionIds: z.array(z.string().min(1).max(64)).length(5),
  answers, activeIndex: z.number().int().min(0).max(4), status: z.enum(["draft", "abandoned", "submitted"]),
  startedRevision: revision, submittedRevision: revision.nullable(),
}).strict();
const progressSchema = z.object({
  schemaVersion: z.literal(LEARNING_SCHEMA_VERSION), catalogVersion: z.literal(LEARNING_CATALOG_VERSION),
  revision, completedLessonIds: z.array(lessonId).max(10), attempts: z.array(attemptSchema).max(MAX_LEARNING_ATTEMPTS),
  activeAttemptIds: z.object({ "stocks-101": z.string().uuid().nullable(), "risk-and-return": z.string().uuid().nullable(), "facts-and-news": z.string().uuid().nullable() }).strict(),
}).strict();
const completeSchema = z.object({ lessonId, expectedRevision: revision }).strict();
const startSchema = z.object({ quizId, requestId: z.string().uuid(), expectedRevision: revision }).strict();
const draftSchema = z.object({ quizId, attemptId: z.string().uuid(), answers, activeIndex: z.number().int().min(0).max(4), expectedRevision: revision }).strict();
const submitSchema = z.object({ quizId, attemptId: z.string().uuid(), answers: z.array(z.number().int().min(0).max(3)).length(5), expectedRevision: revision }).strict();

class LearningFault extends Error {
  constructor(readonly code: ErrorCode, message: string, readonly retryable = false) { super(message); }
}
function invalid(message = "Check the learning request and try again."): never { throw new LearningFault("INVALID_INPUT", message); }
function corrupt(): never { throw new LearningFault("STORAGE_UNAVAILABLE", "Saved learning progress is invalid. It has not been reset or overwritten."); }
function errorResult<T>(error: unknown): Result<T> {
  const fault = error instanceof LearningFault ? error : new LearningFault("STORAGE_UNAVAILABLE", "Learning progress could not be read or saved. Your saved progress has not been reset.", true);
  return { ok: false, error: { code: fault.code, message: fault.message, retryable: fault.retryable, requestId: null } };
}
function emptyProgress(): LearningProgress {
  return { schemaVersion: LEARNING_SCHEMA_VERSION, catalogVersion: LEARNING_CATALOG_VERSION, revision: 0, completedLessonIds: [], attempts: [], activeAttemptIds: { "stocks-101": null, "risk-and-return": null, "facts-and-news": null } };
}
function validAnswers(id: string, values: readonly (number | null)[], complete: boolean): boolean {
  const pack = getQuizPack(id);
  return Boolean(pack && values.length === pack.questions.length && values.every((value, index) =>
    value === null ? !complete : Number.isInteger(value) && value >= 0 && value < pack.questions[index].choices.length));
}
function grade(id: string, values: readonly (number | null)[]): QuizGrade {
  const pack = getQuizPack(id);
  if (!pack || !validAnswers(id, values, true)) invalid("Answer all five questions with a valid choice before submitting.");
  const correct = pack.questions.filter((question, index) => question.answer === values[index]).length;
  const total = pack.questions.length;
  return { correct, total, score: Math.round(correct * 100 / total), passed: correct * 5 >= total * 4 };
}
export function gradeAttempt(id: string, values: unknown): Result<QuizGrade> {
  try {
    if (!Array.isArray(values) || values.some(value => typeof value !== "number")) invalid();
    return { ok: true, data: grade(id, values as number[]) };
  } catch (error) { return errorResult(error); }
}

/** Validate stored identifiers, answer bounds and event order before deriving any reward. */
function validateProgress(raw: unknown): LearningProgress {
  const parsed = progressSchema.safeParse(raw);
  if (!parsed.success) corrupt();
  const state = parsed.data;
  if (new Set(state.completedLessonIds).size !== state.completedLessonIds.length ||
      state.completedLessonIds.some(id => !isLessonAvailable(id, state.completedLessonIds))) corrupt();
  const ids = new Set<string>();
  const eventRevisions = new Set<number>();
  let lastStart = 0;
  for (const attempt of state.attempts) {
    const pack = getQuizPack(attempt.quizId)!;
    if (ids.has(attempt.id) || attempt.startedRevision <= lastStart || attempt.startedRevision > state.revision ||
        eventRevisions.has(attempt.startedRevision) ||
        attempt.questionIds.some((id, index) => id !== pack.questions[index].id) ||
        !validAnswers(attempt.quizId, attempt.answers, attempt.status === "submitted")) corrupt();
    ids.add(attempt.id);
    eventRevisions.add(attempt.startedRevision);
    lastStart = attempt.startedRevision;
    if (attempt.status === "submitted") {
      if (attempt.submittedRevision === null || attempt.submittedRevision <= attempt.startedRevision ||
          attempt.submittedRevision > state.revision || eventRevisions.has(attempt.submittedRevision)) corrupt();
      eventRevisions.add(attempt.submittedRevision);
    } else if (attempt.submittedRevision !== null) corrupt();
  }
  for (const pack of QUIZ_PACKS) {
    const started = state.attempts.filter(attempt => attempt.quizId === pack.id);
    const latest = started.at(-1);
    if ((latest?.id ?? null) !== state.activeAttemptIds[pack.id]) corrupt();
    for (const [index, attempt] of started.entries()) {
      const next = started[index + 1];
      if (attempt.status === "draft" && attempt.id !== latest?.id) corrupt();
      if (attempt.status === "abandoned" && attempt.id === latest?.id) corrupt();
      if (next && attempt.submittedRevision !== null && attempt.submittedRevision >= next.startedRevision) corrupt();
    }
  }
  const minimumRevision = state.completedLessonIds.length + state.attempts.length + state.attempts.filter(item => item.status === "submitted").length;
  if (state.revision < minimumRevision || (minimumRevision === 0 && state.revision !== 0)) corrupt();
  return state;
}

export function getLearningSummary(progress: LearningProgress): LearningSummary {
  const state = validateProgress(progress);
  const quizzes = {} as LearningSummary["quizzes"];
  let quizXp = 0;
  for (const pack of QUIZ_PACKS) {
    const attempts = state.attempts.filter(item => item.quizId === pack.id && item.status === "submitted")
      .sort((a, b) => a.submittedRevision! - b.submittedRevision!);
    let rewardEarned = false;
    const results: QuizAttemptResult[] = attempts.map(item => {
      const result = grade(pack.id, item.answers);
      const awardedXp = result.passed && !rewardEarned ? QUIZ_PASS_XP : 0;
      rewardEarned ||= result.passed;
      return { ...result, attemptId: item.id, quizId: pack.id, answers: item.answers as number[], awardedXp };
    });
    const active = state.attempts.find(item => item.id === state.activeAttemptIds[pack.id]);
    quizzes[pack.id] = { draft: active?.status === "draft" ? active : null, last: results.at(-1) ?? null,
      bestScore: Math.max(0, ...results.map(item => item.score)), attemptCount: results.length, rewardEarned };
    if (rewardEarned) quizXp += QUIZ_PASS_XP;
  }
  const academyPoints = state.completedLessonIds.length * LESSON_POINTS;
  const milestones = ACADEMY_MILESTONES.map(item => ({ ...item, earned: academyPoints >= item.points }));
  return { completedLessons: state.completedLessonIds.length, academyPoints,
    xp: quizXp + milestones.filter(item => item.earned).reduce((sum, item) => sum + item.xp, 0), milestones, quizzes };
}

function request<T>(operation: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => { operation.onsuccess = () => resolve(operation.result); operation.onerror = () => reject(operation.error); });
}
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new LearningFault("STORAGE_UNAVAILABLE", "Learning storage is unavailable in this browser.", true)); return; }
    let finished = false;
    const opening = globalThis.indexedDB.open(LEARNING_DATABASE_NAME, 1);
    const timer = setTimeout(fail, 2500);
    function fail() {
      if (finished) return;
      finished = true; clearTimeout(timer);
      reject(new LearningFault("STORAGE_UNAVAILABLE", "Learning storage could not be opened. Close other learning tabs and retry.", true));
    }
    opening.onerror = fail; opening.onblocked = fail;
    opening.onupgradeneeded = () => { opening.result.createObjectStore(LEARNING_STORE_NAME); };
    opening.onsuccess = () => {
      const db = opening.result;
      if (finished) { db.close(); return; }
      finished = true; clearTimeout(timer);
      try {
        if (db.objectStoreNames.length !== 1 || !db.objectStoreNames.contains(LEARNING_STORE_NAME) ||
            db.transaction(LEARNING_STORE_NAME, "readonly").objectStore(LEARNING_STORE_NAME).keyPath !== null) corrupt();
        db.onversionchange = () => db.close();
        resolve(db);
      } catch (error) { db.close(); reject(error); }
    };
  });
}
async function storageOperation<T>(mode: IDBTransactionMode, work: (state: LearningProgress) => { data: T; next?: LearningProgress }): Promise<Result<T>> {
  let db: IDBDatabase | undefined;
  try {
    db = await openDatabase();
    const tx = db.transaction(LEARNING_STORE_NAME, mode);
    const done = new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error ?? new Error("Learning transaction aborted."));
      tx.onerror = () => { /* onabort reports the final failure. */ };
    });
    void done.catch(() => undefined);
    try {
      const store = tx.objectStore(LEARNING_STORE_NAME);
      const count = await request(store.count());
      const raw = await request(store.get(LEARNING_RECORD_KEY));
      if (count > 1 || (raw === undefined && count !== 0)) corrupt();
      const state = raw === undefined ? emptyProgress() : validateProgress(raw);
      const result = work(state);
      if (result.next) await request(store.put(validateProgress(result.next), LEARNING_RECORD_KEY));
      await done;
      return { ok: true, data: result.data };
    } catch (error) {
      try { tx.abort(); } catch { /* Already completed or aborted. */ }
      await done.catch(() => undefined);
      throw error;
    }
  } catch (error) { return errorResult(error); }
  finally { db?.close(); }
}
function checkRevision(state: LearningProgress, expectedRevision: number): number {
  if (state.revision !== expectedRevision) throw new LearningFault("STATE_CONFLICT", "Learning progress changed in another view. Reload saved progress and review your unsaved input before trying again.");
  if (state.revision === Number.MAX_SAFE_INTEGER) invalid("Learning progress has reached its supported revision limit. Existing records have not been deleted.");
  return state.revision + 1;
}
function parsedRequest<T>(schema: z.ZodType<T>, raw: unknown): T {
  const parsed = schema.safeParse(raw); if (!parsed.success) invalid(); return parsed.data;
}
function matchingAttempt(state: LearningProgress, id: string, packId: QuizId): LearningAttempt {
  const attempt = state.attempts.find(item => item.id === id);
  if (!attempt) throw new LearningFault("NOT_FOUND", "This learning attempt was not found. Reload saved progress.");
  if (attempt.quizId !== packId) throw new LearningFault("IDEMPOTENCY_CONFLICT", "This attempt identifier already belongs to a different quiz.");
  return attempt;
}
function activeDraft(state: LearningProgress, attempt: LearningAttempt): void {
  if (state.activeAttemptIds[attempt.quizId] !== attempt.id || attempt.status !== "draft")
    throw new LearningFault("STATE_CONFLICT", "This draft is no longer active. Reload saved progress before continuing.");
}

export function readLearningProgress(): Promise<Result<LearningProgress>> {
  return storageOperation<LearningProgress>("readonly", state => ({ data: state }));
}
export function completeLesson(raw: CompleteLessonRequest): Promise<Result<LearningMutationResult>> {
  return storageOperation<LearningMutationResult>("readwrite", state => {
    const input = parsedRequest(completeSchema, raw);
    if (state.completedLessonIds.includes(input.lessonId)) return { data: { progress: state, replayed: true } };
    const nextRevision = checkRevision(state, input.expectedRevision);
    if (!getLesson(input.lessonId) || !isLessonAvailable(input.lessonId, state.completedLessonIds)) invalid("Complete the earlier lessons in this course first.");
    const next = { ...state, revision: nextRevision, completedLessonIds: [...state.completedLessonIds, input.lessonId] };
    return { data: { progress: next, replayed: false }, next };
  });
}
export function startQuizAttempt(raw: StartQuizRequest): Promise<Result<LearningMutationResult>> {
  return storageOperation<LearningMutationResult>("readwrite", state => {
    const input = parsedRequest(startSchema, raw);
    const existing = state.attempts.find(item => item.id === input.requestId);
    if (existing) { matchingAttempt(state, input.requestId, input.quizId); return { data: { progress: state, replayed: true } }; }
    const nextRevision = checkRevision(state, input.expectedRevision);
    if (state.attempts.length >= MAX_LEARNING_ATTEMPTS) invalid("Learning history is full (1,000 started attempts). Existing attempts and rewards have not been deleted.");
    const pack = getQuizPack(input.quizId)!;
    const attempts: LearningAttempt[] = state.attempts.map(item => item.quizId === input.quizId && item.status === "draft" ? { ...item, status: "abandoned" } : item);
    attempts.push({ id: input.requestId, quizId: input.quizId, questionIds: pack.questions.map(item => item.id), answers: Array(5).fill(null), activeIndex: 0,
      status: "draft", startedRevision: nextRevision, submittedRevision: null });
    const next = { ...state, revision: nextRevision, attempts, activeAttemptIds: { ...state.activeAttemptIds, [input.quizId]: input.requestId } };
    return { data: { progress: next, replayed: false }, next };
  });
}
export function saveQuizDraft(raw: SaveQuizDraftRequest): Promise<Result<LearningMutationResult>> {
  return storageOperation<LearningMutationResult>("readwrite", state => {
    const input = parsedRequest(draftSchema, raw);
    const attempt = matchingAttempt(state, input.attemptId, input.quizId);
    activeDraft(state, attempt);
    if (!validAnswers(input.quizId, input.answers, false)) invalid();
    if (JSON.stringify(attempt.answers) === JSON.stringify(input.answers) && attempt.activeIndex === input.activeIndex)
      return { data: { progress: state, replayed: true } };
    const nextRevision = checkRevision(state, input.expectedRevision);
    const next = { ...state, revision: nextRevision, attempts: state.attempts.map(item => item.id === attempt.id ? { ...item, answers: [...input.answers], activeIndex: input.activeIndex } : item) };
    return { data: { progress: next, replayed: false }, next };
  });
}
export function submitQuizAttempt(raw: SubmitQuizRequest): Promise<Result<QuizSubmissionResult>> {
  return storageOperation<QuizSubmissionResult>("readwrite", state => {
    const input = parsedRequest(submitSchema, raw);
    const attempt = matchingAttempt(state, input.attemptId, input.quizId);
    grade(input.quizId, input.answers);
    if (attempt.status === "submitted") {
      if (JSON.stringify(attempt.answers) !== JSON.stringify(input.answers)) throw new LearningFault("IDEMPOTENCY_CONFLICT", "This submitted attempt cannot be changed. Start another attempt to practice again.");
      const result = resultForAttempt(state, input.quizId, attempt.id);
      return { data: { progress: state, replayed: true, result } };
    }
    const nextRevision = checkRevision(state, input.expectedRevision);
    activeDraft(state, attempt);
    const next: LearningProgress = { ...state, revision: nextRevision, attempts: state.attempts.map(item => item.id === attempt.id ?
      { ...item, answers: [...input.answers], status: "submitted", submittedRevision: nextRevision } : item) };
    const result = resultForAttempt(next, input.quizId, attempt.id);
    return { data: { progress: next, replayed: false, result }, next };
  });
}
function resultForAttempt(state: LearningProgress, id: QuizId, attemptId: string): QuizAttemptResult {
  const submitted = state.attempts.filter(item => item.quizId === id && item.status === "submitted").sort((a, b) => a.submittedRevision! - b.submittedRevision!);
  let passedBefore = false;
  for (const attempt of submitted) {
    const result = grade(id, attempt.answers);
    if (attempt.id === attemptId) return { ...result, attemptId, quizId: id, answers: attempt.answers as number[], awardedXp: result.passed && !passedBefore ? QUIZ_PASS_XP : 0 };
    passedBefore ||= result.passed;
  }
  corrupt();
}
