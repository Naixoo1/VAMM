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
| QA-03 | Contrast helper timed out awaiting fallback during concurrent checks. Source inspection found the research cap of6/local/minute; the full e2e run consumes that budget. Sequential rerun completed without changing the safeguard. | All18 rendered combinations had zero contrast failures; initial timeout remains recorded. |
| MEDIA-01 | Installed Playwright ffmpeg supports only WebM/image demuxing; MP4 inspection failed. | Existing browser decoded local24s video;12 frames captured, six reviewed. No installation, original edit or external video upload. |
| MOTION-01 | Prototype static switch initially omitted forced OS state; two select names included nested option text. | Corrected effective static state/disable and explicit labels. Remote builds completed; four local responsive interaction checks passed. |

No live-provider outage was observed in final smoke checks. Provider refresh timing and full accessibility of its closed internals remain external, not inferred from deterministic stubs.

## Live-feature/motion integration — 2026-11-07

| ID | Observed issue and bounded resolution | Verification |
|---|---|---|
| LIVE-01 | Mobile chart/provider loading could time out before scrolling into view. Start deadlines on visibility; pause chart deadline when hidden. Immediate module errors remain actionable. | Focused offscreen/ready/deadline tests and final real desktop/mobile smoke passed. No settings/data/finance change. |
| QA-04 | Legacy test iframe was inserted after a full-height mount, overlaying disclosures. Insert it inside the actual widget mount. | Existing comparison/mentor journeys passed afterward; application was not changed for this fixture bug. |
| QA-05 | New mobile silent-provider timeout test advanced time while the host was offscreen. Scroll/verify host visibility before advancing the unchanged deadline. | Failed case passed; real timeout/readiness safeguards retained. |
| LIVE-02 | Initial iframe screenshots were taken before internal provider assets/data completed. | Longer visible checks confirmed actual comparison/fundamentals rendering. onLoad remains labeled only panel-open evidence. |
| PROVIDER-01 | Auxiliary business-info CORS failure observed in one isolated desktop run despite rendered core fields. | No bypass/proxy or invented data. Final full smoke had no failed requests; optional provider fields/availability remain external. |

No unresolved application blocker was found. Native workspace-root alignment remains ENV-01; dependencies/configuration and financial source semantics remain unchanged.

## Independent feature audit — 2026-11-07

The previous local verification remains historical baseline evidence. Fresh adversarial checks exposed six open application defects; the earlier statement that no unresolved application blocker was found is superseded by this review. Full reproductions, evidence and the 09:30 Jakarta schedule review: `orchestration/reviews/FEATURE-AUDIT-2026-11-07.md`. Contract v2, dataset `vamm-demo-2026-11-06.v1` and calculation `vamm-calc.v1` were preserved. No fix is claimed.

| ID / owner | Category; expected versus observed; reproduction/reference | Proposed next action / acceptance | Verification / status |
|---|---|---|---|
| AUDIT-01 / Simulation-AI | Model grounding: three mocked, unsupported prose outputs with valid ev-demo-method are accepted as model-origin. Expected labeled fallback/unsupported claim rejection. research.ts:62–70; see staged grounding probes. | Resolve all claims, including summary, against server-owned supported facts; unsupported output must not become grounded observations. No live data/provider addition. | 3 newly failing assertions; **Open P1**. No real model output observed. |
| AUDIT-02 / Data-platform + Simulation-AI | Storage integrity: after a correct engine turn, persisted real purchasing power+Rp1 or jointly changed inflation indexes1.03→1.5 still restore successfully. Expected visible inconsistency error. state-validation.ts:22–64. | Reconcile derived values against deterministic math on restore; preserve bytes/history and show corruption. This is local integrity, not an authentication/tamper-resistance claim. | 2 newly failing assertions; **Open P2**. |
| AUDIT-03 / Interface + Data-platform | History reachability: reset then reload removes the preserved-session UI entry. Expected previous history accessible; IndexedDB still contains two sessions/one turn. use-simulation.ts:11,25,31. | Hydrate an owner-scoped durable history index through repository/gateway; test a new QueryClient. Review any shared-interface implications before altering frozen v2. | Reproduced desktop/mobile; **Open P2**. No data loss observed. |
| AUDIT-04 / Interface | Navigation: public chart host configured to MSFT, owned external link still opens AAPL. tradingview-chart.tsx:9,60. | Use supported selected-symbol context or accurately label default destination; no provider-internal scraping. | Reproduced desktop/mobile via public host configuration; **Open P2**. Closed symbol-search UI was not automated. |
| AUDIT-05 / Interface + Data-platform | Accessibility: keyboard News Retry removes its control and focus falls to BODY. Expected meaningful retained/recovery focus. live-news.tsx:89–96,138. | Stable loading control or deliberate focus recovery; assert keyboard retry without overriding later user focus. | Reproduced desktop/mobile with error/ready harness; **Open P2**. Similar patterns elsewhere are unconfirmed. |
| AUDIT-06 / Data-platform | API media correctness: application/jsonp and application/json-not-really return200, expected400. route.ts:50 prefix check. Actual local HTTP JSONP also returns200 with model disabled. | Exact parsed media-type comparison, preserve charset and byte limits; no demonstrated exploit. | 2 newly failing isolated assertions plus direct HTTP repro; **Open P3**. |
| AUDIT-PROVIDER-01 / external provider | Longer visible fundamentals check reports failed widget-data-business-info request at both widths, while actual financial values render and no app error occurs. | Retain honest provider provenance/availability states. No proxy, bypass, new backend or invented values. Recheck only if core fields fail or evidence changes. | Observed external request failure; not classified as another confirmed app defect. |
| AUDIT-SCOPE-01 / CEO | Screenshot analysis, personalized buy/sell, stock orders, live sentiment classifier and live-grounded AI research are absent. Screenshot/personalized advice are expressly excluded by MVP:72–74. | Report the gap against user expectation; do not count QA screenshots or TradingView ratings as the missing pipeline. A future feature requires separate scope/interface review. | Source/UI/request boundaries reviewed; missing/deferred, not a broken implemented flow. |

Fresh baseline checks passed:134 unit/integration tests,48 browser cases, TypeScript, ESLint, production build and zero runtime dependency advisories. New isolated probes:20 pass/7 fail. All59 source-file hashes remain unchanged. Deployment/rehearsal remains unverified/queued; no new plugin, paid data service or application implementation occurred during this audit.

## Audit repair resolution — 2026-11-07

The preceding audit remains the historical failing baseline. Current resolution evidence is in reviews/FIXES-MOTION-2026-11-07.md, with source protection/original-probe JSON under reviews/evidence/repair-2026-11-07. Owner handoffs and final integrated checks were actually observed.

| Issue | Implemented action / actual verification | Current status |
|---|---|---|
| AUDIT-01 | Model selects bounded supported IDs; server owns all rendered text/evidence. Original3 adversarial cases and positive model-selection cases pass; no real model call. | Verified resolved locally |
| AUDIT-02 | Existing pure-engine helpers reconcile restored purchasing power/inflation, retaining error/history bytes; original2 corruption cases and all legitimate turn states pass. | Verified resolved locally |
| AUDIT-03 | Existing owner-indexed IDB history is discovered read-only; full reload/new tab history access and exact record preservation pass. | Verified resolved locally |
| AUDIT-04 | Owned footer explicitly identifies default AAPL; MSFT host change retains accurate link labeling on both viewports. | Verified resolved locally |
| AUDIT-05 | Stable guarded retry controls retain keyboard focus across loading/success and do not steal later focus; browser/component tests pass. | Verified resolved locally |
| AUDIT-06 | Exact media token matching; original2 negatives and actual local JSONP400/multipart400 checks pass. | Verified resolved locally |
| QA-REPAIR-01 | Initial observer assertion preceded scheduled React-query notification; verify refetch result then wait for actual rendered recovery. Full201 cases pass; app untouched by test correction. | Verified resolved test timing |
| QA-REPAIR-02 | One localhost API GET ECONNRESET in an intermediate browser run; no server crash/logged error. Same unchanged isolated case and final full60 cases pass. Exact transport root cause unconfirmed; no retry/guard weakening. | Not reproduced on final run; evidence retained |
| QA-DESIGN-01 | Early lazy Home SVG screenshot captured before decode; separate complete/naturalWidth render checks verify image and capture previews. No asset failure. | Verified capture timing; no app fix required |
| AUDIT-PROVIDER-01 | Real provider core displays render, but auxiliary support/business-info failures and aborted bundles remain recorded. No app errors/overflow or bypass/proxy. | External availability limitation remains |
| AUDIT-SCOPE-01 | Screenshot/personalized advice/trading/live sentiment/live-grounded AI remain deferred under frozen MVP; incoming prototype logic not imported. | Missing/deferred, unchanged |

Final local checks:201/201 unit/integration,60/60 browser, TypeScript/ESLint/build,27/27 original probes,30 responsive route checks,24 contrast checks with no failures,36 protected hashes unchanged. No plugin, paid service, dependency, real model call or deployment added. ENV-01 native source-folder alignment and DEP-01 historical development-only advisories remain separate limitations.

## Logo/live review — 2026-11-07

| ID | Observation / cause / action | Final evidence |
|---|---|---|
| LIVE-SYMBOL-01 | Valid maximum-length stock symbol overflowed narrow display: 579px document width at320px. Text paragraphs lacked wrapping. Added overflow-wrap:anywhere without truncating input or changing the provider symbol. | Same case now320px; all19 responsive checks passed. |
| QA-LOGO-01 | Initial browser run62/66: global alert selector matched Next route announcer; old News footer copy assertion was stale. Scoped the actual comparison alert and updated current provenance expectation. | Full66/66 passed; guards unchanged. |
| QA-LOGO-02 | Responsive script's close-button selector matched modal and inert trigger. Scope to Workspace menu dialog. | Complete19-case run passed. |
| QA-LOGO-03 | Contrast script timed out awaiting Research fallback after repeated suites. Exact response not captured; root cause remains unproven. Isolated fresh-server run passed; no timeout/rate-limit/fallback guard weakened. | All20 contrast combinations passed with zero findings. |
| ENV-LOGO-01 | Reused workers retained restricted writes and worker Vitest reported EPERM creating temporary config. Stage bounded sources, review/import and run tests as CEO. | CEO237 unit and66 browser cases passed; worker runtime pass not claimed. |
| PROVIDER-LOGO-01 | One mobile iframe request aborted while replacing a comparison selection. Final comparison lines rendered; external provider timing/coverage remains its responsibility. | Four real chart-pair/viewport renders plus two News ready checks, no app errors/overflow. |

Walkthrough and proof: reviews/LOGO-LIVE-WALKTHROUGH-2026-11-07.md and reviews/evidence/logo-live-2026-11-07/. No remaining confirmed application failure from this change; universal live symbol coverage, model delivery and public deployment are not claimed.

## Learning feature review — 2026-11-07

| ID | Observation / cause / resolution | Status |
|---|---|---|
| LEARNING-SEC-01 | Upstream public .env.example contains an apparent API-key value. Do not copy, use or validate it; notify the owner to revoke/rotate. Local quiz uses reviewed questions without a model call. | External owner action required; no credential imported |
| LEARNING-SCOPE-01 | Prototype 10/15-question counts depend on generated questions, while each reviewed pack contains five. Offer the five actual questions with accurate provenance; do not repeat questions or fabricate AI generation. | Implemented: three reviewed five-question packs; no generated-count claims |
| LEARNING-ENV-01 | Reused workers retain restricted writes; CEO project writes work. Stage worker files in visualization root, review/import and execute canonical checks as CEO. | Working fallback; CEO integrated/runtime checks executed; worker static/runtime attribution kept separate |

### Learning integration findings and fixes

| ID | Cause / implemented approach | Observed evidence |
|---|---|---|
| LEARNING-TYPE-01 | TypeScript inferred a literal replayed:true branch in generic transaction calls. Supply explicit LearningMutationResult / QuizSubmissionResult type arguments instead of widening/casting away validation. | TypeScript and production build pass. |
| LEARNING-UI-01 | The activated Reload control could unmount after recovery, losing keyboard focus. Retain the used control and guard pending reads; show refreshing rather than premature up-to-date status. | Focused UI test passes across pending, success and later user focus. |
| LEARNING-UI-02 | A second tab can submit the same active attempt ID. Checking only the active ID left the first tab editable after reload. Check saved status as well, preserve local choices read-only and link to the current saved result. | Focused UI test confirms radio and mutation controls are blocked without overwriting choices; repository rejects late writes. |
| LEARNING-QA-01 | Existing unit assertion matched both network and unavailable-storage alerts; two new desktop browser assertions matched sidebar h2 and page h1. Scope assertions to the actual error and level1 page headings. | 299 unit tests pass; corrected level1 heading cases passed in the78-case baseline. Final midnight full-suite result is recorded in the walkthrough. |
| LEARNING-QA-02 | Running browser and contrast suites concurrently exhausted the existing Research request window. The failed mobile API smoke trace confirms HTTP429. Run suites separately with a fresh QA server; do not change rate limits or add automatic research retries. | Initial78-case run75passed/3failed includes this429 and the2selector failures; sequential78-case rerun passed. Request safeguards unchanged. |
| LEARNING-CONTRAST-01 | Final teammate muted color #657184 on #edf5ff falls just below4.5 contrast (display rounded to4.5). Darken the Home crest caption and eight diagram captions to stronger muted colors. | Initial base scan found2caption findings; expanded54states found16diagram findings. Caption corrections passed all54 states; later midnight canvas findings are tracked separately below. |
| LEARNING-WRAP-01 | New search echo can contain an unbroken user string. Bound wrapping in the learning-page CSS while preserving the full input and content. | Focused search/empty recovery tests pass; route width checks remain part of final verification. |

| ID | Final-source finding / bounded correction | Evidence |
|---|---|---|
| LEARNING-UI-03 | Native exit-dialog recovery button disappeared after success; retain the activated control. Runner Back link bypassed save/discard confirmation; route it through the same exit dialog. | Ten focused UI/hook cases pass within299 total tests; financial navigation/controller unchanged. |
| LEARNING-QA-03 | New artwork consumes useMotionPreferences; an older unit test completely mocked the motion module without that export. Use importOriginal for real preference behavior while retaining existing decorative test doubles. | Initial298/299, corrected299/299. No application fallback changed. |
| LEARNING-STYLE-01 | Two CSS-module shell classes declared different --team-* tokens on the same element. Shared page styles loaded later and restored interim colors. Align shared tokens with the accepted midnight palette. | Initial midnight browser80/82; both failures showed the old computed tokens. All4 focused shell cases passed after correction; final full result in walkthrough. |
| LEARNING-CONTRAST-02 | Correct midnight canvas #edf2f7 exposed legacy #657184 shared text at4.39 contrast, producing52 findings across54 states. Use final-source muted #5d6c7f consistently in shared primitives. | Final expanded54-state scan: zero findings, including toolbar/animation controls and all10 lesson readers. |
| LEARNING-PROVIDER-01 | One initial mobile iframe request aborted during symbol replacement; the replacement chart rendered. | Final six real-provider checks had no page errors, failed requests or overflow; actual US/IDX chart lines and News headlines reviewed. Provider availability/quote timing remain external. |

All new learning/design application findings above were resolved locally before the user authorized deployment. External credential revocation (LEARNING-SEC-01), historical workspace-root alignment/development advisories and explicitly unbuilt paid-generation/search/trading features remain disclosed limitations.

## Production and Google OAuth follow-up — 2026-11-07

| ID | Observed cause / approach | Status |
| --- | --- | --- |
| DEPLOY-AUTH-01 | Existing Vercel OAuth grant expired. User reconnected; authenticated deployment then reached READY from fc8b9e4. | Resolved; public production HTTPS verified. |
| DEPLOY-QA-01 | Worker browser DNS denied the production host; root browser reached it. CEO executed staged scripts. Hidden lazy-image decode and ambiguous quiz Back selector were harness errors, corrected outside source. |18route/viewport checks and15learning checks passed. |
| DEPLOY-QA-02 | Simulation runner's final network assertion rejected navigation-canceled prefetch/image requests. Full financial/reset/history assertions succeeded in both widths; independent logo decoding succeeded. | Raw exit1 preserved and classified, no financial defect inferred. |
| DEPLOY-PROVIDER-01 | TradingView technical-analysis scanner requests failed externally/CORS and emitted widget-error. Other main widgets loaded; targeted in-view follow-up confirmed Home chart and Fundamentals after initial blank captures. | External technical-panel fallback remains visible; no synthetic replacement. |
| AUTH-SETUP-01 | No project/process Google credential names or Vercel Google client variables exist. Device access is authorized, but the required Computer Use node_repl runtime and authenticated Google Cloud connection are unavailable in this session. | Code/setup/deployment proceed; actual Google activation awaits secure client credentials. |
| AUTH-DEPS-01 | New Better Auth dependency preserves existing versions. Full audit retains8moderate development-tool advisories; production-only audit is clean. | No automatic dependency upgrades or security-control weakening. |
| AUTH-TYPE-01 | Array.findLast is outside the protected TypeScript library target. Replaced with copied reverse/find; no configuration edit. | Final types/build pass. |
| AUTH-CONFIG-01 | URL parsing normalizes a bare trailing fragment/query marker. Enforce exact raw canonical origin or its trailing-slash form before accepting configuration. |43wrapper/config and15actual-SDK tests pass. |
| AUTH-UI-01 | Retry controls could unmount during status refresh; action error and query error had inconsistent disabled semantics. Keep controls mounted and distinguish failed status reads from retryable actions. |22focused UI tests and6final browser cases pass, including focus and duplicate guards. |
