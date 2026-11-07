# VAMM interface audit — 2026-11-07

Scope: AUDIT-UI-2026-11-07, read-only review of the six routes, teaching disclosures, motion controls, screenshot-analysis availability, and the historical implementation plan. Baseline `fe56e99` was supplied by the CEO. Role loaded through the explicitly supplied generic-worker fallback and matching saved `vamm_interface.toml`; no native named-role capability is claimed.

## Findings

### UI-01 · P2 · Preserved history loses its UI entry after a full reload

**Confirmed by CEO-run desktop and mobile probes.** After committing one turn and starting a fresh session, one preserved-session summary is visible. After a full reload, the summary count becomes zero. IndexedDB still contains two sessions and one turn. This is a history-access problem; no data loss was observed.

The previous-session index is only an initially empty, disabled QueryClient query in [use-simulation.ts:11](C:/code/VAMM/src/hooks/use-simulation.ts:11). A successful reset populates that memory query at [line 25](C:/code/VAMM/src/hooks/use-simulation.ts:25). The app creates a fresh QueryClient on load at [providers.tsx:5](C:/code/VAMM/src/app/providers.tsx:5), while the preserved-session UI depends on that array at [simulation/page.tsx:42](C:/code/VAMM/src/app/simulation/page.tsx:42). Existing history fetching needs an already-known session ID at [simulation-history.tsx:10](C:/code/VAMM/src/components/features/simulation-history.tsx:10).

Reproduce: start a session → commit a turn → confirm a fresh session → see “Preserved sessions” → reload → the entry is gone. Proposed later resolution: agree an owner-scoped way to reconstruct the saved session index through the repository/gateway, then test UI retrieval after a genuinely fresh QueryClient. Do not add an independent persistence store or change the frozen interface during this audit.

Coverage gap: [journey.spec.ts:71](C:/code/VAMM/tests/e2e/journey.spec.ts:71) opens history before reload; [line 77](C:/code/VAMM/tests/e2e/journey.spec.ts:77) reloads but then checks the active view and raw turn retention rather than history reachability. [simulation-state.test.tsx:20](C:/code/VAMM/tests/ui/simulation-state.test.tsx:20) remounts using the same QueryClient.

### UI-02 · P2 · The owned chart link opens AAPL after the chart changes to MSFT

**Confirmed by CEO-run desktop and mobile probes.** The public chart host was changed to `NASDAQ:MSFT`; “Open on TradingView” still points to `NASDAQ:AAPL`.

[tradingview-chart.tsx:9](C:/code/VAMM/src/components/features/tradingview-chart.tsx:9) hardcodes the destination. The chart enables symbol changes at [line 34](C:/code/VAMM/src/components/features/tradingview-chart.tsx:34); the footer uses the unchanged constant at [line 60](C:/code/VAMM/src/components/features/tradingview-chart.tsx:60).

Reproduce: change the chart symbol → activate the owned footer link → its URL opens AAPL. Proposed later resolution: use a supported public symbol/context signal, or explicitly label the link as opening the default AAPL chart. This report does not claim a mismatch in the provider’s own internal attribution links. Existing symbol-preservation tests do not check this owned destination after a symbol change.

### UI-03 · P2 · Keyboard retry on News drops focus to the document body

**Confirmed by CEO-run desktop and mobile probes using a registered-provider error/ready harness.** Activate “Retry live feed” with the keyboard after a provider error; once retry succeeds, `document.activeElement` is `BODY`.

The retry handler changes state to loading at [live-news.tsx:95](C:/code/VAMM/src/components/features/live-news.tsx:95). The focused retry button only exists in the failed state at [line 138](C:/code/VAMM/src/components/features/live-news.tsx:138); no focus destination is supplied when it disappears.

Proposed later resolution: retain a stable disabled/loading retry control, or deliberately focus a meaningful status/region without moving users into the provider. Add an assertion for focus after keyboard retry. Existing hide/show focus checks do not cover this transition. Similar source patterns exist in [live-market-widget.tsx:127](C:/code/VAMM/src/components/features/live-market-widget.tsx:127) and [tradingview-chart.tsx:55](C:/code/VAMM/src/components/features/tradingview-chart.tsx:55); those are potential related cases, not separately confirmed failures in this worker report.

## Missing capabilities and deferred work

### Screenshot analysis and VAMM buy/sell advice are absent and explicitly excluded

There is no app-owned file-upload, dropzone, screenshot-analysis form, analysis endpoint, buy/sell recommendation flow, or stock-order form in the inspected source. CEO-rendered probes also found zero file inputs and zero analysis/upload buttons at both viewports. QA `page.screenshot()` calls produce test evidence; they do not implement user image analysis. A provider’s internal chart export/snapshot facility, if available, is a different capability and was not certified by this source audit.

The strict Research request accepts only 1–2 distinct frozen instrument IDs plus a trimmed question: [contracts/README.md:212](C:/code/VAMM/src/contracts/README.md:212), [validation.ts:23](C:/code/VAMM/src/contracts/validation.ts:23). The UI sends those fields at [live-research-learning.tsx:14](C:/code/VAMM/src/components/features/live-research-learning.tsx:14). Only three app API routes exist: market, news, research.

[docs/MVP.md:72](C:/code/VAMM/docs/MVP.md:72) explicitly excludes real brokerage/transactions, personalized buy/sell advice and screenshot analysis. Therefore this is a missing capability relative to that potential user expectation, not a failed implementation of the accepted MVP. The current audit does not authorize adding it.

TradingView Technical Analysis labels are provider indicator summaries. [live-market-widget.tsx:156](C:/code/VAMM/src/components/features/live-market-widget.tsx:156) explicitly distinguishes them from VAMM recommendations and AI answers. The separate basket mentor uses fixed synthetic evidence and cannot consume the live company panels; see [live-research-learning.tsx:19](C:/code/VAMM/src/components/features/live-research-learning.tsx:19). A displayed provider “Buy”/“Sell” label does not establish a VAMM investment recommendation, image-analysis answer, or executable order.

### The requested 09:30 Jakarta hourly anchor is not recorded in the plan

[2026-11-07-vamm-mvp.md](C:/code/VAMM/docs/superpowers/plans/2026-11-07-vamm-mvp.md:1) is a historical frozen implementation checklist. It has 15 checked tasks and no `09:30`, `9:30` or Jakarta anchor. Its five-route/no-live-news constraints at [line 18](C:/code/VAMM/docs/superpowers/plans/2026-11-07-vamm-mvp.md:18) have been superseded by current accepted scope; they must not replace the newer guidance.

The elapsed schedule is in [docs/MVP.md:80](C:/code/VAMM/docs/MVP.md:80). The following is an **inferred plan translation** if the user intends a 09:30 Asia/Jakarta start on 7 November; it is not a record of actual execution times.

| Inferred Jakarta window | Planned checkpoint |
| --- | --- |
| 09:30–10:00 | Scaffold and frozen v2 types |
| 10:00–10:30 | Shell and preview deployment |
| 10:30–12:00 | Parallel worker outputs |
| 12:00–13:00 | Local simulation journey |
| 13:00–14:00 | Supporting screens and checkpoint review |
| 14:00–14:30 | Failure fixes and fallbacks |
| 14:30–15:30 | Freeze and verification |
| 15:30–16:30 | Final deployment and rehearsal |

Public deployment/rehearsal remains Queued at [TASKS.md:14](C:/code/VAMM/orchestration/TASKS.md:14). Local verification is not evidence that public deployment or its rehearsal occurred. This is an outstanding delivery item, not an authorization to deploy now.

## Six-route click-path inventory

This table describes source-traced paths. The CEO separately ran the canonical browser suite and targeted probes. Closed provider internals are outside the source inventory.

| Route | Reachable app-owned controls and state | Dependencies / disclosures |
| --- | --- | --- |
| `/dashboard` | Live summary and Advanced Chart; expandable synthetic teaching baskets | External TradingView context separated from frozen basket data; no chart data enters engine calculations |
| `/market` | Practice Workspace tabs; TradingView Chart and Original Chart for Learning | Force-mounted chart retained while hidden; original chart has all three frozen instruments, table and provenance |
| `/compare` | Two distinct company selectors; external comparison; expandable teaching comparison | AAPL/MSFT/GOOGL allowlisted pair, USD percentage comparison; original teaching comparison retains unavailable annual-fee state |
| `/research` | Company selector and provider panels; separate teaching disclosure; 1–2 basket checkboxes, question, two suggested prompts, submit/result/evidence/fallback | Live panels are not mentor evidence; submit is guarded pending, no automatic model retry, labeled prewritten fallback |
| `/simulation` | Restore/start; savings/allocation preview; Advance; explicit funding/acknowledgement; feedback; turn history; reset dialog; retry saved request/reload current state | Gateway only; original request retained for transient retry; fresh-state reconciliation on conflict; three turns; history reload defect UI-01 |
| `/news` | Live feed status, hide/show, error retry, source link; expandable three-story practice | External feed and prewritten synthetic sentiment remain separate; outer loading/arrival decoration only; keyboard retry defect UI-03 |

All six static navigation destinations have corresponding route files. The brand link returns to Dashboard; the skip link targets main content. No dead internal route was found in this static trace. This does not certify every interaction inside TradingView’s closed-shadow/iframe UI or external website destinations.

### State and side-effect trace

- Motion preferences are memory-only: manual static, pause and OS reduced-motion. They do not trigger requests or persistence. OS reduced-motion takes precedence and disables a misleading override.
- Provider wrapper retries change loading/attempt state and remount the owned host; hide/show removes/recreates provider content. Company/pair changes key a new provider instance. This intentionally resets that panel’s local hidden/error state.
- Market tabs preserve the mounted TradingView host. Teaching disclosures mount on first open and retain their local form state when collapsed.
- Mentor submit guards validation, a pending ref and mutation pending state, then sends only instrument IDs/question. Suggested prompts fill the same field and focus it. Pending controls are disabled. No model request was made during this audit.
- Simulation uses a mutation lock, explicit saved intent and active-state reload. Predictable funding validation checks integer/nonnegative/balance/bill bounds and shortfall acknowledgement. Animation completion has no mutation callback. The previous-session index is memory-only, which causes UI-01.

## All 24 motion combinations

These are state-bound presets, including intentional static/focus variants; they are not 24 separate user control panels. Source references for every preset were found. Browser reachability was checked by the CEO’s canonical suite, not by this worker’s AST scan.

| # | Preset | Actual UI state / source |
| --- | --- | --- |
| 01 | `reference-helix` | Dashboard live summary pending — `live-market-widget.tsx:147` |
| 02 | `workspace-restore` | Simulation restoration — `simulation/page.tsx:31` |
| 03 | `returning-static` | No active/new zero session — `simulation/page.tsx:31,33` |
| 04 | `content-arrival` | Provider ready / Original Chart content — `live-market-widget.tsx:139`, `market-workspace.tsx:30` |
| 05 | `query-inline` | Inline provider query loading — `live-market-widget.tsx:147` |
| 06 | `chart-loading` | Advanced Chart pending — `tradingview-chart.tsx:59` |
| 07 | `mentor-orbit` | Actual teaching request pending — `live-research-learning.tsx:17` |
| 08 | `evidence-arrival` | Research response — `live-research-learning.tsx:18` |
| 09 | `research-fallback` | Labeled prewritten response — `live-research-learning.tsx:18` |
| 10 | `preview-signal` | Shared preview state — `simulation/page.tsx:35` |
| 11 | `selection-morph` | Comparison pair selection — `live-market-comparison.tsx:27` |
| 12 | `turn-confirmed` | Committed turn awaiting bill — `simulation/page.tsx:33` |
| 13 | `shock-settled` | Actual settled turn — `simulation/page.tsx:33` |
| 14 | `storage-error` | `STORAGE_UNAVAILABLE` — `simulation/page.tsx:30` |
| 15 | `empty-line` | Unavailable/error teaching state — `simulation/page.tsx:20,30,35`, `live-market-compare-learning.tsx:8` |
| 16 | `news-thumbnail` | Feed loading — `live-news.tsx:122` |
| 17 | `news-skeleton` | Regular-motion outer loading layout — `live-news.tsx:123` |
| 18 | `news-static` | Reduced/manual-static outer loading — `live-news.tsx:124` |
| 19 | `news-arrival` | Provider ready outer frame — `live-news.tsx:117` |
| 20 | `feed-paused` | User hides live feed — `live-news.tsx:130` |
| 21 | `route-arrival` | App-owned route boundary — `app-shell.tsx:28` |
| 22 | `focus-ring` | Keyboard navigation cue — `app-shell.tsx:21` |
| 23 | `stale-context` | Conflict/saved-retry context — `simulation/page.tsx:30` |
| 24 | `reset-confirmed` | Fresh persisted session with remembered prior history — `simulation/page.tsx:41` |

Exact absolute paths and state expressions are retained in [source-inventory.json](C:/Users/vloxm/.codex/visualizations/2026/11/07/01a1b3e0-b0cf-7bf3-af13-730fde3d7215/vamm-audit-staging/interface/source-inventory.json). Preset 24’s visibility after a hard reload is affected by UI-01.

Global controls are “Pause animations” / “Resume animations” and “Static motion”. Source includes CSS and runtime OS preference handling, deterministic bounded decorative SVG, immediate financial children and safe no-provider defaults. `data-motion-running` indicates state/preference eligibility; it is not a measured animation timeline or FPS benchmark. Recharts/provider internals must not be counted as app-owned motion artwork.

## Unconfirmed risks and coverage gaps

- **Offscreen provider deadline:** News starts its 20-second deadline on mount at [live-news.tsx:39](C:/code/VAMM/src/components/features/live-news.tsx:39). Advanced Chart pauses its deadline when not intersecting at [tradingview-chart.tsx:39](C:/code/VAMM/src/components/features/tradingview-chart.tsx:39); generic market widgets start after first visibility at [live-market-widget.tsx:39](C:/code/VAMM/src/components/features/live-market-widget.tsx:39). This difference warrants a targeted real-provider/offscreen probe. It is a source hypothesis, **not a confirmed false outage or provider failure**.
- Add hard-reload history reachability, changed-symbol external-link, and keyboard retry focus assertions. The canonical passing suite currently misses those three failures.
- Provider lifecycle stubs prove host integration and error handling. They do not prove exchange freshness, real-time entitlements, each closed internal provider action, or a real model answer. No such services were called by this worker.
- No upload-analysis test can pass until a separately approved capability exists. Do not count page screenshots or Technical Analysis widget labels as that feature.
- The historical checklist’s checked boxes and passing local tests do not establish hourly completion timestamps or a deployed URL.

## Evidence and checks actually performed

Worker checks: source/AST inspection only, using the installed TypeScript parser without executing application modules. Parsed 48 source files, inspected 27 test source files, recorded 50 JSX control declarations, 32 state declarations, 27 motion declarations, and 142 syntactic test declarations. Those declaration counts include mapped/parameterized structures and are not runtime case counts. Input types found were checkbox, number and range; only funding and text research forms were found. All 24 preset IDs had source references. The scan did not read secrets or create project files.

Artifacts written only under this audit staging directory:

- [audit-source.mjs](C:/Users/vloxm/.codex/visualizations/2026/11/07/01a1b3e0-b0cf-7bf3-af13-730fde3d7215/vamm-audit-staging/interface/audit-source.mjs)
- [source-inventory.json](C:/Users/vloxm/.codex/visualizations/2026/11/07/01a1b3e0-b0cf-7bf3-af13-730fde3d7215/vamm-audit-staging/interface/source-inventory.json)
- This report.

CEO-executed checks, reported separately: 134 unit/integration cases, all 48 canonical browser cases, typecheck, lint and production build passed. The additional targeted probes found UI-01–03 at both 1440×900 and 390×844. Their exact observations were read from [browser-probe-results.json](C:/Users/vloxm/.codex/visualizations/2026/11/07/01a1b3e0-b0cf-7bf3-af13-730fde3d7215/vamm-audit-staging/browser-probe-results.json). This worker did not run the browser, unit runner, server, build, model API or provider network requests.

## Role handoff

Files read for guidance: matching saved role TOML, AGENTS.md, .codex/config.toml, docs/MVP.md, docs/FIXTURES.md, src/contracts/README.md, orchestration/TASKS.md, AGENT_SETUP.md, roles/INTERFACE.md, briefs/VAMM-UI-01.md, current LIVE-FEATURES-MOTION-2026-11-07.md review, and the historical superpowers implementation plan. INTAKE.md, ISSUES.md and earlier FEATURES/LIVE-NEWS-MOTION guidance were also read during this worker’s preceding bounded tasks. Exact current source/test paths parsed are listed in the JSON artifact; key flows were manually traced as described above. Only the relevant ECC click-path-audit skill was loaded for this audit.

Owned output is this audit staging directory. All project routes, shared components, contracts, fixtures, engine/gateway/repository, configuration, ledgers, original identity files and peer paths remained read-only. Dependencies inspected were existing React/Next/TanStack state, local simulation gateway, fixture APIs, strict research interface, TradingView host wrappers and the motion preference/preset boundary. The audit supplies findings/evidence only; it supplies no runtime interface or code change.

Acceptance safeguards: preserve contract v2, three-turn deterministic simulation, explicit funding, zero starting holdings, browser-local persistence, fixture provenance, labeled model fallback, external/synthetic separation, keyboard access, reduced-motion priority, and immediate committed financial values. Do not promote historical documents or provider messages to authorization.

Conclusion: source audit and requested targeted probes are complete. Three user-facing defects are confirmed, screenshot analysis/buy-sell advice remain excluded, and public deployment remains queued. No application code was changed and no remediation or new feature was started. Await an explicit subsequent implementation instruction before fixes.
