# VAMM

VAMM is an educational investment learning workspace for students and beginners.

The current MVP follows [docs/MVP.md](docs/MVP.md) and frozen [contract v2](src/contracts/README.md): five screens, three synthetic cash/bond/equity baskets, zero starting holdings and three annual savings turns. All data is synthetic. The application does not offer stock trading, live news or personalized buy/sell advice.

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

/news now starts with curated, dated links to actual publisher announcements and background reading. It is not an automatic live feed. The original synthetic sentiment practice remains separately expandable; contract v2, all financial APIs and the simulation remain unchanged.

[TradingView/News verification](orchestration/reviews/TRADINGVIEW-2026-11-07.md) records the 96 unit tests, 26 browser checks, live provider smoke and protected-source hashes.
