# Simulation / AI audit — 2026-11-07

Read-only production audit against CEO-supplied baseline `fe56e99`, in `C:/code/VAMM`. Saved Simulation/AI instructions were read through a generic worker; no native named-role loading or further delegation is claimed. Only the assigned writable audit staging folder was changed.

## Findings

| Finding | Evidence and observed consequence | Resolution proposed for a later authorized fix |
|---|---|---|
| Model prose can be unsupported despite a valid evidence ID | `src/lib/ai/research.ts:62–70` validates shape and ID membership, then publishes arbitrary summary/fact prose as `origin: model`. All three CEO-executed adversarial stub cases failed: fabricated live valuation, guaranteed personalized buy/sell advice, and incorrect 99% synthetic return were accepted. These are deliberately mocked outputs, not responses observed from a live model. `src/contracts/README.md:215–216` requires unsupported facts be omitted or marked unavailable; the UI calls accepted facts “Grounded observations” at `src/components/features/live-research-learning.tsx:18`. | Resolve claims against server-owned supported facts/metrics, including summary claims, and fall back when unsupported. A prompt and valid citation ID alone do not establish factual support. Preserve frozen data/contracts; do not enable a live provider to test this gap. |
| Requested screenshot analysis / personalized trading analysis is unimplemented by design | `docs/MVP.md:72–74` explicitly excludes screenshot analysis, personalized buy/sell advice, brokerage and autonomous allocation. `src/contracts/validation.ts:23` accepts only frozen instrument IDs and a text question; `:22` permits only ADVANCE / SETTLE_SHOCK mutations. The actual research form at `src/components/features/live-research-learning.tsx:15–16` has instrument checkboxes and a textarea, with no image/file input. Production API inventory contains only market/news/research. | Report as missing relative to expanded user expectations, not a broken accepted feature. Any future image/trading capability requires a separately accepted scope, evidence model and contract. |
| Live model / public deployment is unverified | A real server-only Responses path exists at `src/lib/ai/server-provider.ts:5–26`, with immediate unconfigured fallback. No actual credentials or provider configuration were inspected; no live model call was made. `orchestration/TASKS.md:14` and `:145` keep deployment queued. | Preserve this distinction in the completion report: local deterministic/fallback checks do not prove deployed or real-provider operation. |
| Original checklist is not the requested hourly plan | `docs/superpowers/plans/2026-11-07-vamm-mvp.md` has completed work checklists, no 09:30 schedule, and line18 retains a historical live-news exclusion superseded by current presentation authorization. | CEO should create the current hourly Markdown plan and label its 09:30 start as the user-provided planning anchor, not a reconstructed execution timestamp. |

TradingView Technical context can display provider indicator summaries. That independent presentation is not screenshot interpretation, a model reading the widgets, or a VAMM trading/order engine. `src/app/research/page.tsx:15` and `src/components/features/live-research-learning.tsx:19` explicitly separate the synthetic basket mentor from live company panels.

## Financial / failure-path review

The engine still supplies preview and ADVANCE through the same contribution helper. ADVANCE records a pending bill without deduction; settlement uses explicit supplied funding, preserves returns and inflation, and creates no debt. Gateway replay precedes version checks, with repository commit remaining atomic; feedback reads committed records and never repeats a mutation (`src/lib/simulation/gateway.ts:52–87`, `src/lib/ai/feedback.ts:7–22`). Existing source tests cover reference money, three turns, zero savings, shortfall acknowledgment, ordered remainder, safe integers, negative returns, replay/conflicts, feedback mismatch and retries.

Research still has a 15-second cancellation deadline and no automatic retry (`research.ts:54–74`); malformed, unknown-evidence, refusal, incomplete and unavailable outputs use labeled fallback. Server response bytes are bounded at 32 KiB (`server-provider.ts:29–43`). Route limits are process-local, not a distributed billing quota (`src/app/api/research/route.ts:7–27`). The data worker separately owns endpoint image/extra-context negatives and derived storage-integrity probes, avoiding duplicate edits. CEO subsequently reported confirmed failures in MIME validation and derived-field integrity; those details remain in the data handoff.

## Checks and staged files

- CEO reports the unchanged baseline suite passed 134 unit/integration and 48 browser cases during this audit. These are CEO-executed results, not a worker claim of running them.
- CEO executed `tests/ai/audit-grounding.test.ts`: **three expected failures**, all receiving `origin: model` instead of the required fallback.
- `tests/simulation/audit-funding.test.ts`: **all three cases passed in CEO execution**, covering explicit mixed funding, no substitution from other assets, and smallest nonzero preview parity.
- Before CEO execution, both authored files passed worker-run TypeScript transpile syntax checks; that worker check itself was not a full typecheck or runtime test.
- Read-only source/API inventories and independent UTC-to-Jakarta conversion were performed. No model/service access, deployment or production mutation was performed.

## Independent schedule check

At `2026-11-07 05:48:52 UTC`, Jakarta was `2026-11-07 12:48:52+07:00`, three hours 18 minutes 52 seconds after the user's 09:30 anchor. Jakarta is UTC+7; do not display the UTC clock as local time. No exact execution-start record establishes that actual work began 09:30.

| Jakarta planning window | Derived from MVP elapsed schedule | Evidence distinction |
|---|---|---|
| 09:30–10:30 | Scaffold/types until 10:00; shell/preview until 10:30 | Local implementation is recorded complete; the public preview deployment exit condition remains unverified/queued. |
| 10:30–11:30 | Parallel outputs | Completion checklists exist; no per-hour execution timestamps prove completion in this historical window. |
| 11:30–12:30 | Parallel outputs until 12:00, then local journey | Same distinction: accepted planning times are not actual timestamps. |
| 12:30–13:30 | Local journey until 13:00, then supporting screens/checkpoint | At the checked midday time this is the current planning block. Local regression tests pass, with separate new audit failures outstanding. |
| 13:30–14:30 | Supporting screens until 14:00; failures/fallbacks until 14:30 | Prioritize confirmed audit findings; testing alone does not authorize feature implementation. |
| 14:30–15:30 | Feature freeze and verification | Report actual checks and remaining limits. |
| 15:30–16:30 | Final deployment and rehearsal | Future relative to the checked clock; public deployment is still queued. |

## Files actually consulted

Guidance: `AGENTS.md`, `.codex/config.toml`, `.codex/agents/vamm_simulation_ai.toml`, `docs/MVP.md`, `docs/FIXTURES.md`, `docs/AEGIS_RUNTIME.md`, `src/contracts/README.md`, `orchestration/TASKS.md`, `orchestration/AGENT_SETUP.md`, `orchestration/INTAKE.md`, `orchestration/ISSUES.md`, `orchestration/roles/SIMULATION_AI.md`, `orchestration/briefs/VAMM-SIM-01.md`, `orchestration/reviews/LIVE-FEATURES-MOTION-2026-11-07.md`, and `docs/superpowers/plans/2026-11-07-vamm-mvp.md`.

Implementation/test evidence consulted: `src/contracts/validation.ts`, `src/lib/simulation/engine.ts`, `src/lib/simulation/gateway.ts`, `src/lib/ai/research.ts`, `src/lib/ai/server-provider.ts`, `src/lib/ai/feedback.ts`, `src/app/api/research/route.ts`, `src/app/research/page.tsx`, `src/components/features/live-research-learning.tsx`, relevant provider-isolation lines in `src/components/features/live-market-widget.tsx` and `src/lib/data/tradingview-widgets.ts`, `tests/ai/research.test.ts`, `tests/simulation/engine.test.ts`, `tests/simulation/gateway.test.ts`, and `package.json`. A narrowed source search/API-file inventory was also performed; a saved QA screenshot is not an application screenshot-input feature.

## Ownership and limits

This audit supplies staged tests/report only. All production engine, gateway, AI, API, DB, UI, contracts, fixtures, dependencies, configuration, ledgers, and original IDENTITY/SOUL/USER sources remain outside this worker's current mutation authority. Data/platform supplies fixtures and persistence; Interface/CEO supply presentation and integrated execution. Aegis remains application runtime coordination, separate from this development worker. No implementation or fix was started by this audit.
