# VAMM AI branding and live-market walkthrough

Date: 7 November 2026, Asia/Jakarta. Starting Git commit: `29150d5`.
Implementation and local verification complete. Git delivery targets the existing `Naixoo1/VAMM` repository on `main`; the final response records the pushed commit.

## What changed

The supplied VAMM AI crest is the website's brand image. The original PNG is copied byte-for-byte into `public/branding/vamm-ai-teknologi-original.png`; CSS frames its surrounding whitespace so the crest remains readable. It appears in the navigation panel and Home hero, including mobile. The original temporary file is untouched, and no image-generation service is used.

Original/copied SHA-256: `E2B682BD9EC2634926AAF5E8C4505FC066494D9FF6C31D14316E285A3E6010C5` (1600 × 1600, 1,052,550 bytes).

Home, Compare, Market and News now use their existing real-provider views without the duplicate synthetic panels. Removed presentation includes Home's modeled basket returns, Compare's synthetic basket table, Market's original synthetic index-chart tab and News's three prewritten example stories. These views do not request `/api/market` or `/api/news`, and provider failure never substitutes synthetic prices or stories.

The frozen v2 fixture/API files are retained for compatibility and protected teaching behavior. Simulation still starts with zero holdings and has three deterministic annual turns, explicit shock funding and device-local preserved history. The separate basket mentor remains labeled synthetic: there is no existing live-grounded AI service that can replace it. Live company panels do not become model evidence. No new live sentiment classifier, stock trading or screenshot buy/sell analysis is implied by this change.

## Try it

1. Open `/dashboard` to see the VAMM AI crest, live market summary and interactive TradingView chart. Use the navigation menu on narrow screens.
2. Open `/compare`. Enter an exchange-qualified symbol in each field, then select **Compare listings**. Examples include `NASDAQ:NVDA` with `NYSE:KO`, or `IDX:BBCA` with `IDX:BBRI`. The fields are not a three-company allowlist. The stock-search link opens TradingView's catalog when you need to find a ticker. Typing a draft does not reset the current chart; applying a valid pair does.
3. Use the provider's common chart period to compare percentage movements. Each listing retains its native currency; VAMM does not calculate an FX-adjusted return. Unsupported, restricted or missing symbols may show the provider's unavailable message. A valid symbol format does not prove that a listing exists or can be embedded.
4. Open `/research`, enter an exchange-qualified company and select **Load company** for provider profile, technical context and financial panels. The **Synthetic basket mentor** is a separate teaching tool below; it still uses the existing v2 request and evidence.
5. Open `/market` for the dark Advanced Chart, initially `NASDAQ:AAPL` at `1D`, with symbol changes inside TradingView. There is no duplicate synthetic chart tab.
6. Open `/news` for provider-updated publisher headlines. **Hide live feed** and **Show live feed** control the feed. Read publisher and publication time in the provider; VAMM does not invent a sentiment score or substitute authored stories when disconnected.
7. Visit `/simulation` to continue existing saved sessions. Market browsing, logo changes and motion controls do not alter the teaching calculations or saved financial records.

## Provider scope

TradingView's official [comparison demo](https://www.tradingview.com/widget-docs/widgets/charts/symbol-overview/demos/compare/) documents the two-symbol comparison configuration. The website accepts exchange-qualified symbols instead of maintaining a closed list. This removes VAMM's artificial selection limit; it cannot guarantee every global stock is available in an external widget. TradingView's [data FAQ](https://www.tradingview.com/widget-docs/faq/data/) explains exchange restrictions, delayed data and symbols available only on its own site. A loaded iframe establishes panel opening, not current prices or complete coverage.

No new backend, financial API, plugin, dependency or paid data subscription was introduced. No real research-model call or deployment was performed. The existing Next.js runtime remains in use.

## Ownership and preservation

| Worker | Work |
|---|---|
| Interface | Exact logo asset, reusable branding presentation, shell and Home copy |
| Data/platform | Broad symbol inputs, normalized validation, official widget configuration and unit coverage |
| Simulation/AI | Browser regression updates, all24 motion coverage, financial/protected-file review |
| CEO | Live-route cleanup, retirement of obsolete components, integration, walkthrough and Git delivery |

Three existing generic workers were resumed with their saved `.codex/agents` instructions, common guidance, role guides and briefs. Native named-role selection is not claimed. Workers did not delegate. Their inherited filesystem restrictions required staging in the existing visualization directory; the CEO reviewed/imported their disjoint files into `C:/code/VAMM`. No device-wide permissions, identity files, credentials or project configuration were changed.

The baseline protected proof covers36 files, including contract v2, fixture manifest/source, simulation engine/gateway/feedback, original storage implementations, root app files and build/dependency configuration. Retired presentation source remains recoverable in Git. The user's latest direct instruction supersedes older documentation requiring duplicate synthetic panels; protected historical specifications themselves remain unchanged.

## Verification and remaining limits

| Check actually executed | Result |
|---|---|
| Unit/integration suite | 237/237 passed across27 suites, including43 new broad-symbol cases |
| Full production-browser suite | 66/66 passed in44.2s, desktop1440×900 and mobile390×844 |
| Production build, TypeScript, ESLint | Passed; final build after News footer wording cleanup |
| Final News unit checks after that copy-only cleanup | 11/11 passed |
| Responsive logo/navigation/page checks | 18 route-width checks at320,768,1440 plus one maximum-length symbol regression;19/19 passed, no page errors or overflow |
| Rendered text contrast | 20 route/state/viewport combinations, zero detected failures |
| Motion | All24 existing treatments reached at both browser-suite viewports; pause/static/live reduced-motion retained |
| Protection | All36 protected SHA-256 values match baseline; logo hash matches original |
| Live public-provider inspection | NVDA/KO and BBCA/BBRI charts rendered at1440 and390; News ready at both widths |

Browser suites use explicit provider fixtures to verify host configuration, lifecycle, delays/errors/offline behavior and safe interaction. They also verify unchanged exact four-store IndexedDB records after company selection, navigation and failures, the three annual turns, explicit funding, reset/history and retained mentor provenance. None of those stub checks claims that real prices were delivered.

Separate actual TradingView requests returned200 for comparison scripts; screenshots were inspected and show both comparison lines and real publisher headlines. One mobile iframe request was aborted during symbol replacement, while the final comparison rendered. No app page error or overflow occurred. Widget/exchange data availability remains external, and panel readiness alone is not proof of fresh or complete data.

Failures found and resolved during this change:

- **Real layout defect:** an accepted61-character symbol produced579px document width at a320px viewport. The full symbol is preserved; `overflow-wrap:anywhere` on displayed context/descriptions fixes the overflow. The same rendered regression now reports320px. Before/after JSON is retained.
- **Browser harness mismatches:** the first full run passed62/66. A broad alert locator also matched Next.js's route announcer, and a footer assertion expected retired copy; each failed at both widths. Scoped the alert to its actual comparison region and updated the expected source wording. No application guard or assertion purpose was weakened. The complete rerun passed66/66.
- **Responsive harness selector:** the mobile close-button name appeared on the modal and inert toolbar trigger. Scope to the workspace dialog; the completed19-case run passed.
- **Contrast harness timeout:** the first run timed out awaiting the research fallback after repeated suites. Its exact response was not captured, so the cause is not claimed as proven. An isolated run against the fresh final model-disabled server passed all20 combinations; no production timeout, rate limit or fallback guard was changed.
- **Worker environment:** inherited worker write/runtime restrictions caused Access denied/EPERM, including Vitest temporary-config creation. Workers staged source and performed static checks; CEO imported and executed the canonical runtime checks. No worker runtime pass was invented.

Evidence: `tests/e2e/evidence/logo-live/` contains responsive/provider JSON and screenshots; `orchestration/reviews/evidence/logo-live-2026-11-07/` contains the protected proof, verification summary and handoffs. Home previews: [desktop](../../tests/e2e/evidence/logo-live/dashboard-1440.png) and [320px](../../tests/e2e/evidence/logo-live/dashboard-320.png). These relative preview links are for repository navigation; the main evidence paths above are repository-relative.

The local preview runs at `http://127.0.0.1:3000/dashboard` with research-model calls disabled only in that process. No secret file or project configuration was changed. Public deployment, actual model delivery, complete provider-market coverage and full manual assistive-technology certification are not claimed.
