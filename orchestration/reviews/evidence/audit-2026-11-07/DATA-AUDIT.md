# AUDIT-DATA-2026-11-07

Scope: read-only production review of C:/code/VAMM at CEO-supplied baseline fe56e99. New audit tests and this report exist only in the approved staging directory. No server, model API, service account, deployment, secret inspection, production edit, or Git write occurred.

Status: CEO executed the isolated audit tests. The 19 endpoint cases returned 17 PASS / 2 RED; both derived-integrity probes were RED. Across all workers' 27 isolated probes, the CEO observed 20 PASS / 7 RED. The worker itself ran only in-memory syntax parsing (two files, zero syntax errors).

The CEO separately reran the canonical 134 unit/integration cases and 48 browser cases, plus TypeScript, ESLint, and production build: all passed. These existing regression passes do not negate the newly exposed audit failures. All 59 application source hashes remained unchanged. Evidence: C:/Users/vloxm/.codex/visualizations/2026/11/07/01a1b3e0-b0cf-7bf3-af13-730fde3d7215/vamm-audit-staging/probe-results.json.

## Confirmed findings from CEO-run isolated probes

| ID | Observation and source | Observed result | Classification / proposed later resolution |
|---|---|---|---|
| DATA-AUDIT-01 | C:/code/VAMM/src/app/api/research/route.ts:50 uses startsWith("application/json"). | Both application/jsonp and application/json-not-really returned HTTP 200 rather than expected 400 with a mocked valid provider. | Low-severity media-type contract mismatch (P3), not a demonstrated exploit. Body, schema, and rate guards remain present. Proposed later exact media-type comparison with parameters retained; no fix in this audit. |
| DATA-AUDIT-02 | C:/code/VAMM/src/lib/db/state-validation.ts:22 does not reconcile realBalanceRupiah to nominal/inflation. | After a correct engine turn, changing only persisted real purchasing power by Rp1 still returned getSession ok:true rather than STORAGE_UNAVAILABLE. | Local data-integrity gap (P2), not an authentication or tamper-resistance claim. Future resolution should share deterministic validation/math, without silently resetting history. |
| DATA-AUDIT-03 | C:/code/VAMM/src/lib/db/state-validation.ts:63 compares last-turn and session inflation indexes only to each other. | Jointly changing both stored indexes from 1.03 to 1.5 still returned getActiveSession ok:true rather than STORAGE_UNAVAILABLE. | Local data-integrity gap (P2). Preserve the frozen core during this audit; propose any later integrity change separately. |

The Simulation/AI reviewer owns three separate semantic-grounding probes; the CEO confirmed all three RED. These are injected mocked-provider responses, not observed real model responses. No external model call occurred.

## Screenshot analysis and buy/sell coverage

- C:/code/VAMM/docs/MVP.md explicitly excludes screenshot analysis, real transactions, and personalized buy/sell advice.
- C:/code/VAMM/src/contracts/validation.ts:23 accepts only instrumentIds and question. The object is strict; instrumentIds are one or two distinct frozen basket IDs, not real stock tickers.
- C:/code/VAMM/src/lib/ai/research.ts:47 validates before using a provider; context at lines49–52 contains synthetic instruments and ev-demo-method only.
- No upload control, image_url/input_image processing, multipart processing, or screenshot-analysis endpoint was found under C:/code/VAMM/src by source search.
- The staged endpoint tests check an actual in-memory multipart image request, raw image bytes, embedded image fields, multimodal messages, caller-provided evidence, real ticker IDs, and mutation fields. No actual file is uploaded or model called.
- A plain text question that mentions a screenshot can pass text validation, but no image is added to the provider context. This is not multimodal support.
- TradingView technical indicator labels are external provider output. C:/code/VAMM/src/components/features/live-market-widget.tsx identifies them as provider indicator summaries rather than VAMM recommendations or AI answers.
- Screenshot/chart interpretation, live-grounded AI research, personalized buy/sell advice, and brokerage execution remain missing/deferred features. Their absence is not a failed implemented feature.

## Provider boundaries and limitations

- C:/code/VAMM/src/lib/data/tradingview-widgets.ts:2 limits summary and Compare/Mentor company selectors to NASDAQ:AAPL, NASDAQ:MSFT, and NASDAQ:GOOGL, all shown as USD listings. This is a bounded implementation, not coverage of arbitrary issuers or currencies.
- Market Summary, Company Profile, and Technical Analysis use approved official Web Component modules. Comparison and Financials use the official legacy iframe scripts.
- Comparison uses a true two-series provider overlay on a percentage scale and provider time-range controls; VAMM does not calculate live returns or FX.
- C:/code/VAMM/src/components/features/live-market-widget.tsx:52 waits for its own ready event; registration alone is not readiness. It starts a deadline only when visible.
- Iframe onLoad produces state panel at line94, explicitly an opened provider document rather than fresh quote or financial-statement evidence. Approved origin/path checks are present.
- Provider failures, offline state, retry, external source links, and Hide/Show teardown are implemented. There is no silent substitution of frozen fixtures for failed live data.
- Provider refresh/delivery remains provider-owned. No precise arrival cadence or continuous freshness is inferred from code registration, iframe load, historical screenshots, or deterministic stubs.
- The provider content remains encapsulated; no closed internals are scraped into v2 APIs, research evidence, simulation, or IndexedDB.
- Prior real-provider smoke and test counts in C:/code/VAMM/orchestration/reviews/LIVE-FEATURES-MOTION-2026-11-07.md are historical baseline evidence. This worker did not run a fresh live-provider check.

## API negative-test checklist

| Boundary | Expected canonical outcome | Evidence status |
|---|---|---|
| GET /api/market | 200 Result with frozen synthetic instruments/chart/evidence; never live quotes | Source checked; existing fixture tests inspected; CEO rerun pending |
| GET /api/news | 200 Result with three synthetic/prewritten stories and null external publishers | Source checked; existing fixture tests inspected; CEO rerun pending |
| Unsupported methods on fixture/research routes | Framework 405; no financial/model mutation | HTTP runtime check pending CEO |
| POST /api/research, exact application/json plus optional charset | Valid frozen request accepted; test provider only in audit | Two CEO-run PASS cases |
| Multipart screenshot / raw image content type | 400 INVALID_INPUT; no provider call | Two CEO-run PASS cases |
| Images/messages/caller evidence/real tickers/mutation fields | 400 INVALID_INPUT before provider | Five CEO-run PASS cases |
| Malformed JSON / missing body / malformed Content-Length | 400 INVALID_INPUT | Three CEO-run PASS cases |
| Actual body larger than 8KiB, including lying or absent length | 400 INVALID_INPUT; bounded streamed read | Two CEO-run PASS cases |
| text/plain or application/problem+json | 400 INVALID_INPUT | Two CEO-run PASS cases |
| application/jsonp or application/json-not-really | Should be 400, observed 200 | Two CEO-run RED cases |
| Plain question merely mentioning screenshot | Text-only synthetic context, no manufactured image attachment | One CEO-run PASS case |
| Local/global/concurrency research caps | 429 with Retry-After, per-process bounded guard | Source and existing route tests checked; canonical rerun pending |

The in-memory rate caps are not distributed authentication or cross-instance quotas. No service hardening or deployment change is included.

## Persistence coverage

Reviewed C:/code/VAMM/src/lib/db/database.ts, local-owner.ts, local-repository.ts, state-validation.ts, and C:/code/VAMM/tests/persistence/local-repository.test.ts.

Existing 22 cases cover owner bootstrap/isolation, initial restore, create/reset replay and retained history, pending/settled turn replacement, replay before stale/candidate evaluation, changed payload conflicts, canonicalization, concurrent stale/duplicate writes, atomic rollback including failed reset, unpaid-cost acknowledgment, cross-record mismatch, phase guards, deleted-session replay, corrupt records/outcomes, missing pointer/identity, and unavailable IndexedDB. The CEO's canonical rerun passed the existing suite; this worker inspected definitions but did not execute them.

The four stores and atomic transaction boundaries remain implemented. Namespace checks are local isolation only. The two newly staged derived-field probes exercise a gap not covered by those existing cases.

## Schedule / documentation observations

Read C:/code/VAMM/docs/MVP.md delivery schedule and C:/code/VAMM/docs/superpowers/plans/2026-11-07-vamm-mvp.md. The original documents provide elapsed windows, not an existing anchored 09:30 schedule. CEO confirmed the audit projection will use the user's 09:30 Asia/Jakarta anchor, rather than inventing a historical hourly document.

The historical implementation plan still says five routes and excludes live news at line18, while current accepted guidance authorizes the additional Market/live presentation. Treat that line as historical document drift, not evidence that accepted live views are unauthorized. Original local implementation checkboxes are not evidence of public deployment: deployment remains queued in the current task ledger. The early preview-deployment milestone therefore remains a schedule gap; final deployment and rehearsal require actual observed evidence.

## Staged artifacts and execution boundary

- tests/ai/audit-research-inputs.test.ts: 19 cases, observed 17 PASS / 2 RED. Server-provider module is mocked, and unexpected fetch calls throw.
- tests/persistence/audit-derived-integrity.test.ts: two observed RED probes using fake-indexeddb and the real deterministic engine to construct correct initial records before controlled corruption.
- This Markdown report.

No .fails/todo/skipped expectations disguise the failures. The CEO ran the probes without weakening expectations or changing frozen production code. No fix is authorized or included in this audit handoff.
