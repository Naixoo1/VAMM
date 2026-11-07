# VAMM feature audit and 09:30 hourly review — 2026-11-07

Review snapshot: 12:58 Asia/Jakarta (UTC+7), 3h28 after the user's 09:30 planning anchor. This translates the user's stated start into the existing elapsed schedule; it does not reconstruct actual completion timestamps.

**Outcome: the baseline passes, but six newly confirmed application defects remain open. Screenshot chart analysis and VAMM buy/sell advice are absent. The app is not ready for an unconditional release sign-off.**

## Scope and actual execution

Project: `C:/code/VAMM`, baseline `fe56e991b2a36c396f9fe21053b924c65d63f7a0`, tracking `Naixoo1/VAMM`. Session cwd still names nonexistent `C:/code/VAAM`; main-agent project commands used the platform-approved escalation path. No global ACL, trust, or source-folder setting was changed.

The three existing generic workers were resumed with their saved `.codex/agents/vamm_*.toml`, common guidance, role guides, briefs and current reconciliation report explicitly supplied. Simulation/AI also read `docs/AEGIS_RUNTIME.md`. Native named-role selection is not claimed. Workers did not delegate. Their staged reports identify the files actually read and distinguish source review from CEO-run runtime checks.

| Worker | Read-only responsibility | Dependencies and handoff |
|---|---|---|
| Interface | Six routes, owned controls, history reachability, motion, screenshot entry points | Consumes gateway/hooks/provider hosts; supplies source inventory and UI reproduction report. CEO reproduced three UI defects on desktop/mobile. |
| Data/platform | API input/media guards, local repository/derived integrity, provider boundaries | Supplies 19 request probes and two fake-indexeddb probes; CEO executed them: 17 pass / 4 fail. |
| Simulation/AI | Frozen funding/preview behavior, model grounding, schedule reconciliation | Supplies three grounding and three funding probes; CEO executed them: 3 pass / 3 fail. Aegis remains separate application runtime coordination. |

This task changed reports/evidence only. No production source, contract, fixture, dependency, configuration, or original IDENTITY/SOUL/USER file was changed. A SHA-256 comparison of all 59 `src/**` files found zero differences. No real model call, new plugin, paid data service, deployment, commit, or push was performed. The local production test process has `VAMM_DISABLE_MODEL=1`.

## Executed checks

| Check | Observed result | Limit |
|---|---|---|
| Production build, TypeScript and ESLint | All pass | Does not prove financial or semantic correctness. |
| Existing Vitest suite | 134/134 pass, 18 suites | New adversarial probes expose gaps outside this suite. |
| Existing Playwright suite | 48/48 pass, desktop/mobile | External services are stubbed in the repeatable suite. |
| New isolated Vitest probes | **20 pass / 7 fail**, 27 assertions | Three grounding, two stored-integrity and two media-type failures; provider responses are mocked, not live model output. |
| New UI probes | Three defects reproduced at both 1440px and 390px | Separate from the 27 Vitest assertions; see browser-probe JSON. |
| Real provider smoke | Dashboard, Compare, Research and News opened at desktop/mobile: 8 route/viewport checks; no app page errors or horizontal overflow | Web Component readiness is observed. Legacy iframe `panel` means document opened, not certified data freshness. |
| Longer real fundamentals check | Values visibly populated after 15 visible seconds at both widths; no app page error or overflow | An auxiliary `widget-data-business-info` request failed at both widths. Core fields rendered; complete provider availability is not certified. |
| Real Market / Original Chart | Both viewports: provider ready, AAPL/1D defaults, learning tab and disclosed values table visible, no page errors or overflow | First probe forgot to expand the existing table disclosure and timed out. Corrected only the runner; both views then passed. Initial report retained. |
| Direct local HTTP checks | 7/8 pass: frozen GETs, unsupported methods and multipart rejection; JSONP type still returns200 | Confirms AUDIT-06 in the actual production route with model disabled. The runner exits1 for this genuine failure. |
| Runtime dependency audit | `npm audit --omit=dev --json`: zero findings | Existing eight moderate dev-only lint-chain advisories remain documented separately. |
| Current SHA's GitHub static review | Workflow completed successfully | Static review is not build/test CI or deployment evidence. |
| Source preservation | 59 source-file hashes unchanged | Report/evidence files intentionally added; no claim that every workspace artifact is untouched. |

Coverage percentage was not measured; the coverage provider is not installed and was not added. Actual configured-model delivery, public deployment/rehearsal, provider internals, arbitrary issuers/currencies, exchange latency and continuous feed freshness remain unverified.

Feature coverage includes Dashboard's live and synthetic views; both Market tabs; Compare's two-company overlay and synthetic metrics; Research selectors, synthetic question prompts/fallback and request negatives; News hide/show, retry/offline and separate practice; Simulation's three turns, shared-engine preview, explicit funding, duplicate/stale requests, cross-tab conflicts, reset and storage failures. All24 motion treatments and pause/static/OS-reduced-motion controls are exercised by the canonical browser suite. Existing green tests do not supersede the new failures below.

Workflow evidence: [existing static review](https://github.com/Naixoo1/VAMM/actions/runs/42342452013).

## Confirmed defects and bounded repair proposals

### AUDIT-01 — P1: accepted model prose can contradict its cited evidence

`src/lib/ai/research.ts:62–70` validates output shape and evidence-ID membership, then returns the prose as `origin: model`. The UI calls facts “Grounded observations” in `src/components/features/live-research-learning.tsx:18`. `src/contracts/README.md:215–216` requires unsupported facts to be omitted or marked unavailable.

Three mocked responses cite valid `ev-demo-method` while inventing a live company valuation, personalized buy/sell/guaranteed-profit text, or a 99% synthetic return. All three were accepted instead of producing a labeled fallback. These are controlled injected outputs, not claims about what a real model actually returned.

Owner: Simulation/AI. Proposed repair: resolve supported claims/metrics against server-owned evidence, including summary claims, and fall back on unsupported content. A valid evidence ID and prompt instruction alone do not establish support. Preserve the response contract and fixture values; do not add browsing or a paid provider.

### AUDIT-02 — P2: restore accepts inconsistent derived money and inflation values

`src/lib/db/state-validation.ts:22–64` checks schema, linkage, balances and funding, but does not fully reconcile derived purchasing power or the cumulative inflation chain. After creating a correct first turn with the real engine in fake-indexeddb:

- Increasing only persisted real purchasing power by Rp1 still makes `getSession` return `ok: true`.
- Changing both the session and last-turn cumulative inflation index from 1.03 to 1.5 still makes `getActiveSession` return `ok: true`.

Both assertions expecting a visible storage-integrity error failed. This is a local corruption-detection gap, not a claim of authentication or tamper resistance. Local tamper resistance remains out of scope.

Owner: Data/platform with Simulation/AI math support. Proposed repair: share deterministic reconciliation during restore, preserve existing bytes/history, and surface corruption without silent reset. Any necessary shared-interface change requires explicit contract review rather than an unversioned extension.

### AUDIT-03 — P2: preserved history becomes unreachable after a full reload

`src/hooks/use-simulation.ts:11,25,31` keeps the previous-session index only in QueryClient memory. The history component needs that index to discover saved IDs.

Reproduction: create session → commit a turn → explicitly settle its bill → create a fresh session → see one preserved-history entry → reload. In both viewports, IndexedDB still has two sessions and one turn, but the history entry count drops from one to zero. **No record loss was observed.**

Owner: Interface plus Data/platform for discovery. Proposed repair: hydrate an owner-scoped history index through the existing repository/gateway boundary; verify retrieval with a fresh QueryClient. Do not introduce another persistence store or silently change contract v2. Existing tests check raw record retention after reload, but not the reloaded history entry point.

### AUDIT-04 — P2: the owned external chart link ignores the selected symbol

`src/components/features/tradingview-chart.tsx:9,60` hardcodes AAPL. The public provider host was configured to `NASDAQ:MSFT`; the VAMM footer still opens the AAPL chart in both viewports.

This probe changes the public component attribute. It does not claim to automate TradingView's closed internal symbol-search controls.

Owner: Interface. Proposed repair: use an officially supported symbol/context signal, or explicitly label the destination as the default AAPL chart if current selection is unavailable. Do not scrape provider internals.

### AUDIT-05 — P2: keyboard News retry drops focus

`src/components/features/live-news.tsx:89–96,138` removes the focused retry button when entering loading. Using a registered-provider error/ready harness, keyboard activation of Retry leaves `document.activeElement` at `BODY` on both viewports.

Owner: Interface with Data/platform provider-host coordination. Proposed repair: retain a stable loading/retry control or provide a meaningful, intentional focus destination without stealing focus after the user moves elsewhere. Add coverage for retry focus. Similar source patterns elsewhere are potential follow-ups, not additional confirmed runtime defects.

### AUDIT-06 — P3: media-type prefix validation accepts non-JSON types

`src/app/api/research/route.ts:50` uses `startsWith("application/json")`. A valid request body labeled `application/jsonp` or `application/json-not-really` receives 200; the strict media boundary should reject it with 400. Two isolated assertions fail.

The direct production HTTP check also returned200 with `origin: prewritten` for `application/jsonp`; multipart image input correctly returned400. No live model was called.

Owner: Data/platform. Proposed repair: parse the media type before parameters and compare exactly to `application/json`, preserving accepted charset/case behavior and byte limits. No CORS/CSRF exploit was demonstrated.

## Missing features and tested boundaries

| Capability | Actual status |
|---|---|
| Upload chart screenshot → extract/interpret → produce an analysis | **Absent.** No user file input, image processing, OCR/vision pipeline or analysis endpoint was found. Desktop/mobile entry-point probes found zero file inputs and analysis/upload buttons. QA screenshots are evidence files, not this feature. |
| VAMM personalized buy/sell advice or executable stock orders | **Absent and excluded**, alongside screenshot analysis, by `docs/MVP.md:72–74`. TradingView technical ratings are provider indicator summaries, not VAMM image analysis or an order engine. These workflows cannot be marked passing. |
| Live News sentiment classifier | Not implemented. The live provider supplies headlines; the separate three-story synthetic exercise has prewritten sentiment. No live VAMM sentiment score is attached to incoming stories. |
| Live-data-grounded Mentor answers | Not implemented. Company panels are independent live views; the basket mentor consumes frozen teaching evidence only. Actual configured-model delivery was not exercised. |
| Company coverage outside the three supported selectors | Summary/Compare/Mentor selectors are limited to AAPL, MSFT and GOOGL in USD; Market's Advanced Chart allows provider symbol changes. No arbitrary issuer/currency coverage is certified. |
| Rp10,000,000 trading, Academy, Missions/XP, profiles, auth/cloud sync | Deferred scope. Their absence is not a defect in the accepted frozen simulation. |
| Public deployment and rehearsal | Still queued/unverified in the task ledger. Local production testing does not complete this milestone. |

Actual multipart image bytes, raw image requests, multimodal/image/evidence fields, real ticker IDs, mutation fields, malformed and oversized bodies were rejected in the isolated request probes. A text question mentioning a screenshot does not attach an image or create vision support. Exact JSON/charset acceptance and text-only synthetic context checks passed. The three new funding/preview cases passed: mixed explicit funding, no silent asset substitution, and one-rupiah allocation parity.

## Hourly Markdown review from the user's 09:30 start

Sources: elapsed stages in `docs/MVP.md:80–87`; detailed historical checklist in `docs/superpowers/plans/2026-11-07-vamm-mvp.md`. The latter has no recorded 09:30 anchor or hourly table. Its line18 five-route/live-News exclusion is superseded by current authorized presentation guidance. Its checked tasks describe local work, not proof of deployment or completion within these historical hours. The original frozen checklist is left unchanged.

| Jakarta window | Planned work from the existing elapsed schedule | Review status at 12:58 |
|---|---|---|
| 09:30–10:30 | Scaffold/types to10:00; shell and deployed preview to10:30 | Local foundation implemented and retested. Deployed preview has no verified evidence; this early exit condition remains unmet. |
| 10:30–11:30 | Parallel worker implementation | Outputs integrated previously; all three read-only audit handoffs now returned. Exact within-hour completion times were not reconstructed. |
| 11:30–12:30 | Worker outputs to12:00; local journey from12:00 | Implemented. Three-turn, funding, replay, cross-tab and storage-failure regression checks pass. New integrity/history failures qualify readiness. |
| 12:30–13:30 | Local journey to13:00; supporting screens/checkpoint from13:00 | Current planning block. Six routes and 24 motion treatments tested; new negative cases expose six defects. |
| 13:30–14:30 | Supporting review to14:00; fixes/fallback selection14:00–14:30 | Recommended next repair order below. No fixes were made by this audit. |
| 14:30–15:30 | Feature freeze and verification | Rerun targeted failures after any fixes, then required baseline checks. Do not treat the present audit as a clean release gate. |
| 15:30–16:30 | Final deployment and rehearsal | Queued; requires real deployed-journey evidence. 16:30 is the plan's target, not a delivery guarantee. |

Recommended sequence: (1) model-claim grounding/fallback, (2) derived-value restore reconciliation and persistent history discovery, (3) symbol-aware external navigation and retry focus, (4) exact media-type matching, then targeted and baseline regression checks. Keep screenshot/trading/live-AI additions separate from repair scope; preserve contract v2, frozen fixtures and deterministic Simulation. Any new plugin or paid data service requires asking the user first.

## Evidence and reproducibility

Repository-local evidence is under `orchestration/reviews/evidence/audit-2026-11-07/`:

- `probe-results.json`: all 27 new assertions, including seven failures.
- `browser-probe-results.json`: three UI reproductions at two viewports and missing screenshot entry points.
- `source-preservation-proof.json`: 59 source hashes checked, zero differences.
- `live-features-provider-report.json`, `fundamentals-visible-report.json`: real-provider opens and longer visible-field checks; provider failure retained.
- `api-market-report.json`, `api-market-initial-report.json`: direct HTTP/real Market results and the corrected table-disclosure harness failure.
- Worker reports: `UI-AUDIT.md`, `DATA-AUDIT.md`, `SIM-AI-AUDIT.md`.
- The four probe sources and isolated config are saved as `.txt` files to keep deliberately failing audit probes outside the canonical test/build globs. Their original staging filenames and imports remain readable; adjust the local config root when reproducing elsewhere.

Full staging artifacts, screenshots and standalone runners remain at `C:/Users/vloxm/.codex/visualizations/2026/11/07/01a1b3e0-b0cf-7bf3-af13-730fde3d7215/vamm-audit-staging`. The source proof predates only report/evidence writes. No production fix or new financial capability was implemented during this audit.
