# Audited failure repairs and site-wide motion — 2026-11-07

User authorized reproducing failures, finding causes/alternative repairs, implementing animation throughout the website and updating Git using the three workers. User explicitly confirmed protected files means contract v2, frozen fixtures, simulation calculations, original identity files and project configuration; targeted feature repairs are allowed. The later teammate-design instruction was integrated into the same delivery.

**Outcome: all six confirmed application defects are repaired.** The unchanged original27 audit probes now pass; the integrated app passes201 unit/integration tests and60 desktop/mobile browser cases, TypeScript, ESLint and production build. Thirty additional route/width checks at320/768/1024/1440/1920px have no page errors or document overflow. All36 protected-file hashes match baseline `fe56e99`. This is local verification, not a claim of public deployment or actual model delivery.

## Causes, alternatives and implemented repairs

| Finding | Cause | Approaches considered | Implemented repair and evidence |
|---|---|---|---|
| AUDIT-01: unsupported model prose | Shape/valid citation-ID checks did not establish support for summary, facts or limitations | Parse/filter unrestricted prose or pay for another model judge; alternatively constrain the model to supported selections and render server-owned text | Private `research-selection.v1` protocol selects scoped summary/claim/limitation IDs. Independent strict server validation renders canonical text/evidence; provider receives a clone. Genuine successful selections remain model-origin with a clear selection/prewritten-text disclosure. Arbitrary prose, unknown IDs, cross-basket IDs and extra fields fall back. Original3 adversarial cases and positive model cases pass. Public ResearchRequest/Response unchanged. |
| AUDIT-02: inconsistent derived stored values | Restore checked structure/accounting and mutual index equality, but not purchasing power/inflation against the frozen engine | Duplicate formulas/hardcode constants; refactor the protected engine; replay every full financial history; or use existing pure helpers plus a cached bounded reference journey | New derived validator uses `calculateRealBalance` and six pure reference ADVANCE/SETTLE calls for exact frozen inflation indexes. Candidate/restore validation rejects inconsistent values, including initial/earlier turns, while preserving bytes/history and rollback. Existing engine/gateway unchanged; original2 corruption probes pass. |
| AUDIT-03: inaccessible preserved history after reload | Saved session IDs existed only in QueryClient memory | Add a persisted history index/store; or discover existing owner-indexed records read-only | New internal history helper reads existing owner, active pointer, sessions and turns in one readonly transaction. It validates all owned bundles, excludes active, propagates errors, creates no identity and changes no schema. UI uses an actual query/reload with visible history errors. Full reload and a fresh browser tab retrieve history without changing any of four stores. Order is IndexedDB key order, not invented recency. |
| AUDIT-04: misleading external chart destination | Footer URL was always AAPL while the provider allowed symbol changes | Synchronize through a documented selection signal; or explicitly identify the default destination | No reliable selected-symbol signal was established. Footer now says “Open default AAPL on TradingView” and explains its scope. Provider symbol changes remain intact. Desktop/mobile tests set MSFT and verify truthful AAPL labeling/URL. No closed-provider scraping. |
| AUDIT-05: keyboard retry focus loss | Conditional retry button was removed during loading/success | Imperatively restore focus after asynchronous completion; or keep a stable control with guarded pending state | News/chart/live-panel and history retry controls stay mounted after activation, use an explicit pending guard/aria-disabled state, and do not force focus after the user moves. Browser tests verify loading/ready focus, no duplicate retry, and no focus stealing; focused history-read regressions also pass. |
| AUDIT-06: invalid media type accepted | `startsWith('application/json')` accepted JSONP and suffix impostors | Use a new parser dependency or normalize the token before parameters and compare exactly | Exact trimmed/lowercase media token equality preserves case/charset behavior and byte limits. Original2 isolated failures pass; actual local HTTP JSONP returns400, multipart400, valid fixture GETs200 and unsupported methods405. Eight direct HTTP checks pass with models disabled. No exploit was claimed. |

## Ownership, protected scope and actual worker checks

Three existing generic workers read saved role instructions/common guidance/roles/briefs and reconciliation reports; Simulation/AI also read AEGIS runtime guidance. No native named-role selection or recursive delegation is claimed. Workers staged disjoint files, CEO reviewed/imported and ran actual project checks through approved explicit `C:/code/VAMM` commands. Session native cwd remains the unrelated nonexistent `C:/code/VAAM`; no global ACL/trust change was made.

- Interface: hook/history UI, stable retry controls, truthful chart link, scoped shared motion and focused UI tests. Worker TypeScript/ESLint/CSS checks passed; CEO browser/runtime results are reported separately.
- Data/platform: derived validator, exact media guard, new internal history read helper and35 focused tests. No database schema, repository public API, owner bootstrap or engine edit.
- Simulation/AI: private supported-selection catalog/adapter, positive/failure research tests and original adversarial regressions. No real model call.
- CEO: integration, browser regressions, source protection proof, intake/task/issues/reviews and Git delivery. Later teammate-design ownership is in `TEAM-DESIGN-2026-11-07.md`.

Protected36 files cover root layout/page/providers/globals, AGENTS, .codex roles/config, project/package/test configuration, accepted MVP/fixture/AEGIS guidance, v2 contracts/validation, frozen data and market/news APIs, financial engine/gateway, database/owner/repository and prewritten feedback. The history hook and validators are authorized repair targets rather than protected calculation sources. No original IDENTITY/SOUL/USER file was edited. No dependency, plugin, paid service, extra backend or manual deployment was added.

## Motion throughout the site

All24 existing recipes remain reachable through actual UI states. Shared scoped motion now covers shell/navigation, headings/panels, buttons/selectors/disclosures/tabs, provider outer frames, charts, history and the reset dialog on all six routes. Brief140/220ms transforms keep content fully opaque and immediately available. Pause stops VAMM timelines/transitions; static/live OS reduction removes decorative motion and interaction transforms. Financial values are never counted up, hidden or delayed; no animation callback changes state, submits a request or remounts a financial controller. Third-party widget internals remain external.

The teammate Home hero and cards use the same layer. The illustrative SVG is decoration labeled “not market data”; capability tiles describe fixed defaults, not current balances/XP. Global preference state remains memory-only. Canonical browser tests reach all24 recipes on both viewports and verify focus, visible committed money and unchanged financial snapshots.

## Verification record and initial failures

| Executed check | Actual final result |
|---|---|
| Original isolated audit probes | 27/27 pass; previously20pass/7fail, reproduced before edits |
| Full unit/integration suite | 201/201 pass across25 suites |
| Full browser suite | 60/60 pass in36.0s, desktop1440x900/mobile390x844 |
| TypeScript / ESLint / production build | Pass; no dependency/config change |
| Additional responsive render | 30/30 route-width checks; no page errors or overflow at320–1920px; hero SVG decoded successfully |
| Rendered text contrast | Zero failures across24 screen/state combinations, including teaching disclosures, mentor fallback, pending funding and reset dialog |
| Local HTTP / real Market views | 8/8 HTTP checks; actual AAPL/1D chart ready and original values table visible at both widths |
| Frozen-source protection | 36 SHA-256 matches, zero differences; proof saved with file list |
| Diff / narrow source scan | Whitespace check passes; no matches for tested credential patterns, console logging, unsafe HTML or eval in source. This is not a comprehensive security certification. |

Initial integrated UI test run was200/201: the history-recovery assertion ran before TanStack's scheduled observer update. Installed library source confirmed deferred `notifyManager.batchCalls`; the test now verifies returned success/data and waits for the actual React recovery while still asserting no mutations. No app behavior was weakened. Subsequent full201-case runs pass.

An intermediate56-case browser checkpoint had55 passes and one localhost GET `/api/market` ECONNRESET in the all24 case. The server stayed running without logged errors; the unchanged isolated case passed on a fresh connection. Exact transport cause remains unconfirmed. The final full60-case run passes without retry configuration or safeguard changes.

Early canonical full-page Home capture preceded lazy SVG decoding. A separate real render check waited for `complete && naturalWidth > 0`, verified the image at1440/1920px and captured usable previews. No asset failure or application change was required. Changed code line endings/trailing EOF blanks were normalized to repository convention; protected files were excluded.

Real TradingView modules/panels and visible comparison/fundamentals were checked separately. Auxiliary support/business-info failures and aborted provider bundles remain recorded; core displays rendered with no app page errors/overflow. Iframe `panel` state is only an opened document, not a guarantee of complete/fresh financial data.

## Remaining limits and plan

Screenshot upload/analysis, personalized buy/sell advice, stock orders, Academy/Missions/profiles, live sentiment classification and live-grounded AI answers remain absent/deferred under the accepted MVP. This repair does not activate them. Actual configured-model delivery and public deployment/rehearsal remain unverified; no credentials were inspected or services provisioned.

The09:30 Jakarta hourly review is preserved in `FEATURE-AUDIT-2026-11-07.md`. Current work completes the supporting-screen/repair checks ahead of the original14:00–14:30 repair window. The15:30–16:30 deployment/rehearsal window is a planning target only; DEMO remains queued.

Evidence: `orchestration/reviews/evidence/repair-2026-11-07/`, current `tests/e2e/evidence/`, and teammate provenance/render evidence in `orchestration/reviews/evidence/team-design-2026-11-07/`. Git delivery is to the existing Naixoo1/VAMM main, preserving its history; no force push or change to the teammate source repository.
