# VAMM

VAMM is an educational investment learning workspace for students and beginners.

The current MVP follows [docs/MVP.md](docs/MVP.md) and frozen [contract v2](src/contracts/README.md): three synthetic cash/bond/equity baskets, zero starting holdings and three annual savings turns, alongside independent live market views. Simulation and research evidence are synthetic. Separate TradingView charts and live News provide external market context. The application does not offer stock trading or personalized buy/sell advice.

Simulation state is stored in this browser profile using IndexedDB. Reset starts a new session while retaining old history. Research uses server-selected synthetic evidence; when a model is not configured or fails, the response is explicitly labeled prewritten.

## Local development

Requires Node.js 22.12 or later.

```powershell
npm ci
npm run dev
```

Open http://127.0.0.1:3000. The root route opens the dashboard.

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

Browser checks use `npm run test:e2e` against a running local server. The model path is optional; local simulation and labeled research fallback work without credentials. No credentials belong in browser code or version control.

Accepted scope, task ownership and implementation evidence live in [orchestration/TASKS.md](orchestration/TASKS.md).

Observed implementation results and runtime limits: [implementation review](orchestration/reviews/IMPLEMENTATION-2026-11-07.md).

## Market and source reading

The authorized presentation extension adds /market and an independent TradingView dashboard chart using the official free Web Component. Both start at NASDAQ:AAPL with daily bars and symbol changing. Dark charts resize to their containers; provider failures have explicit fallback links. No chart backend, financial API, plugin or paid data service is added.

/news uses the official TradingView News Feed, which updates automatically while visible; VAMM does not maintain a manual headline list. Provider timestamps and availability apply. Story links open TradingView; no live VAMM sentiment is inferred. The original synthetic sentiment practice remains separately expandable; contract v2, all financial APIs and the simulation remain unchanged.

[TradingView/News verification](orchestration/reviews/TRADINGVIEW-2026-11-07.md) records the 96 unit tests, 26 browser checks, live provider smoke and protected-source hashes.

## Motion and future UI

The LoadingScreenIdea video is reference for a separate MagicPath motion study and combinations playground. It is not embedded as a 66 MB splash video. A small shared motion layer now applies all24 approved treatments while keeping financial logic unchanged; future teammate UI can replace presentation. Future presentation swaps must preserve data, hooks, gateway, v2 contracts, fixture math and IndexedDB behavior. No new plugin or paid data service is installed.

Current task evidence: [live News and motion review](orchestration/reviews/LIVE-NEWS-MOTION-2026-11-07.md).

## Current live features and motion

| View | Provider-updated content | Separate teaching tool |
|---|---|---|
| Home | TradingView Market Summary and Advanced Chart | Synthetic learning baskets |
| Market | Existing symbol-changing Advanced Chart | Original Chart for Learning |
| Compare | Two-company percentage comparison on a provider-selected range | Frozen basket comparison and unavailable fees |
| AI Investment Mentor | Company profile, fundamentals and daily technical context | Synthetic basket question/evidence/fallback flow |
| News & Sentiment Lab | Automatically updated TradingView headlines | Three prewritten sentiment exercises |
| Simulation | Frozen educational exercise, deliberately unchanged | Three turns, explicit funding, reset/history |

Current company selectors offer AAPL/MSFT/GOOGL NASDAQ listings in USD; the existing Market chart supports changing symbols inside TradingView. Quotes may be delayed; fundamentals follow provider reporting periods. Iframe status means its panel opened, not verified quote freshness. VAMM adds no live sentiment score or model claim based on widget contents. No new backend/API, key, dependency, plugin or paid data service was introduced.

All24 motion treatments are reachable in production states, with Pause/Resume and Static motion controls respecting device reduced motion. They do not delay results, animate money, recreate financial controllers or start actions. [Usage map](docs/motion/APPLIED.md) · [Implementation/evidence review](orchestration/reviews/LIVE-FEATURES-MOTION-2026-11-07.md).
