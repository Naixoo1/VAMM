# VAMM Hackathon MVP

Frozen contract v2 and `docs/FIXTURES.md` govern implementation. Documentation only
until explicitly authorized; no app resources or credentials are provisioned here.

## Goal and defaults

Teach students aged roughly 15–18 about instruments, inflation, uncertainty, and
emergency liquidity. Explain observed choices respectfully, without personality labels.

- IDR; zero holdings; age 15 → 16 → 17 → 18 in three annual turns.
- Synthetic cash, bond, diversified-equity baskets; one fixed shock each turn.
- Savings 50%; new-contribution allocation 30% cash / 30% bonds / 40% equity.
- Allocation affects new savings only; no rebalancing or automatic liquidation.
- Baskets and allowance multipliers are teaching assumptions, not forecasts,
  real product accessibility, or personal obligations.

Journey: explore → compare → research → preview allocation → advance → explicitly
fund shock → review nominal/real outcome → continue or reset.

## Five screens

| Screen | Required behavior |
|---|---|
| Dashboard / Home | Three instruments; Recharts synthetic dated index line; optional independent TradingView panel |
| Research / AI Investment Mentor | 1–2 instruments/question; server-selected fixture evidence; limitations/labeled fallback |
| Compare | Bonds/equity default; cumulative synthetic return and unavailable annual fee; matching periods |
| Simulation | Engine contribution preview; nominal/real charts; separate gain/contribution/bill; explicit funding, history/reset |
| News / News & Sentiment Lab | Live TradingView feed; separately expandable three synthetic stories with prewritten sentiment/reason, never trading advice |

## Compatible feature meanings — 2026-11-07

Reconciliation: `orchestration/reviews/FEATURES-2026-11-07.md`. Incoming checklist
instructions are proposals; user directed that this MVP stay intact.
Use Home/Dashboard, AI Investment Mentor/Research, and News & Sentiment Lab/News as
display-label equivalents; preserve the five existing routes, including Compare.
Suggested prompts populate the existing question field and reuse ResearchRequest:
- "Compare the modeled changes of these educational baskets."
- "Explain why these synthetic results are not a forecast."
Explain concepts only within available evidence; unsupported company/fundamental data
remains unavailable. Current feedback is prewritten reflection, not model portfolio analysis.
Academy, Missions/XP, profiles, Rp10M stock trading, live model sentiment and chat
history remain roadmap proposals. If quizzes are later approved, Missions owns all of
them; Academy/News link there and learning rewards never rank investment returns.
No backend shape, fixture, storage or ownership changes; contract stays v2.

## Stack and local persistence

Next.js, TypeScript, Tailwind, shadcn/ui, Lucide, Recharts, TanStack Query, OpenAI research,
GitHub, Vercel. Defer Lightweight Charts and runtime news/feedback model calls.

Default: browser-local IndexedDB (`vamm-demo-v2`), owned by Data/platform. No sign-in,
guest authentication, Supabase dependency, or cloud simulation persistence.
Display: "Stored on this device; anyone using this browser profile can access it".
Namespaces provide local isolation, not authentication/tamper protection. Never treat
browser state as trusted server state. Storage failures are visible, not silent resets.
Supabase is future scope requiring explicit approval and revised owner/auth contracts.

Reset confirms, creates a fresh zero-balance session, preserves old history, and changes
the active-session pointer only on success.

## Data and service defaults

Only frozen synthetic fixtures/scenarios are required. IDs/values/versions are in
FIXTURES; no fabricated provenance or widget-derived calculations. External chart/live News presentation is independent of financial state and research evidence.
Simulation/AI owns gateway previews using the same engine helper as ADVANCE; no UI math.
Feedback uses committed-turn prewritten templates. Research is the sole default model
feature: 15-second timeout, no automatic retry, validated evidence, labeled fixture fallback.
The deterministic journey works without a model. Check research/deployment access later.

## Exclusions

No real transactions/brokerage, autonomous allocation, personalized buy/sell advice,
guaranteed forecasts, arbitrary runtime browsing, screenshot analysis, optimization/
Monte Carlo, FX conversion, social features, or account management.

## Delivery schedule

| Elapsed | Exit condition |
|---|---|
| 0–0.5h | Scaffold and frozen v2 types wired; documentation freeze already complete |
| 0.5–1h | App shell and preview deployed |
| 1–2.5h | Parallel outputs ready |
| 2.5–3.5h | Complete local simulation journey |
| 3.5–4.5h | Supporting screens and checkpoint review |
| 4.5–5h | Fix failures; select fallbacks |
| 5–6h | Feature freeze and verification |
| 6–7h | Final deployment and rehearsal |

Done: five screens, three turns, fixture/math reconciliation, safe duplicate/stale
requests, explicit funding, reset/history, model/storage failure states, local/synthetic
labels, and desktop/mobile deployment checks.

Fallback order: omit widget → labeled prewritten research → simplify supporting visuals.
Preserve local persistence and simulation semantics.

## Authorized presentation extensions

The separate /market route and Dashboard chart use TradingView (NASDAQ:AAPL, symbol changing, 1D). News is automatically updated by TradingView instead of manually maintained links. Provider timestamps/availability apply; VAMM adds no live sentiment score. Synthetic sentiment practice and all v2 endpoints remain unchanged. No backend or financial API is created for the widgets.

Future handmade UI can replace presentation only; retain hooks, gateway, validation, contracts, fixtures and storage semantics. Current animation work is a separate MagicPath prototype/combination study based on the user's video, not a production redesign. Details: orchestration/reviews/LIVE-NEWS-MOTION-2026-11-07.md. Ask before adding plugins or paid data services.
