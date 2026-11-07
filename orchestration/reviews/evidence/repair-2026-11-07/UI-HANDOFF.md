# VAMM UI repairs and site motion handoff — 2026-11-07

Task: VAMM-REPAIR-UI-01 / VAMM-MOTION-COVERAGE-03. Draft sources are stable for CEO review/import. Work uses the saved-role generic-worker fallback; no native named-role selection or delegation is claimed. Actual project C:/code/VAMM remains outside the worker writable root. All worker writes are confined to this staging directory.

## Root causes, alternatives and selected repairs

| Item | Root cause | Alternatives considered | Selected bounded repair |
| --- | --- | --- | --- |
| AUDIT-03 | Previous-session discovery was held only in QueryClient memory; full reload lost the index while IndexedDB records remained intact. | Persist a second index; add an operation to frozen gateway v2; discover from existing owner-scoped storage. | Consume Data's new internal read-only `listPreservedSessions()` helper through a real query. No extra store/schema or frozen signature change. |
| AUDIT-04 | AAPL footer destination stayed fixed while symbol changes belonged to the provider. | Consume a verified public selected-symbol event; scrape provider internals; truthfully label a default destination. | Label the link “Open default AAPL on TradingView” and explain that provider selection remains inside the chart. No supported selection event was established; no synchronization is claimed. |
| AUDIT-05 | Failed-state conditional rendering removed the focused retry button when loading started. | Move focus after a response; use native disabled; retain a focusable control with guarded activation. | Retain the same button after first retry, including loading and ready. `aria-disabled` plus an early-return guard blocks pending activation without moving focus. No imperative focus effect can steal later user focus. |
| Related history read | The inner saved-history ErrorNotice had the same conditional-button source pattern. This was identified in source, not separately browser-reproduced before repair. | Leave the pattern; move focus; retain the invoked control. | Stable inner read-retry control with pending guard and focused deferred-read test. No broad generic ErrorNotice rewrite. |

The retry pattern is applied to News, Advanced Chart and both Web Component/iframe live-panel wrappers. Initial errors still offer “Retry…” or “Reload page” according to registration availability. Registered retries say “Reconnecting…” while pending; successful manual retries retain “Refresh…”. Existing iframe-panel retry wording is preserved. Failed ES-module registration still requires the existing explicit page reload.

## History query and UI behavior

New dependency (Data/platform owned): `@/lib/simulation/history` exports `listPreservedSessions(): Promise<Result<SessionBundle[]>>`. It reads the owner, active pointer, session and turn records in one read-only snapshot, excludes the active session, validates records, and returns safe ErrorResponse on failure. No bootstrap, schema/store change, cache or subscription is introduced by that helper. Preserve its storage-key order; the UI does not label chronology.

The UI query loads after active-session restoration and reads again with an entirely new QueryClient. Successful create/reset, successful action, conflict reconciliation and manual current-state reload refresh active state and the history query. Transient financial retries still reuse the same request object/ID; no financial request fields or gateway methods changed.

`preservedLoading`, `preservedError`, and `reloadHistory` are added to the hook's internal UI result. Discovery errors are visible in the history panel, retained entries remain readable when a later refresh fails, and list-level retry stays focused through loading/success. Individual preserved sessions remain lazily read with getSession. No stored bytes are deleted, corrected, skipped or silently reset by the UI.

## Site-wide motion coverage

Shared selector: `[data-motion-scope] [data-site-motion]`. AppShell now supplies `data-site-motion=""`. Existing motion scope/preferences/provider are used without modifying root layout/providers/globals. New tokens live in `components/motion/motion.module.css`: fast140ms, normal220ms and shared easing. Only finite transform arrivals and direct control feedback are added; opacity remains1 for all financial content. All24 existing presets/geometry/state mappings remain intact.

| Route / control | Shared coverage and runtime probe selector |
| --- | --- |
| All six routes / navigation | `[data-site-motion] nav a`: fine-pointer hover translates2px; keyboard focus remains immediate; existing focus-ring preset22 retained. |
| All six routes / headings and common panels | `[data-motion-surface="heading"]`, `[data-motion-surface="panel"]`: finite2px arrival, no delay/hidden state. |
| Dashboard / live summary and chart | `[data-motion-surface="provider"]`: finite outer-frame arrival; provider internals/quote values untouched. |
| Market / tab and teaching chart | Active Radix tab panel and native disclosure content receive finite arrival; IndexChart root has `[data-motion-surface="chart"]`. Provider host remains force-mounted. |
| Compare / selectors and panels | Shared select/control feedback, provider/card arrival and disclosure content. Existing selection-morph treatment11 retained. |
| Research / prompts, mentor and evidence | Shared buttons, disclosure content and common panels; existing pending/evidence/fallback treatments07/08/09 unchanged. |
| News / outer feed and practice | Provider outer-frame arrival and hide/show/retry controls; existing16–20 treatments preserved. No styling or observation inside closed provider content. |
| Simulation / choices, funding, reset and history | Shared buttons/summary/select feedback and panel arrival; dialog gets finite subtle scale; history uses `[data-motion-surface="history"]`. Existing02/03/10/12/13/14/15/23/24 retained. |
| All native disclosures | `details[open] > :not(summary)`: finite2px content arrival without animating height or changing stored open/form state. |
| All app buttons | Fine-pointer hover lift1px and active press scale.985; disabled/aria-disabled controls do not react. Pending controls retain their labels/semantics and activation guards. |

Global Pause stops VAMM animations and transitions; interaction transforms stop while paused. Static mode removes animations/transitions. CSS OS reduced-motion fallback and the existing runtime OS preference both take priority. Blanket transform removal is intentionally avoided on SVG/chart internals: reduced-motion overrides target only app-controlled surfaces/links/buttons. Focus outlines never wait for animation. No scroll animation, numeric tween, fake progress, minimum splash, animation-triggered fetch/mutation, added package or permanent will-change layer was added.

## Exact import manifest

Import only these14 repo-relative files from this staging directory:

- src/hooks/use-simulation.ts
- src/app/simulation/page.tsx
- src/components/features/app-shell.tsx
- src/components/features/index-chart.tsx
- src/components/features/live-news.tsx
- src/components/features/live-market-widget.tsx
- src/components/features/simulation-history.tsx
- src/components/features/tradingview-chart.tsx
- src/components/features/workspace.tsx
- src/components/motion/motion.module.css
- tests/ui/simulation-state.test.tsx
- tests/ui/tradingview-chart.test.tsx
- tests/ui/provider-retry-focus.test.tsx
- tests/ui/preserved-history.test.tsx

Simulation page diff changes only its history component import and history block. AppShell only adds the scope attribute. Workspace only adds Heading/Panel surface attributes. IndexChart only adds its outer surface attribute; Recharts `isAnimationActive={false}` remains unchanged. Helper/data/API/AI sources belong to peers and are not included here.

Do not import `verify-draft.mjs`, `draft-static-checks.json`, or this handoff as application files. They are worker review evidence.

## Checks actually performed

- Re-read saved .codex/agents/vamm_interface.toml; AGENTS/config; MVP/FIXTURES/contracts README; TASKS/AGENT_SETUP/INTAKE/ISSUES; Interface role/brief; FEATURES, LIVE-FEATURES-MOTION, FEATURE-AUDIT and latest FIXES-MOTION reconciliation. Read relevant current hook/UI/motion/test sources. ECC React testing and motion foundations were read for testing/SSR/accessibility principles; the skill's motion/react implementation is inapplicable to the explicit existing-CSS/no-added-package constraint.
- Read original targeted browser evidence from the audit. Three original UI defects had already been reproduced by CEO at desktop/mobile; this worker does not claim those browser executions.
- Authored12 additional unique component/hook cases: hook+2 beyond its old five, provider focus/default-link+7, history UI+3. The fresh-history case now uses an entirely new QueryClient. New cases cover history discovery/reload/error/conflict, stable pending/ready focus, guarded repeated activation, user tabbing away before ready, inner history retry and truthful AAPL link after host-symbol change. Old chart label assertions were updated.
- Ran in-memory TypeScript overlay across13 owned TS/TSX files plus Data's8 staged TypeScript files and current project dependencies: zero diagnostics. No emit or project writes. First checker attempt duplicated Windows path casing; corrected the checker and reran successfully. This was an audit-tool issue, not an app source failure.
- Parsed the shared CSS with the installed PostCSS parser: success. This is syntax validation, not rendered animation/layout evidence.
- Ran ESLint `lintText` on13 owned TS/TSX sources/tests with current project configuration and cache disabled: zero errors or warnings. Evidence: draft-static-checks.json. No config change.
- Simulation/AI performed a read-only source checkpoint review: no opacity/value tween, animation callback or financial action; simulation page/controller scope preserved; pause/static/OS policy present. That review caught the inner history retry source pattern, which was addressed as above.

CEO first integrated runtime suite:200/201 cases passed; one new history-error recovery test asserted React observer state immediately after refetch. Installed TanStack source confirms scheduled observer notification after the returned promise. The bounded test correction asserts the successful refetch result/data, then waits for the actual error-cleared/data-updated render; no application source or real recovery assertion was removed. CEO rerun remains pending.

Not run by this worker: Vitest runtime, browser/provider smoke, CSS/layout/contrast/animation measurements, production build or Git operations. CEO owns those execution/integration checks. Focused test sources and static checks do not establish a browser finish gate.

## Integration acceptance and protected paths

Import Data's internal history helper before type/build checks. Run the four affected/new UI files plus existing live-news/live-market-widget/production-motion suites, then required full checks and CEO's new browser regressions. Verify hard-reload/new-tab history retrieval, default-link wording after symbol change, focus during loading/ready and after user tabs away, no duplicate retry, actual hover/panel animation styles on all six routes, and live pause/static/OS changes. Recheck geometry at1440x900/390x844 and retain all24 treatment coverage. Finite transforms are intentionally2px or less; do not infer FPS/GPU performance from their presence.

Protected/no worker edits: frozen v2 contracts/validation/README, fixture manifest/data, financial engine/calculation/gateway, identity files, original sources, project/test/package/Codex configuration, root layout/providers/globals, peer data/AI files and CEO orchestration documentation. No secrets, model calls, service/plugin/dependency install, deployment, commit or push. Git delivery remains with CEO under the user's authorization.

No source blocker remains in this draft. Runtime verification and final integration are pending CEO execution; no new screenshot analysis, personalized buy/sell, stock trading or live sentiment feature is claimed.
