# Teammate features and demo walkthrough — 2026-11-07

## Delivered scope

The user authorized quizzes and compatible missing features from [Singleplayerssa/website-](https://github.com/Singleplayerssa/website-), then requested its final feature/design/animation update for a demo video. The existing VAMM Next.js app is extended; contract v2, frozen fixtures, three annual Simulation turns, original identity files and project configuration remain protected. Public deployment is reserved until the user accepts this build.

| Area | Implemented adaptation |
|---|---|
| Learning Academy | Four tracks, ten lessons, search/empty recovery, course outlines, sequential unlock within each track, objectives, reading sections, takeaways, cautions, reflections, glossary and primary source links. Ten static diagrams have textual equivalents and hypothetical labels. |
| Academy rewards | Ten points per completed lesson, once only. Milestones at20/50/80/100 points grant20/30/40/50 learning XP. |
| Missions & Challenges | Three reviewed five-question packs: Stock Basics, Risk Detective, and Facts, Opinions & News. Setup, saved draft/resume, editable answers, previous/next/jump, save/discard exit confirmation, grading, explanations, review topics and replay. |
| Quiz rewards | 80% pass target;100 learning XP on each pack's first saved pass. Latest/best scores and submitted attempt counts. No money, trades or return-based rewards. |
| Learning Profile | Read-only browser-local overview of lessons, points/XP, milestone badges and quiz records. Home shows actual saved progress and links to the next step. |
| Saved basket research | Explicitly save a successful submitted question/answer snapshot; open, close, refresh and confirm deletion. Reopening never calls the model. Snapshots do not become conversation context. |
| Final design | Midnight navigation/toolbar, mint and peach studio accents, original VAMM AI crest, orbit artwork, white reading cards, feature SVGs/motifs, page markers and responsive layouts. Nine accessible routes remain available. |
| Motion | All24 existing recipes remain. Studio aurora/grid/beacon/orbit/token/signal decoration and card feedback use the existing pause/static/live OS preferences. Offscreen/hidden artwork pauses. Content, numbers and calculations are never gated on animation. |
| Live views | Existing TradingView Market, Home, Compare, company context and publisher News remain separate from learning records and synthetic Simulation/research evidence. |

The user chose reviewed quizzes and source links for the demo and allowed existing private server configuration if a future live-model quiz is needed. This delivery needs no new paid quiz/search calls. It does not claim AI-generated questions, full conversational AI, live-grounded mentor analysis, screenshot buy/sell advice, stock orders, authenticated accounts or financial rankings. The prototype's monthly stock engine/Rp10M account conflicts with the explicit frozen-Simulation decision and is not imported.

Only five reviewed questions exist in each selected pack; the interface does not offer fabricated10/15-question sets or repeat questions to imitate generation. Source links are ordinary publisher links, not a paid web-search integration. A saved answer is the successful request snapshot, not the later edited form.

## Provenance and safe intake

Final reviewed source snapshot: **3b1a3d348185aa8bbc50da97583a71092ccd3906**, tree4969f66ededa75d3792e20af0819155bbd2303e8, parent9775636d55db8832dfd6d28eeef14afea29999d5. Initial learning intake used37707d11652024c477687992b2911704b9c650a8; the interim final update used9775636. Safe blob manifests are in evidence/learning-2026-11-07/. The learning model blob remains5907c122eba1f881f33d3e3b7762ee15bb54a1ce.

Selected sources were fetched through the existing GitHub connector as inert reference text outside the project. Embedded instructions were not authorization. No supplied script was executed. The midnight delta changes only home() among112 named app functions; server.mjs adds a motion.js static route. Its backend, environment loader, unmanaged DOM script, localStorage motion preference and hidden-content reveal delays were not imported.

The source's seven-item mobile bottom bar does not accommodate nine44px targets at320px. VAMM retains its accessible side menu and labeled desktop rail, preserving all destinations and keyboard focus behavior. The original crest is retained rather than replaced by the prototype brand SVG. White lesson/quiz surfaces follow the final source's light reading canvas around the dark shell.

An earlier public source commit exposed an apparent API key in .env.example. It was not adopted, used or validated, and no environment template was copied. Its owner should revoke/rotate it. The later template changed, but revocation was not verified. Existing VAMM credentials/provider code stay server-side; no key setup or secret inspection was needed.

Learning content uses original explanations with primary source links, including [Investor.gov stocks](https://www.investor.gov/introduction-investing/investing-basics/investment-products/stocks), [asset allocation](https://www.investor.gov/introduction-investing/getting-started/asset-allocation), [compound interest](https://www.investor.gov/introduction-investing/investing-basics/save-and-invest/small-savings-add-big-money), Bank Indonesia inflation and Fidelity learning pages. Source claims that a frozen engine produces real market prices were not adopted.

## Team and ownership

Actual checkout: **C:/code/VAMM**, branchmain, baselinecc2652c54f2e1059ba24cd5a710ea0485a3b6bac. The session's C:/code/VAAM is not the project. Direct CEO operations work without ACL/trust/configuration changes. Three existing generic workers were resumed with their saved TOML role definitions, common guidance, role guides and original briefs. This is an explicit saved-role fallback, not native named-role selection. No worker delegated further.

| Owner | Owned implementation / dependencies |
|---|---|
| Interface | Academy/Missions pages, learning components/hook, static diagrams and StudioArtwork; consumes Data's learning repository and existing motion preferences. |
| Data/platform | Isolated learning types/catalog/progress and mentor-history repositories/tests; consumes the existing Result type without opening financial stores. Read-only final AST/security review. |
| Simulation/AI | Learning/studio browser tests, protected-file verification and adoption/security review; no engine, gateway or provider changes. |
| CEO | Shared shell/Home/News presentation, Learning Profile/activity and saved-answer UI, existing route checks, integration, documentation, canonical execution and Git. |

Workers retained restricted writes and staged bounded files in the existing visualization directory. CEO reviewed/imported them and performed runtime verification. Worker static checks are reported separately from CEO-executed tests. Three handoffs and the adoption/security matrix are copied into the evidence directory.

## Persistence and failure handling

vamm-learning-v1 is an independent IndexedDB database. Its strict versioned aggregate stores canonical lesson/question IDs and answer indexes. Scores, points and XP are derived from validated records. Revision checks occur in atomic read/write transactions. Matching submissions replay before revision rejection; conflicting payloads fail. Late draft writes cannot overwrite submitted attempts; older start requests cannot move the active draft backward. A stale same-ID submitted attempt becomes read-only after reconciliation.

Manual retry retains the exact UUID/payload/revision. No automatic mutation retries or mount-time writes are added. Corrupt/unavailable storage remains visible without a silent reset, memory-only success or destructive migration. Capacity is1000 started attempts including abandoned drafts; the explicit cap preserves reward/replay history.

vamm-mentor-history-v1 stores validated independent answer snapshots with a100-answer capacity. Save replay is idempotent for matching IDs/payloads; conflicts and quota errors are explicit and atomic. No automatic pruning. Confirmed deletion removes only the selected saved answer. Saved research remains accessible to others using the same browser profile; it is not authenticated or tamper-proof storage.

Neither database changes vamm-demo-v2, its owner/session/turn records, financial history or reset behavior. All36 protected files and the original logo bytes are checked independently.

## Verification and fixes

| Check actually executed by CEO | Final result |
|---|---|
| npm test |299/299 unit/integration tests,31 suites passed. Includes34 learning repository,18 mentor-history and10 learning UI/hook cases. |
| npm run typecheck / npm run lint |Passed; final production build also ran TypeScript after the last source correction. |
| npm run build |Passed; nine feature routes, root/not-found and the three unchanged existing APIs generated. |
| npm run test:e2e |82/82 desktop/mobile checks passed in58.6s on a fresh model-disabled production server. Includes all24 motion recipes, full three-turn/shock/reset/history journey,12 learning checks and4 studio timeline/financial-isolation checks. |
| Responsive |28 checks: all nine routes at320/768/1440px plus a maximum-length comparison symbol at320px. Zero horizontal overflow or page errors; original logos decoded. |
| Owned text contrast |54 rendered states across1440/390px, including all ten lesson readers, quiz setup/question/exit/results, research and simulation dialogs, headers and animation controls. Zero final findings. |
| Real provider smoke |Six checks at1440/390px: NVDA/KO and BBCA/BBRI comparisons plus News. Provider scripts200, actual chart lines/headlines reviewed, no final page errors/failed requests/overflow. Provider code stayed unchanged through final palette correction. |
| Protection |36/36 protected SHA-256 hashes match the baseline; original logo byte hash verified in browser tests. |
| Credential boundaries |Changed/new text marker scan had zero findings; browser checks inspected served same-origin JS without exposing values. No env file or real model call used. |

Evidence and original failures: [verification-summary.json](evidence/learning-2026-11-07/verification-summary.json), [protected proof](evidence/learning-2026-11-07/protected-proof.json), [contrast](evidence/learning-2026-11-07/contrast-final.json), [responsive checks](evidence/learning-2026-11-07/responsive-report.json), [provider checks](evidence/learning-2026-11-07/provider-final.json), and the worker handoffs in the same directory.

The initial midnight full run was80/82: duplicate shared/shell color declarations restored the earlier palette. Aligning both token blocks fixed the real style collision; the existing assertions were retained. The corrected canvas then exposed52 shared-muted-text findings across54 states. Updating that text to the final source's darker muted color yielded zero findings. The last full82-case run and production build passed after both fixes. Earlier caption/test-selector/rate-limit evidence remains preserved rather than overwritten.

Initial failures were retained in ISSUES and the evidence directory: generic transaction literal inference; broad test selectors; a confirmed429 from concurrent Research tests; insufficient muted-caption contrast; and reload/exit focus behavior. Fixes keep validation, request limits and financial safeguards intact. The runner Back control now uses the same save/discard confirmation as Exit quiz. Final checks include corrupt/quota/conflict/replay cases and preserved financial records, not only happy paths.

No dependency, plugin, paid service, real model call or deployment was added. Real-provider checks are distinct from deterministic widget stubs; provider availability, quote delays and universal exchange coverage are not guaranteed. Contrast checks cover owned rendered text/states and are not a complete accessibility certification or inspection of closed provider internals.

## Demo and Git handoff

Use [docs/DEMO-WALKTHROUGH-2026-11-07.md](../../docs/DEMO-WALKTHROUGH-2026-11-07.md) for the recording sequence and truthful feature labels. Git delivery targets existing origin/main at [Naixoo1/VAMM](https://github.com/Naixoo1/VAMM), preserving its history. The commit containing this report is the delivery revision. Vercel deployment remains queued for user acceptance.
