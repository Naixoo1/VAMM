# Error Handling and Recovery

CEO-maintained; workers report evidence. Apply during authorized work only. This guide
does not start implementation, retries, external actions, or continuous monitoring.

## Procedure

1. Record the failed operation, expected/observed behavior, relevant error excerpt,
   affected task/owner, current contract/fixture version, and reproduction steps.
   Redact keys, tokens, and unnecessary participant data.
2. Classify: documentation conflict, environment/tooling, contract, calculation/state,
   storage, model/provider, UI, or deployment. Separate observed failures from unbuilt
   features and unverified assumptions.
3. Pause only affected tasks. Preserve current user edits and pending request identity;
   do not reset storage, erase history, change fixtures, or roll back unrelated work.
4. Reproduce the smallest failing case and inspect the relevant active source. For
   changed teammate guidance, use INTAKE.md. Read current official documentation when
   SDK/provider behavior is uncertain. Diagnose before changing dependencies/settings.
5. Assign one owner and a bounded fix. Keep financial code deterministic. Never fix
   integration by bypassing validation, ownership, secrets handling, or replay checks.
6. Retry only when evidence or conditions change. A financial retry keeps requestId and
   payload; conflicts require reload/reconciliation. A feedback/research retry never
   repeats a financial mutation. Honor model timeout/no-auto-retry defaults.
7. After ten blocked minutes, CEO narrows scope, changes approach, or uses an approved
   fallback. Report evidence and remaining impact. Do not repeat an unchanged failing
   command indefinitely or treat unavailable permissions/services as successful checks.
8. Verify the smallest meaningful check plus affected integration. Record actual results,
   remaining risks, and recovery steps. A proposed fix is not a resolved issue.

## Recovery boundaries

- Storage failures: show the error; no silent new session, data purge, or alternate store.
- Model outage: labeled prewritten research; deterministic simulation remains usable.
- Tooling failure: distinguish command/runtime errors from application defects; use a
  supported runtime or required approval path without expanding permissions silently.
- Contract/math inconsistency: pause affected consumers, reconcile/version documents,
  update reference examples, then validate implementation when authorized.
- Deployment failure: preserve a known working version; no unrequested publishing,
  credential changes, new paid resources, or destructive rollback.
- Unknown root cause: record a hypothesis and next discriminating check, not invented facts.

## Issue register

Implementation began with explicit user authorization on 2026-11-07. The records below distinguish observed tooling/dependency issues from expected components still being built.

| ID/task/owner | Category and evidence | Hypothesis/next check | Action/fallback | Verification | Status |
|---|---|---|---|---|---|

Statuses: Open → Investigating → Fix proposed → Verified resolved; or Waiting on decision.
Keep actionable summaries here; use `work/` for scratch output only when necessary.

## Implementation setup observations — 2026-11-07

| ID/task/owner | Category and evidence | Hypothesis/next check | Action/fallback | Verification | Status |
|---|---|---|---|---|---|
| ENV-01 / BOOT-01 / CEO | Session cwd/write roots name nonexistent C:/code/VAAM; project exists at C:/code/VAMM. Normal-sandbox git status also returned a work-tree error, while escalated status succeeds. | Native source-folder access requires the user to move the chat in the sidebar; app tools cannot grant it. | Use explicit project workdir and platform-approved escalated commands for authorized project operations. No global trust/ACL changes or path aliases. | Git init, remote setup, dependency install and scaffold writes succeeded through approval path. Native workspace-root alignment remains outstanding. | Open (native alignment); approved-command workaround verified |
| DEP-01 / BOOT-01 / CEO | npm audit reported 8 moderate findings in the development-only typescript-eslint/minimatch lint chain; no high/critical findings. | Upstream lint chain uses minimatch 10.2.6; audit suggests a breaking framework-config downgrade. Check production-only audit separately. | Do not force an unrelated framework downgrade or ignore required lint checks. | npm audit --json observed; no application exploit or runtime failure claimed. | Open |
## Implementation verification and recovery — 2026-11-07

| ID/task/owner | Category and evidence | Action/fallback | Verification | Status |
|---|---|---|---|---|
| ENV-02 / worker writes / CEO | Worker escalation requests remained pending for over 650–830 seconds; canceled before successful writes. | Workers authored only in existing writable staging; CEO reviewed and imported through main-chat approval. No aliases/ACL/global trust changes. | All owner outputs imported and integrated checks passed. | Verified resolved |
| ENV-03 / BOOT / CEO | Next.js 16 appended generated agent instructions during first dev startup. | Set agentRules:false and removed only framework-generated marker block. | Project guidance retained; frozen sources and role configs hash unchanged; subsequent build passed. | Verified resolved |
| QA-01 / VERIFY / CEO | Browser test selectors collided with Next route announcer or nested fee text; canceled StrictMode fixture GET was counted as a retry. | Scoped alerts to main, selected actual fee cells, counted completed503 responses. No validation or app guards weakened. | All 14 production-browser checks passed. | Verified resolved |

DEP-01 remains a development-only lint-chain advisory: production-only npm audit returned zero findings. Live model/provider/deployment access was not tested or configured. Native workspace root remains VAAM; explicit approved operations in VAMM are the verified workaround, not a permanent app permission change.

## Live-News / motion checks — 2026-11-07

| ID | Evidence and action | Actual result |
|---|---|---|
| QA-02 | New refresh test used clock.fastForward, which invokes repeating timers once; changed only that case to runFor while retaining >=3 refresh assertion. | Both failed desktop/mobile cases passed on rerun. App untouched. |
| QA-03 | Contrast helper timed out awaiting fallback during concurrent checks; isolated rerun completed. | All18 rendered combinations had zero contrast failures; initial timeout remains recorded. |
| MEDIA-01 | Installed Playwright ffmpeg supports only WebM/image demuxing; MP4 inspection failed. | Existing browser decoded local24s video;12 frames captured, six reviewed. No installation, original edit or external video upload. |
| MOTION-01 | Prototype static switch initially omitted forced OS state; two select names included nested option text. | Corrected effective static state/disable and explicit labels. Remote builds completed; four local responsive interaction checks passed. |

No live-provider outage was observed in final smoke checks. Provider refresh timing and full accessibility of its closed internals remain external, not inferred from deterministic stubs.
