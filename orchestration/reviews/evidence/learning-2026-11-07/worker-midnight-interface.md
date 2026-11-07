# Midnight studio adaptation — Interface handoff

Reference pin3b1a3d348185aa8bbc50da97583a71092ccd3906, parent9775636d55db8832dfd6d28eeef14afea29999d5. Selected source text is inert under vamm-midnight-reference. This worker inspected style/index/app/motion deltas against vamm-final-reference. No reference script was executed, no .env/secret file read and no prototype server imported.

## Compatible delta and surface strategy

The new design introduces dark midnight rail/context/toolbar and Home orbit artwork while retaining a light canvas/white long-form cards. Coordinated with CEO: canvas#edf2f7; ink#14263c; muted#5d6c7f; line#dbe4ee; blue#225bd5/hover#1743a5/soft#edf5ff. Shell accents mint#8df0d2 and peach#ffae79 belong to CEO's shared shell/Home styles. Academy/Missions cards remain white; semantic success/warning treatments and the previously contrast-verified diagram caption#52657b are retained.

The source app named-function AST comparison is recorded in MIDNIGHT-SOURCE-DELTA.json: Home is the only changed named function. Index adds motion.js and default body motion state plus a dark theme-color. Source motion.js creates a DOM toolbar button, stores a localStorage preference, observes global main mutations, adds reveal/stagger state and handles offscreen/document visibility. We adopt its decorative vocabulary and visibility intent through the existing React preference context. We do not import the global script, second preference store, reveal opacity0, stagger delays or DOM renderer. Learning/quiz/reward/API/financial behavior is unchanged.

## Four production files ready for import

- src/components/learning/learning.module.css — palette-only updates, retaining layout/controls/focus/overflow guards and existing shared motion.
- src/components/learning/lesson-diagram.tsx — blue graphic strokes updated only; diagram content and caption contrast retained.
- src/components/features/studio-artwork.tsx — new decorative StudioArtwork export.
- src/components/features/studio-artwork.module.css — new scoped, preference/visibility-controlled timelines.

Staging root: C:/Users/vloxm/.codex/visualizations/2026/11/07/01a1b3e0-b0cf-7bf3-af13-730fde3d7215/vamm-learning-staging/interface. The ten learning UI tests and every other production source are unchanged for this delta. Exclude this handoff, source-delta JSON and verification scripts from application imports. CEO owns actual shell/Home insertion, keeps the original VAMM AI BrandLogo, and controls any background aurora/beacon with the artwork's attributes. No StudioHero wrapper was added under the simplified agreed interface.

## StudioArtwork interface and behavior

`StudioArtwork({className?:string})` renders a responsive decorative aria-hidden div/SVG. Markers: data-studio-artwork='', data-studio-running=true|false, data-studio-static=true|false. It has eight animated groups across five kinds: two ring, three token, one core, one signal, one speck; each exposes data-studio-part. ClassName is available for parent layout.

All artwork is deterministic. Unique SVG gradient IDs use React useId for stable SSR/multiple instances. Visible wording includes “Practice, not prediction” and “Illustrative learning path”. The path is a decorative source motif with no price labels/numbers, holdings, financial measurements or live input. No request, mutation, application event, persisted preference or progress signal exists in this component.

Running requires intersection, visible document, no global pause and no effective static preference. Local IntersectionObserver is disconnected on cleanup and ignores queued callbacks after cleanup; document visibility uses a cleaned useSyncExternalStore subscription. SSR running=false. Without IntersectionObserver the drawing remains visible and timelines remain paused. Existing useMotionPreferences controls manual/static/live OS behavior; no second control is created.

CSS animation declarations remain present while static=false and start paused. running=true plays them; false pauses in place, preserving phase offscreen/hidden/global Pause. Static or CSS OS reduction removes animation and resets decorative transforms. Ring rotation, token/core float, signal opacity and speck transform/opacity are the only animated properties. Signal glow does not draw fake progress. There are no timers, animation-completion callbacks, hidden content, numeric tween or permanent will-change layer. All24 prior motion recipes remain authoritative and untouched.

## Checks actually performed

Executed worker checks: read-only TypeScript AST/PostCSS reference comparison; in-memory current-project TypeScript overlay with zero diagnostics; ESLint lintText with zero messages; both owned CSS modules parsed. Evidence: draft-static-checks.json and MIDNIGHT-SOURCE-DELTA.json. No runtime/unit/browser/model/service call was made by this worker. All299unit/lint/build passing before this upstream delta is CEO baseline evidence, not a post-artwork finish gate.

Source opaque text-pair contrast calculations (not rendered scan): muted/white5.36, muted/softblue4.88, diagram caption/softblue5.45; Learn/Practice/Reflect token labels on their SVG painted surfaces5.42/5.29/5.35; core subtitle against lighter dark gradient endpoint7.03. Token label colors are darker than the reference to preserve readability. Decorative SVG shape backgrounds must be considered when interpreting automated contrast tools; rendered screenshots/actual styles remain CEO acceptance.

Simulation/AI received stable selectors and CSS semantics for actual Web Animation checks: visible running, global pause, offscreen/hidden pause with retained currentTime, static/live OS animation:none, one instance after navigation/remount, original logo/content visibility. CEO plans integrated build/browser/responsive/contrast checks. No FPS/GPU performance claim is made.

## Boundaries and status

Worker writes are staged only. No root layout/providers/globals/config, financial contracts/fixtures/engine/gateway/storage, identity sources, learning repository/grading/controller, orchestration or Git edits. No plugin, dependency, paid service, secret use, model API or deployment. No existing user logo is changed or replaced. Four files are stable for review/import; actual rendered finish gate remains CEO/Simulation-AI owned.
