# TradingView and sourced News extension — 2026-11-07

User authorized a responsive dark /market page using https://widgets.tradingview-widget.com/w/en/tv-advanced-chart.js, NASDAQ:AAPL, symbol changing and interval 1D; TradingView also replaces the dashboard's primary chart. User requested real sources for News and a Git update. Ask before adding plugins or paid data services; none are required or authorized here.

## Reconciliation with the accepted baseline

This explicit user request adds a sixth presentation route and supersedes the synthetic-only dashboard-chart/News-display restriction. It does not amend contract v2, its API shapes, the frozen dataset, calculations, scenario sequence, IndexedDB schema, research evidence or any simulation behavior. The original five routes remain present.

The external TradingView widget supplies its own chart. It is never a data source for the deterministic simulator or synthetic comparison metrics. Display its attribution and provider/exchange-delay limits; keep synthetic basket provenance separate. No backend or financial/chart API, plugin, data subscription or dependency is added.

News displays verified curated primary publisher links, actual publication dates and short authored educational context. It is not an automatically updating/live feed. Existing synthetic sentiment exercises may remain in a clearly separate expandable section; /api/news and frozen synthetic fixtures stay unchanged. No model sentiment is added to actual articles or to research's evidence catalog.

## Ownership and execution

- Interface owns the shared TradingView component/styles, new src/app/market/**, dashboard primary chart, AppShell navigation and focused UI tests. Existing simulation pages/hooks are excluded.
- Data/platform temporarily owns src/app/news/page.tsx, new source-news data/presentation files and their tests. Frozen fixtures, API routes and storage are excluded.
- Simulation/AI performs a preservation review and owns only new tests/e2e/tradingview.spec.ts for this assignment. No runtime simulation/AI changes.
- CEO owns scope/task records, integration, existing e2e adaptation, verification and Git updates.

Saved role instructions are explicitly passed to the same three generic workers. No native named-role loading or further delegation is claimed. Workers draft in the current writable visualization staging area; CEO imports reviewed files through the main-chat permission path. No folder aliases, ACL or global trust edits are used.

## Evidence to collect

Official component/source inspection confirms interval 1D, Boolean allow-symbol-change, theme dark, and tv-widget-ready/tv-widget-error lifecycle events. The widget uses closed shadow roots; tests distinguish host integration with a deterministic stub from a separate live-provider smoke check.

Verify responsive sizing at 390px/1440px, successful and blocked loading, route remount/script reuse, external-vs-synthetic labels and publisher links. Run unit tests, TypeScript, lint, production build and simulation browser regressions. Compare protected source hashes. Never claim live-provider success from script registration alone.

Git baseline 005549f preserves the prior verified MVP and remote review workflow 16607b0. No push has occurred yet. Final changes will be committed after observed verification.

## Verified result

Integrated all three worker handoffs. 96 unit/integration tests and 26 desktop/mobile production-browser checks passed. TypeScript, clean ESLint and production build passed. All 19 protected source files match their initial SHA-256 values, including contract/schema, fixture catalog/manifest, simulation/AI/IndexedDB implementation, simulation page/hook, dependencies and Next configuration. No backend/API/dependency/plugin/paid-data service was added.

The real official TradingView service returned module HTTP200 and emitted tv-widget-ready in both 1440x900 and 390x844 viewports. Chart hosts measured 1052x612 and 328x573.91; document widths stayed 1440 and 390, with no page errors. Actual screenshots were inspected. One ancillary provider help request failed; chart rendering was successful. No quote data was read into VAMM state.

Publisher pages were independently opened and checked: [Apple](https://www.apple.com/newsroom/2026/11/apple-reports-fourth-quarter-results/) (2 November 2026), [Federal Reserve](https://www.federalreserve.gov/newsevents/pressreleases/monetary20261028a.htm) (28 October 2026), and [Vanguard background reading](https://corporate.vanguard.com/content/corporatesite/us/en/corp/articles/when-index-funds-mix-dont-match.html) (4 June 2025). News explicitly says curated/not live and keeps synthetic sentiment in a separate expandable exercise.

References: [TradingView configuration](https://www.tradingview.com/widget-docs/tutorials/web-components/configuring/), [sizing](https://www.tradingview.com/widget-docs/tutorials/web-components/layout-and-sizing/), [official module](https://widgets.tradingview-widget.com/w/en/tv-advanced-chart.js). Actual module reference inspection confirmed defaults, kebab-case Boolean attributes and public ready/error events. Browser stubs are labeled and separate from live-provider smoke evidence.

Evidence: tests/e2e/evidence/tradingview-report.json, tradingview-live.json, tradingview-proof.json and associated screenshots. Existing report.json is retained as historical baseline; the new report supersedes its current presentation observations. Original IDENTITY/SOUL/USER files remain untouched. No live model call or manual deployment was performed.
