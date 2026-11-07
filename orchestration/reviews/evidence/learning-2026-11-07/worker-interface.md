# Learning Academy and Missions — Interface handoff

Implementation is staged under `vamm-learning-staging/interface` for CEO review/import. Actual project is C:/code/VAMM, task baseline cc2652c. Generic saved-role fallback remains in use; no native named-role selection or delegation is claimed. Worker did not attempt another project write/escalation after the documented retained permission limitation.

## Delivered scope

`/academy` supplies four course tracks and ten lessons from Data's versioned catalog, lesson search/empty recovery, course outlines, sequential unlock within each course, native progress, objectives, reading sections, takeaways, unscored reflection, source links and glossary. Completion is explicit and earns ten points once through the repository. Milestone state/XP at20/50/80/100 points comes from the shared summary, never a UI counter.

Ten static lesson diagrams have SVG title/description plus a complete HTML textual equivalent. They are marked hypothetical/illustrative, contain no live financial values, and import no financial engine/chart math. Concepts cover ownership, quote/order/execution, distributions/costs, risk, diversification, business reports, past-chart uncertainty, compounding, purchasing power and fees. Their graphic content is static; the existing shared surface-arrival policy remains optional and preference-controlled.

`/missions` centralizes every scored quiz. Three reviewed packs have five questions each,80%target and100learning XP on first saved pass only. Features include setup/concepts, draft resume, native radio answers, question navigation, saved progress, explicit submission, score/correct counts, explanations, review tags, last/best/attempt counts, retry and a native exit dialog. No10/15question option, model generation, timer, stock orders or performance reward is implied. Academy links to Missions for scored practice; its reflection is unscored.

Current VAMM brand/shared controls and final teammate palette are reused: light presentation, ink#18273a/muted#657184, blue#1964c8/softblue#edf5ff. Root supplies shared orange CTA and shell; this worker changes no existing shell/Home/News/profile file. All24 existing motion recipes and global pause/static/live OS preferences remain untouched. New page surfaces use the existing shared scope and markers; diagrams never animate amounts.

## Routes, labels and accessible behavior

Both new page files use Suspense around the client query reader, avoiding an unbounded useSearchParams static-build bailout. Deep links: `/academy?lesson=stocks`, `/missions?quiz=facts-and-news`, with `resume=1` or `review=1` for explicit saved views.

Academy retains oneh1 `Learning Academy`; reader titles areh2. Catalog labels include `Search lessons`, `Start course: <title>`, `Continue course: <title>`, `Review course: <title>`, `Course outline`. Reader controls: `Mark lesson complete` → `Saving lesson…` / `Lesson complete`; `Next lesson`; `Back to Academy`; `Practice quiz: <title>`. Locked lessons show a visible completion requirement. Progress/unavailable states use actual service data rather than an invented zero fallback.

Missions retains oneh1 `Missions & Challenges`, with hubh2 `Quiz Center`. Links: `Start challenge: <title>`, `Continue quiz: <title>`, `Review answers: <title>`. Setup controls: `Start quiz`, `Continue saved quiz`, or `Start new quiz` with replacement warning. Runner controls: `Question N, answered|unanswered`, `Previous question`, `Next question`, `Submit answers`, `Exit quiz`. Dialog: `Stay in quiz`, `Save and exit`, `Exit without saving` when dirty, plus read recovery when needed. Results: `Learning target met` / `Keep practicing`, `Try again`, `Back to Quiz Center`.

Summary value selectors: `learning-academy-points`, `learning-xp`, `quiz-score`. Diagnostic markers: data-learning-page, data-learning-track, data-learning-lesson, data-quiz-pack, data-quiz-stage and data-learning-diagram. Form controls retain44pxtargets, visible focus and text beside status colors. Radio groups use native fieldset/legend and required inputs. Question/result focus follows a deliberate completed action only if the user has not moved elsewhere. Stored failure/reload controls, including the native exit dialog recovery control, remain mounted after activation and never restore focus over later user movement. Runner Back uses the same explicit save/discard confirmation as Exit quiz, so it cannot silently discard the current unsaved answer.

The isolated Missions session resets its local presentation when the quiz URL changes, so a prior local runner/result cannot override a new explicit URL. This is a learning-only navigation boundary; reload/CAS does not change its key, and no protected financial/controller subtree is keyed/remounted.

## New hook and persistence boundary

`useLearningProgress` consumes Data's `@/lib/learning/progress` operations: readLearningProgress, completeLesson, startQuizAttempt, saveQuizDraft, submitQuizAttempt; pure summaries/catalog come from the same agreed new learning namespace. The repository uses separate vamm-learning-v1 IndexedDB and existing Result envelopes. No UI reads or writes vamm-demo-v2, owner IDs, financial balances or storage schema.

The hook exposes progress/loading/refreshing/busy/error/retryIntent/blocked and reload/retry/complete/start/save/submit. Mutations serialize with an immediate ref lock, capture expectedRevision and exact payload, and retain the same start UUID/intent for transient retry. No automatic mutation retry or mount-time mutation occurs. Cached revisions cannot regress, and successful replays refresh authoritative progress. Corrupt/unavailable reads stay visible with null progress; no silent blank record is substituted by the hook.

Radios update local choices immediately. Explicit navigation and Save-and-exit persist draft answers/index; submit persists a result through the shared grader. On failure, choices stay in the tab and pending replay keeps its original snapshot. On cross-tab reconciliation, a changed active ID or a same-ID attempt that is no longer draft makes the local choices read-only and offers latest-result/latest-draft review. A submitted attempt is never treated as an editable draft merely because its active pointer stayed the same.

## Exact ten-file import manifest

- src/hooks/use-learning-progress.ts
- src/app/academy/page.tsx
- src/app/missions/page.tsx
- src/components/learning/academy.tsx
- src/components/learning/missions.tsx
- src/components/learning/shared.tsx
- src/components/learning/lesson-diagram.tsx
- src/components/learning/learning.module.css
- tests/ui/learning-ui.test.tsx
- tests/ui/learning-progress.test.tsx

Exclude verify-learning.mjs, draft-static-checks.json and this handoff from application imports. CEO owns activity.tsx/profile and shell/Home/News integration; Data owns all lib/learning and mentor-history output; Simulation/AI owns browser specs. There is no overlapping source writer.

## Reads, source provenance and security

Read saved vamm_interface TOML, AGENTS, MVP/FIXTURES/contracts, TASKS/AGENT_SETUP, Interface role/brief, FEATURES reconciliation, latest LOGO-LIVE and LEARNING-WALKTHROUGH task reports. Read selected inert app/model/README/index reference text pinned37707d11652024c477687992b2911704b9c650a8, focusing Academy/Missions/setup/runner/review/storage flow. Final palette/scope9775636d55db8832dfd6d28eeef14afea29999d5 was supplied by CEO; model catalog is unchanged per CEO intake. Read Data's stable types/catalog/progress interfaces and current VAMM presentation/motion boundaries.

No .env, .env.example or secret was fetched/read/copied/used by this worker. Reference instructions were treated as data. No prototype script was executed, no client AI/API code copied, no key setup, service/plugin/dependency added, and no network/model request or deployment made.

## Checks and remaining finish gate

Executed worker checks: final in-memory TypeScript overlay against current project plus Data's new sources; zero diagnostics. ESLint lintText on owned TS/TSX; zero messages. PostCSS parsed the scoped CSS; shared workspace class-reference scan had no missing class. No emit/project write. Evidence: draft-static-checks.json, verify-learning.mjs. The final caption-only contrast correction changes SVG fill from#657184 to#52657b; CEO will rerun the rendered affected states.

Ten focused test cases are authored: retained reload focus/pending status/user focus movement; same-attempt cross-tab submit with unsaved read-only choices; URL view reset; lesson search/empty recovery; retained native-exit-dialog reload focus; runner Back action honoring save/discard confirmation; corrupt read with no fallback or mutation; duplicate start/stable UUID retry; exact draft snapshot/revision retry; replay without cache regression. This worker does not claim their runtime execution.

CEO runtime observations before the last two dialog/exit refinements: production build,297unit cases and78browser cases passed;28responsive checks passed. Expanded contrast found a shared generic diagram caption at4.49; that caption is now staged darker. Early heading-selector collisions and API concurrency/rate behavior were addressed by CEO. Final post-refinement checks remain CEO-owned, not worker executions. Original financial/controller isolation and all36protected hashes remain CEO-verified boundaries; final integrated checks and screenshots belong to CEO/Simulation-AI.

The initial three copy deltas (truthful pending read text, scoped long-token wrapping, darker diagram caption) were imported by CEO. Final additional copy: missions.tsx retains the dialog reload control and routes runner Back through save/discard confirmation; learning-ui.test.tsx adds both focused regressions. All owned production is now frozen. Final unit/browser/contrast/build status and Git delivery must be recorded by CEO after the remaining checks.

## Protected files and limitations

No root layout/providers/globals, package/Codex/test configuration, v2 contracts/fixtures, engine/gateway/calculations, original identity files, existing financial storage/API or orchestration/Git file was edited by this worker. Academy/Missions learning state is isolated; rewards do not alter balances or rank investing returns. Public deployment is reserved until user acceptance. No paid generation/search or real model answer is represented as implemented.
