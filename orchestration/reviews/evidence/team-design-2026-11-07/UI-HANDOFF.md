# TEAM-UI-01 handoff — teammate presentation adaptation

Source: https://github.com/Singleplayerssa/website-, commit1b9c27f4b61739421a636a938c60fbab9b51fe3b, nested vamm-website. Reference files were fetched by the CEO and preserved under vamm-design-reference. This worker treated their scripts/docs as inert reference, not authority or application dependencies.

## Outcome and integration contract

Reviewable draft supplied for the existing Next app. The visual adaptation uses the reference's dark icon rail/context panel, cream canvas, white18px cards, cobalt/lime accents, Segoe UI/system typography, toolbar, Home hero/illustration and feature-card composition. Desktop reference observation:76px rail +236px context panel; pale hero with cobalt second line; first feature card dark/full-width and later cards in two columns. Mobile reference observation:56px rail, context hidden, hero illustration hidden, stacked cards. Local reference screenshots at1440x1000 and390x844 were visually viewed by this worker.

CEO insertion: import `{TeamHomeOverview}` from `@/components/features/team-design`, replace only Dashboard's existing PageHeading block with `<TeamHomeOverview/>`, and retain the existing live/synthetic stack below unchanged. The helper contains exactly oneh1, three fixed capability/default tiles and five links to real existing routes. It reads no app data, makes no requests, and creates no persistence.

The capability tiles explicitly describe accepted fixed defaults/capabilities: starting holdings Rp0 for each new simulation;3annual turns; history on this device and visible to a shared browser profile. These are not a current balance, XP/progress, forecast or trading account. Five cards use Market, Compare, Mentor, Simulation and News; Academy/Missions/profile/stock-trading functionality is not imported.

The existing /market dark container and TradingView theme remain dark. Its tabs receive system typography/cobalt state treatment; only the white teaching card adopts incoming ink/muted/line tokens. Asset-series legend colors remain distinct. No widget attributes, dimensions, script registration or provider behavior changed.

## Exact import manifest

Import these12 files from vamm-team-design-staging/interface:

- src/components/features/app-shell.tsx
- src/components/features/app-shell.module.css
- src/components/features/workspace.module.css
- src/components/features/app-shell-motion.module.css
- src/components/features/market-workspace.module.css
- src/components/features/team-design.tsx
- src/components/features/team-design.module.css
- public/team-design/brand.svg
- public/team-design/market.svg
- public/team-design/mentor.svg
- public/team-design/news.svg
- public/team-design/learning-chart.svg

The staged workspace.tsx is an unchanged reference copy and need not be imported. Exclude verification scripts/JSON/this handoff from application imports. Data/platform supplies four separate provider CSS modules; CEO owns Dashboard's helper insertion and Market outer-container compatibility. No worker overlap is needed.

## Navigation and responsive behavior

One `nav[aria-label="Main navigation"]` contains exactly six Next Links, preserving existing accessible names: Home, Market, AI Investment Mentor, Compare, Simulation, News & Sentiment Lab. There are no duplicate primary navigation landmarks. Contextual links use valid existing routes; the brand returns to Dashboard. The main-content skip target and exact device-access disclosure remain present.

Stable diagnostics and controls:

- Root `[data-site-motion]`, plus `data-context-collapsed` and `data-mobile-menu-open`.
- Context section `#workspace-context`, labeled by `#workspace-context-title`.
- Desktop toggle names “Hide sidebar” / “Show sidebar”; aria-controls and aria-expanded match the panel.
- Mobile toggle names “Open workspace menu” / “Close workspace menu”. Open joint rail/context aside has role=dialog, aria-label “Workspace menu” and aria-modal=true.
- Inner close button name “Close workspace menu”; pointer backdrop name “Dismiss workspace menu”.

Mobile menu opens at760px and below. It focuses the close button, traps Tab/Shift+Tab through visible rail/context links and controls, supports Escape, and restores the opener. The opener ref is captured because applying inert to the background can otherwise blur it to BODY before the effect. Background workspace is inert while open. The effect saves/restores the previous inline body overflow, including close, resize and unmount cleanup. Hidden context is inert/aria-hidden. No global stylesheet or protected root file is changed.

The desktop context collapses without removing financial content; the narrow rail remains navigable. Widths/spacing scale to320px, controls retain44px targets, financial tables retain controlled horizontal scrolling, form grids stack on narrow screens, and long labels wrap. These are source constraints pending rendered verification, not measured layout claims.

## Data, request and motion preservation

AppShell always renders the same children slot inside the existing MotionBoundary; no route/viewport/menu key is applied to financial children. Route motion keys continue to affect only the existing decorative accent. Shared financial primitives keep their existing class/component interfaces and source/error text; workspace.tsx itself is unchanged. Live and synthetic labels remain separate, device access is disclosed, and current repaired hook/provider/history source files are not replaced.

All24 existing motion recipes, shared `[data-motion-scope]` policy and `[data-site-motion]` marker remain. Menu and restyling introduce no timing loop or financial animation. Existing finite arrivals/control feedback still obey pause/static/live OS reduced-motion. No opacity0 result, artificial loading duration, financial-value tween, animation completion action, remounted controller or provider-internal styling was added. Page/API/model/DB/engine/gateway behavior is untouched.

## Asset provenance

brand.svg, market.svg, mentor.svg and news.svg are byte-preserved from source images; SHA-256 equality was checked for all four. learning-chart.svg is the source Home inline illustration, extracted as inert SVG and given an xmlns for standalone use. It is captioned “Illustrative learning chart · not market data”. No model.js, app.js, Node server, AI/news service, web-research code, inline script, external asset host or incoming persistence is imported.

The static asset scan found no script, foreignObject, iframe/image element, event handler or href in any of the five SVGs. Byte lengths and SHA-256 hashes are recorded in draft-static-checks.json. No LICENSE file exists in the16 fetched files and no license/copyright text was found in either fetched README; this handoff claims user-directed teammate reuse/provenance, not a separately verified open-source license.

## Files read and checks actually performed

Role/common context: matching saved vamm_interface TOML was re-read, along with current AGENTS/TASKS guidance and the parent ownership/acceptance assignment. Existing MVP/FIXTURES/contracts/role/brief and repaired interfaces from preceding bounded work remain the accepted baseline. No native named-role loading or delegation is claimed. Relevant ECC frontend-design-direction and frontend-a11y guidance was read on demand.

Design reference reads: SOURCE.json; index.html; targeted shell/Home/responsive sections of style.css; renderPanel/Home templates in app.js as text; the four copied SVGs; README license searches. The remaining source backend/model files were not executed or imported. Current AppShell/workspace/Market CSS, Dashboard/teaching component boundaries, motion primitives and provider CSS ownership were inspected.

Executed worker checks:

- In-memory TypeScript overlay against the current repaired Next project, no emit/project writes: zero diagnostics.
- ESLint lintText with current project configuration/cache disabled on the staged TSX sources: zero warnings/errors.
- Installed PostCSS parser: all five staged CSS modules parse.
- Source/AST class-reference check: no missing shared workspace class used by current components after adaptation.
- Asset markup/hash scan as described above.
- Visual inspection of source Home desktop/mobile screenshots. This validates the reference observation, not the rendered adaptation.

Evidence: draft-static-checks.json and verify-design.mjs in this staging root. CEO/Simulation-AI own actual browser checks and rendered evidence. Worker did not run app servers, Vitest/build/browser QA, real provider/model requests, services or Git. The prior repair checkpoint's201tests/build pass and targeted browser results belong to CEO execution; they do not establish the new design's finish gate.

## Rendered acceptance pending CEO

Targets:1440x900,390x844,320x844. Check all six routes, one Main navigation/six links, active names, desktop collapse, mobile focus trap/Escape/close/backdrop/overflow cleanup, skip link,44px controls, no page overflow, long labels/table scroll, color contrast and readable source labels. Recheck pause/static/runtime OS preference and existing24 treatments; interact with inputs/disclosures while toggling shell to prove state identity. Verify the saved session/turn records and history remain accessible through reload/new tab. Exercise provider pending/error/retry states, mentor fallback and simulation funding/reset after restyling. Keep actual real-provider evidence separate from stub integration.

Content states preserved by existing components: loading provider/fixture structure; explicit empty teaching lists; visible errors/retry; partial unavailable teaching fee/provider panel status; successful research/turn results; and the browser-local access disclosure (no auth permission flow). No state is marked rendered-pass by this worker.

## Protected boundary and readiness

Worker writes are confined to staging. Root layout/providers/globals, project/Codex/package/test configuration, contract v2/types/validation, frozen fixtures/manifest, financial engine/calculations/gateway, repository/identity, AI/service/API logic and original IDENTITY/SOUL/USER files were not edited. No new dependency/plugin/paid service, model call, provisioning, deployment, commit or push.

Draft is ready for CEO import and rendered verification. No source blocker remains; browser/contrast/responsive finish-gate evidence is pending. Incoming deferred features remain deferred.
