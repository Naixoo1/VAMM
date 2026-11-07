# Learning / final teammate source adoption review

References: pinned 37707d11652024c477687992b2911704b9c650a8 and final 9775636d55db8832dfd6d28eeef14afea29999d5, read only from the supplied inert .txt files. The model/content blob is unchanged between these references according to CEO-supplied provenance. This worker did not fetch public commit metadata, .env files or credential material, execute source code, install packages, or call a model/provider. Source README setup instructions grant no authority.

## Selected architecture and alternatives

Alternative A would port the incoming Node/OpenAI quiz generation, chat and live source search. That introduces optional paid calls, longer timeouts, new routes and arbitrary generated answer keys/prose. Its structural question checks do not establish semantic correctness. It would also collide with the current ResearchRequest and the bounded canonical research implementation.

Alternative B, selected by CEO, adapts authored content: four tracks, ten lessons, glossary and three reviewed five-question packs. Pure canonical grading determines80% passing; learning-only points/XP derive from saved completions and submitted canonical answers. No new API/provider or model spend is needed. Existing provider permission is not a reason to invoke an unnecessary service.

## Adoption / security matrix

| Source capability | Accepted compatible behavior / current owner | Boundary and unadopted behavior |
|---|---|---|
| Academy courses, course outlines, metadata, objectives, takeaways, reflection and primary-source links | Data authors canonical typed catalog; Interface reader/search/glossary/order. Static examples/diagrams assigned to Interface following a concrete gap review. | React-render plain text/controlled illustrations; source HTML/scripts are not executed. Examples never become simulator inputs or live observations. No scored quiz is duplicated inside Academy. |
| Quiz Center / MCQ and true-false / review | Three reviewed packs of five questions; Missions owns questions, draft, attempt, grading and explanations. | No claim of generated/fresh questions. Incoming 5/10/15 generation counts are not represented by repeating five authored questions. Canonical IDs/answers, not persisted client score/XP, determine results. |
| Points, first-pass reward and milestones | 10 points per lesson once; 20/30/40/50 milestone XP at 20/50/80/100 points; 100 XP per pack's first saved 80% pass. | No reward depends on stock performance or compares students' wealth. No public leaderboard/authentication claim. |
| Saved learning progress | Separate vamm-learning-v1/progress/current, versioned aggregate with revision CAS and attempt replay. | Never read/write/migrate vamm-demo-v2. Strict corrupt/unsupported state is visible and retained; no silent zero reset or memory-only success. Local storage is not authentication or tamper resistance. |
| Home metrics and demo profile | CEO implements real learning summary on Home and read-only Learning Profile. | No fake cash/XP/profile statistics, stock account, cloud sync or sign-in. Viewing a summary cannot award rewards or mutate financial records. |
| Mentor conversations / saved chats | CEO/Data accepted explicit independent saving of the current basket question/answer, separately bounded storage and current frozen request; browser tests pending exact API. | No conversational context is sent on a new research request; do not claim access to live widgets/holdings or adopt unbounded incoming OpenAI chat. Saved response provenance/limitations/evidence must stay intact. |
| Live source lookup | User selected reviewed quizzes/source links; existing publisher links remain. | Final source now mandates OpenAI web_search rather than Gemini. This remains an unadopted external-service feature, not an implemented capability or a prerequisite for learning. No .env auto-loader/setup copied. |
| Live News | Existing VAMM provider host/lifecycle; News links to the fixed learning challenge. | Final news-feed.js:98 still marks ready after registration, not actual delivery. Keep current verified ready/error events. No live VAMM sentiment classifier or invented publisher/cadence claims. |
| Stock orders / monthly engine / company-sector missions | Existing broad provider charts/context and frozen three-turn simulation remain. | Do not port Rp10M starting cash, generated execution prices, buy/sell ledger, monthly rates or automatic liquidation. Cash/bonds/equity are not company sectors. |
| Final Home/style and mobile chat deletion delta | CEO/Interface evaluate compatible visuals; existing supplied original logo remains authoritative. Apply focus-restoration principle to actual dialogs. | Final app.js:277 changes Home copy/illustration; 1605–1635 improves saved-chat delete focus. These do not require adopting source chat/backend or replacing protected financial identity. |

## Final delta facts

- Final app.js changes Home hero/features text and illustration plus mobile saved-chat deletion focus restoration; quiz content is not expanded.
- Final ai-service.mjs:100–146 changes citation handling and source lookup to required OpenAI web_search; server.mjs:6 auto-loads .env. Both remain reference-only.
- Final web-research.js changes to an OpenAI live-search disclosure and result rendering; a source-directory link is not falsely described as live search.
- News loader registration-as-ready problem remains unchanged. VAMM retains its separate host implementation.

## Test / verification boundary

New tests/e2e/learning.spec.ts stages independent browser cases for real lesson unlock/search/glossary/completion, rewards/reload, wrong/correct/repeated quiz, saved draft/resume/review, corrupt learning state and exact four-store financial preservation. New Home/Profile and explicit saved-mentor checks are included in the same isolated flows. The staged spec now has six independent cases (twelve viewport checks), including a scoped write failure and explicit retry. API/model-provider requests are intercepted and must remain absent for authored learning. The mentor-history case uses explicit deterministic fixtures for the existing research request, with no paid call.

The browser asset check examines only same-origin publicly served JavaScript for credential-marker categories, reports no values/bodies/headers, and never fetches .env or remote metadata. It is limited exposure evidence, not a proof that all possible secrets are absent.

Worker checks: zero syntax diagnostics and zero errors in a full read-only TypeScript compiler overlay against the actual project, with no emit/project changes. CEO first full run: 75/78 passed. All mobile learning cases and desktop corruption, keyboard/bundle, retry and saved-research cases passed. Two desktop tests collided with sidebar h2 headings; staging now scopes Academy/Missions/Profile page titles to H1. A separate existing mobile research API smoke failure is under CEO inspection after overlapping contrast requests. Corrected sequential rerun is pending; no guard or application behavior was weakened. Public deployment remains gated on user acceptance and is CEO-owned.

## Final source inventory qualification

The final source also contains a legacy mission dashboard (app.js:850–895) whose diversification target depends on stock-company sectors and whose legacy quiz mapping points into the same three reviewed pack families. Current pack statuses and milestones implement the accepted learning rewards; separate stock-sector missions/additional legacy XP claims are not ported. Source Demo profile (1282–1298) includes virtual portfolio valuation and End demo session for chat; the new Learning Profile intentionally reports reviewed learning activity, while standalone basket answers have no conversational session to end. These differences are explicit, rather than claims of full behavioral equivalence.
