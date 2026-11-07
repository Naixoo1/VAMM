import type { Result } from "@/contracts";

export const LEARNING_CATALOG_VERSION = "vamm-learning-2026-11-07.v1" as const;
export const LEARNING_SCHEMA_VERSION = 1 as const;
export const LEARNING_DATABASE_NAME = "vamm-learning-v1";
export const LEARNING_STORE_NAME = "progress";
export const LEARNING_RECORD_KEY = "current";
export const MAX_LEARNING_ATTEMPTS = 1000;
export type LessonId = "stocks" | "prices" | "returns" | "risk" | "diversification" | "fundamentals" | "technical" | "compounding" | "inflation" | "costs";
export type QuizId = "stocks-101" | "risk-and-return" | "facts-and-news";
export interface LearningSource { title: string; publisher: string; url: string; }
export interface LearningLesson {
  id: LessonId; title: string; description: string; level: "Beginner" | "Intermediate"; minutes: number;
  objectives: readonly string[]; sections: readonly (readonly [string, string])[];
  takeaways: readonly string[]; watchout: string; reflection: { prompt: string; answer: string };
  sources: readonly LearningSource[];
}
export interface LearningTrack { id: string; title: string; description: string; level: string; art: string; lessons: readonly LessonId[]; }
export interface QuizQuestion { id: string; prompt: string; choices: readonly string[]; answer: number; why: string; tag: string; }
export interface QuizPack { id: QuizId; title: string; description: string; icon: string; concepts: readonly string[]; questions: readonly QuizQuestion[]; }
export interface LearningAttempt {
  id: string; quizId: QuizId; questionIds: string[]; answers: (number | null)[]; activeIndex: number;
  status: "draft" | "abandoned" | "submitted"; startedRevision: number; submittedRevision: number | null;
}
export interface LearningProgress {
  schemaVersion: typeof LEARNING_SCHEMA_VERSION; catalogVersion: typeof LEARNING_CATALOG_VERSION;
  revision: number; completedLessonIds: LessonId[]; attempts: LearningAttempt[];
  activeAttemptIds: Record<QuizId, string | null>;
}
export interface QuizGrade { correct: number; total: number; score: number; passed: boolean; }
export interface QuizAttemptResult extends QuizGrade { attemptId: string; quizId: QuizId; answers: number[]; awardedXp: number; }
export interface QuizProgressSummary {
  draft: LearningAttempt | null; last: QuizAttemptResult | null; bestScore: number;
  attemptCount: number; rewardEarned: boolean;
}
export interface LearningSummary {
  completedLessons: number; academyPoints: number; xp: number;
  milestones: { points: number; title: string; xp: number; earned: boolean }[];
  quizzes: Record<QuizId, QuizProgressSummary>;
}
export interface LearningMutationResult { progress: LearningProgress; replayed: boolean; }
export interface QuizSubmissionResult extends LearningMutationResult { result: QuizAttemptResult; }
export interface CompleteLessonRequest { lessonId: string; expectedRevision: number; }
export interface StartQuizRequest { quizId: string; requestId: string; expectedRevision: number; }
export interface SaveQuizDraftRequest { quizId: string; attemptId: string; answers: (number | null)[]; activeIndex: number; expectedRevision: number; }
export interface SubmitQuizRequest { quizId: string; attemptId: string; answers: number[]; expectedRevision: number; }
export type LearningResult<T> = Result<T>;

// Public functions are supplied by progress.ts; mutations are explicit and never auto-retried.
export interface LearningRepository {
  readLearningProgress(): Promise<LearningResult<LearningProgress>>;
  completeLesson(request: CompleteLessonRequest): Promise<LearningResult<LearningMutationResult>>;
  startQuizAttempt(request: StartQuizRequest): Promise<LearningResult<LearningMutationResult>>;
  saveQuizDraft(request: SaveQuizDraftRequest): Promise<LearningResult<LearningMutationResult>>;
  submitQuizAttempt(request: SubmitQuizRequest): Promise<LearningResult<QuizSubmissionResult>>;
}
