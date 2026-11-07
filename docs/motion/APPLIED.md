# Production motion coverage

User authorized production use of the24 reference combinations; Simulation remains frozen. The full MagicPath study pages stay separate in design/motion. The production layer is src/components/motion and src/lib/motion/presets.ts, using existing React/CSS/SVG with no animation dependency.

| # | Preset | Actual production state / caller |
|---|---|---|
| 01 | reference-helix | LiveMarketWidget: initial Dashboard summary request pending |
| 02 | workspace-restore | SimulationPage: local session restoration pending |
| 03 | returning-static | SimulationPage: no saved active session or newly created zero-balance session |
| 04 | content-arrival | LiveMarketWidget: actual ready/opened provider |
| 05 | query-inline | LoadingPanel and non-summary provider loading; retained teaching query pending |
| 06 | chart-loading | TradingViewChart: provider chart pending, including visibility-aware waiting |
| 07 | mentor-orbit | SyntheticBasketMentor: existing research mutation pending |
| 08 | evidence-arrival | SyntheticBasketMentor: returned explanation/evidence, model or labeled fallback |
| 09 | research-fallback | SyntheticBasketMentor: prewritten origin only |
| 10 | preview-signal | SimulationPage: valid preview actually fetching; idle for invalid allocation |
| 11 | selection-morph | LiveMarketComparison: selected company pair; replay affects decoration only |
| 12 | turn-confirmed | SimulationPage: real ADVANCE committed, bill still pending |
| 13 | shock-settled | SimulationPage: real settled turn, committed holdings immediately visible |
| 14 | storage-error | SimulationPage: actual STORAGE_UNAVAILABLE failure |
| 15 | empty-line | LiveMarketWidget: genuinely unavailable provider; live symbol validation error; SimulationPage: unavailable/error state |
| 16 | news-thumbnail | LiveNewsFeed: real feed host loading |
| 17 | news-skeleton | LiveNewsFeed: outer loading placeholder with regular motion preference |
| 18 | news-static | LiveNewsFeed: outer loading placeholder with static/OS-reduced preference |
| 19 | news-arrival | LiveNewsFeed: actual host ready; applies to outer host, never closed-shadow articles |
| 20 | feed-paused | LiveNewsFeed: user explicitly hides/unmounts the feed |
| 21 | route-arrival | AppShell: route change; only the decorative accent is keyed |
| 22 | focus-ring | AppShell: static visible keyboard focus within navigation |
| 23 | stale-context | ErrorNotice / SimulationPage: retained context and genuine conflict/retry state |
| 24 | reset-confirmed | SimulationPage: new zero-balance session saved with previous history preserved |

Static variants are intentional treatments, not forced loops. There is no percentage, minimum splash duration, financial count-up, hidden result, automatic mutation or financial retry from animation. MotionBoundary never animates/remounts content children. Artwork is decorative; status/error text remains owned by the existing operation.

Animation preferences are memory-only: Pause/Resume, manual Static motion, live OS reduced-motion priority. Controls govern VAMM decoration, not provider updates or financial operations. Both keyboard and preference changes preserve inputs/focus. Provider internals are not scraped or restyled.

Observed coverage: production-motion-coverage-{desktop,mobile}.json in tests/e2e/evidence records all24 numbers reached through actual UI states, with explicitly labeled provider/research fixtures. The sampled screens had at most6 artworks and36 SVG primitives per artwork. This is a DOM budget, not an FPS/GPU benchmark. Separate real-provider screenshots prove actual display integration; stubs do not prove live content or freshness.

## Site-wide motion and teammate design — 2026-11-07

The existing24 recipes remain intact. Shared scoped CSS now also animates shell/navigation, headings/panels, controls, disclosures/tabs, outer provider frames, history and reset dialogs on all6 routes. Brief140/220ms transforms keep content fully opaque and immediately usable. Pause stops VAMM timelines/transitions; static/live OS reduction removes decorative animation and control transforms. No animated money, hidden result, forced wait, financial callback or controller remount. Provider internals remain external. The teammate hero/feature cards use the same layer; capability values describe fixed teaching defaults.

Actual final checks:60 browser cases including all24 recipes at both widths,30 additional route/width renders with no overflow/page errors,24 contrast combinations with no failures, and exact four-store preservation through shell/pref/navigation changes. Details and initial failures: orchestration/reviews/FIXES-MOTION-2026-11-07.md and TEAM-DESIGN-2026-11-07.md. No new animation dependency.

## Branding and live-only route cleanup — 2026-11-07

All 24 motion treatments remain reachable after retiring redundant synthetic displays. Content arrival remains on live provider panels. Empty-line now also decorates actual invalid symbol submissions or provider unavailability; query-inline remains on pending provider/mentor requests. Final 66 browser cases cover all 24 at desktop/mobile with unchanged financial records. The final News footer copy-only cleanup passed its 11 affected unit checks and production build. No financial calculation, duration, pause/static behavior or animation dependency changed.
