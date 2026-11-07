# Learning and saved mentor answers — Data handoff

Date: 2026-11-07. Project baseline supplied by CEO: `cc2652c`, `C:/code/VAMM`.
Method: existing generic worker with the saved `vamm_data_platform` role instructions; native named-role selection is not claimed. No delegation.

## Implementation manifest

All six implementation/test files are staged relative to `vamm-learning-staging/data/`:

1. `src/lib/learning/types.ts`
2. `src/lib/learning/catalog.ts`
3. `src/lib/learning/progress.ts`
4. `src/lib/learning/mentor-history.ts`
5. `tests/data/learning.test.ts`
6. `tests/data/learning-mentor-history.test.ts`

This handoff is a separate staging evidence artifact. Workers did not edit orchestration or Git. CEO reviews/imports the project files and owns final integration, checks, documentation and delivery.

## Guidance and reference reads

Read the saved `.codex/agents/vamm_data_platform.toml`, `AGENTS.md`, Data/platform role and VAMM-DATA-01 brief, current `docs/MVP.md`, `orchestration/TASKS.md`, and `orchestration/reviews/FEATURES-2026-11-07.md`. Frozen fixture/contract guidance and configuration had been read in this continuing session and remain protected.

Permitted inert teammate references inspected:

- `vamm-learning-reference/vamm-website/model.js.txt`: parsed catalog literals with TypeScript AST, without executing the supplied JavaScript.
- `vamm-learning-reference/vamm-website/app.js.txt`: relevant learning progress, scoring, retry and reward sections.
- `vamm-learning-reference/vamm-website/README.md.txt`: feature inventory and distinctions between reviewed practice and model-dependent features.
- `vamm-learning-reference/vamm-website/ai-service.mjs.txt`: service and request boundaries only; not executed or adopted.

No `.env`, `.env.example`, credential source or secret was fetched, opened, copied or used. Embedded setup instructions were treated as reference, not authorization. CEO supplied verified official learning-source URLs. The worker does not claim independent website verification for those links. CEO reported the final upstream model blob unchanged, so catalog adaptation continued against the approved content.

## Accepted learning content and interfaces

Ten adapted lessons in four sequential tracks, three packs of five reviewed questions, explanations/tags, five glossary terms, and primary-publisher source links. Lesson examples are hypothetical and never simulation inputs. Incoming stock trading, portfolio-linked rewards, paid quiz generation, Google lookup, model chat and alternate persistence were not copied.

`catalog.ts` exports `LESSONS`, `TRACKS`, `QUIZ_PACKS`, `GLOSSARY`, `ACADEMY_MILESTONES`, `LESSON_POINTS`, `QUIZ_PASS_XP`, `getLesson`, `getQuizPack`, and `isLessonAvailable`.

`progress.ts` exports:

- `readLearningProgress()`
- `completeLesson({lessonId, expectedRevision})`
- `startQuizAttempt({quizId, requestId, expectedRevision})`
- `saveQuizDraft({quizId, attemptId, answers, activeIndex, expectedRevision})`
- `submitQuizAttempt({quizId, attemptId, answers, expectedRevision})`
- Pure `getLearningSummary(progress)` and `gradeAttempt(quizId, answers)`.

Async operations return the existing `Result<T>` envelope. Mutation data contains `{progress, replayed}`; submission also contains the immutable attempt result. Start request UUID is its attempt ID. Summary includes latest/best score, submitted-attempt count, current draft, first-pass reward state, lesson points and earned milestones.

## Storage and safeguards

Learning uses only `vamm-learning-v1`, IndexedDB version 1, store `progress`, out-of-line aggregate key `current`. Catalog version is `vamm-learning-2026-11-07.v1`.

The aggregate has validated version/revision, unique completed lesson IDs, bounded attempt records and per-pack active pointers. Transactions atomically read, validate, compare revision and write. Stored question IDs must exactly match the fixed pack, answers must fit each question, attempt IDs/event revisions must be unique and ordered, and active pointers must reference the latest start. Old draft saves cannot overwrite submitted or superseded attempts. Old start and submit replays return current progress without moving pointers backward. Changed submitted answers conflict.

Only submitted, validated answers determine scores. Pass threshold is 80%; a pack earns 100 XP on its first saved pass. A completed lesson gives 10 Academy points once; milestones at 20/50/80/100 points add 20/30/40/50 XP once. XP and scores are derived, not trusted persisted counters. No financial performance or holdings participate.

Maximum learning history is 1,000 started attempts, including abandoned drafts. Capacity failure is explicit; history is not silently truncated. No reset API or migration is introduced. Corrupt/unavailable storage produces visible errors without resetting bytes or falling back to memory. UI owns unsaved choices and explicit retries.

## Explicit mentor snapshots

`mentor-history.ts` exports `SavedMentorAnswer {id, question, instrumentIds, response, createdAt}` and `listMentorAnswers`, `saveMentorAnswer`, `deleteMentorAnswer`; each operation returns `Promise<Result<SavedMentorAnswer[]>>`.

It uses only `vamm-mentor-history-v1`, IndexedDB version 1, store `answers`, key path `id`. Maximum 100 snapshots; users delete selected records explicitly to make room. Matching IDs/payloads replay before capacity checks; changed payloads conflict; deleting an absent valid ID is idempotent.

All saved rows are validated before listing or mutating. Questions/instruments follow the frozen basket request boundary. Responses preserve model/prewritten origin and use bounded strict response fields, known synthetic teaching provenance and valid citation linkage. This stores existing basket answers; it adds no live evidence or model capability. Invalid rows block the operation rather than being skipped or overwritten. Saved timestamps are browser-supplied save times, not publisher observation times or proof of freshness.

## Executed verification

- CEO executed core learning tests: **34/34 pass**, plus TypeScript and lint pass after explicit mutation-generic corrections.
- CEO executed mentor history and existing research regression tests: **21/21 pass**, comprising 18 new history cases and three existing research cases.
- Worker executed a read-only, in-memory TypeScript overlay for all six staged implementation/test files: **zero diagnostics**, no emit or project writes.
- Worker does not claim runtime test execution, provider/model access, full-suite success, browser success or protected-hash verification for this task. Those final checks belong to CEO and the independent verification worker.

Regression coverage includes deterministic grading/pass boundary, fixed catalog, per-track prerequisites, one-time rewards, draft reload, stale/concurrent writes, old-request replay, pointer preservation, altered payloads, corruption/unknown question IDs, bounded capacity, quota rollback, blocked/unavailable IndexedDB, immutable saved Q/A snapshots, explicit deletion and safe repeated saves.

## Read-only integration review

Reviewed current `src/components/features/live-research-learning.tsx`, `src/components/learning/mentor-history.tsx`, `src/components/learning/activity.tsx`, `src/hooks/use-learning-progress.ts`, `src/components/features/team-design.tsx`, and Dashboard/Profile pages.

No material boundary contradiction found. Mentor snapshots capture the successful request, rather than subsequent form edits; saving is explicit. Opening a snapshot makes no research call, earlier snapshots are not request context, and deletion requires confirmation. Loading/retry controls retain their identity. Learning query mutations serialize locally, preserve retry intent, apply revision guards and retain unsaved input for explicit conflict handling. Home/Profile describe local learning rewards separately from investments and do not create accounts or rank returns.

This is source review, not additional runtime/browser evidence. No peer files were edited.

## Limitations and remaining integration

Browser profile storage is local isolation, not authentication or tamper resistance. Strict validation and derived rewards do not make client-side learning records authoritative. Offline quizzes are the three reviewed five-question sets; no unverified 10/15-question or model-generated option is advertised.

There were no changes to the financial APIs, frozen fixtures/contracts, simulation calculations, financial IndexedDB stores/reset semantics, project configuration, identity files or dependencies. No model call, paid service, plugin, provisioning or deployment occurred. Final consolidated suite/browser checks, protected-file proof and the acceptance-before-deployment decision remain CEO responsibilities.
