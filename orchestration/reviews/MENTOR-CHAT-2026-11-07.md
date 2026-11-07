# Conversational Mentor extension — 2026-11-07

User explicitly requests a chat-focused AI Investment Mentor, screenshot analysis and persistent prior chat sessions, with three workers, Git delivery and established automatic Vercel deployment. This supersedes earlier Mentor display/chat/screenshot deferral only. Source baseline: fdb1a74. Actual checkout: C:/code/VAMM.

## Boundaries and ownership

Protected contract v2, fixtures, simulation engine/gateway/storage, original identities, configuration and dependency manifests remain unchanged. Existing /api/research stays intact. No new plugin, paid service, cloud database or dependency. Existing server-side OpenAI configuration may power independent /api/mentor-chat; absent credentials produce an explicit unavailable state, never a synthetic substitute presented as AI.

Three existing generic workers resume with saved role instructions and common/role/brief paths; native named-role selection is unavailable. No recursive delegation. Workers stage disjoint files in the existing visualization workspace if inherited filesystem restrictions prevent direct writes; CEO integrates.

| Task | Owner | Owned paths | Dependencies |
| --- | --- | --- | --- |
| MENTOR-CHAT-DATA-01 | Data/platform | New lib/mentor/types.ts, history.ts; tests/data/mentor-chat-history.test.ts | Independent IndexedDB |
| MENTOR-CHAT-UI-01 | Interface | research/page.tsx; new components/mentor, hooks/use-mentor-chat.ts, tests/ui/mentor-chat.test.tsx | Repository and endpoint |
| MENTOR-CHAT-AI-01 | Simulation/AI | New lib/ai/mentor-chat.ts, api/mentor-chat/route.ts; tests/ai/mentor-chat.test.ts | Existing server-side OpenAI configuration |
| MENTOR-CHAT-VERIFY-01 | CEO | Browser/legacy regression adaptations, documentation, integration, Git/deployment | Three handoffs |

## Accepted behavior

- Mentor primary view is conversational: new chat, session list, reopen, follow-ups and screenshot preview/removal.
- Past conversations remain in isolated browser-local vamm-mentor-chat-v1; no silent pruning, corruption reset or concurrent overwrites. Browser clearing/quota and shared-profile access remain explicit limits. Google login does not imply cloud sync. Legacy saved basket answers remain reachable read-only without migration or fabricated conversations.
- Save questions before requesting replies. No duplicate sends or automatic model retries; failed replies retain the question. New chat preserves previous chats.
- Bounded request context: last20 messages, 4000 characters each, latest screenshot only. PNG/JPEG/WebP at most2MiB, validated server-side; no remote image URLs or SVG.
- Screenshot interpretation uses visible evidence, uncertainty and conditional scenarios. It is not a live price feed or guaranteed prediction. History/images cannot authorize tools/trades or read/change financial state.
- Credentials stay server-side. Same-origin, size, concurrency/rate, output and timeout guards apply; no sensitive logs.
- Verify storage/server failures, follow-up/reload, upload/retry, mobile/keyboard, protected hashes, types/lint/build, Git and production. Mocked-provider checks are never real-model success claims.

## Evidence

All three implementation tasks progressed Running → Review → Integrated → Verified locally after actual worker handoffs. CEO deployment verification follows the Git push.

- 478/478 unit/integration checks across37 suites: includes31 new storage,54 server and14 UI tests. Server tests intercept model responses; no live calls in local tests.
- Full94 desktop/mobile browser regression checks passed, followed by2 additional unsaved-reply recovery checks. This covers all24 motion treatments, three financial turns/reset/history, learning/auth, new chat/follow-up/screenshot/reload, read-only legacy answers and safe manual retries.
- TypeScript, ESLint and production build passed. Six final visual states at320/390/1440 pixels have no horizontal overflow or text-contrast findings. Desktop/mobile screenshots visually reviewed.
- All36 protected baseline hashes remain identical to this task's starting revision, including package files, financial v2/fixtures, engine/gateway/storage, identities and project configuration.
- No new dependency/plugin/paid data service. The user added the existing OpenAI key securely in Vercel; CEO configured OPENAI_MENTOR_MODEL=gpt-5.4-mini for the independent chat. Secret values were not read or printed. Configuration presence alone is not provider success.

Initial checkpoint failures: one JSX closing brace and rendering a mutable ref rejected by lint; repaired without changing rules. Independent review found unsaved-reply navigation loss, model-dependent local save retry, and hidden screenshot retry context; informed discard, local-only retry and locked pending image edits resolve them. New browser fixtures initially used ambiguous heading/alert selectors; scoped them to h1/main. Preserve this distinction between implementation defects and test-harness defects.

Worker evidence: Data/platform owns the isolated repository, atomic CAS/replay and31 tests; Simulation/AI owns the independent bounded image/text endpoint and54 tests; Interface owns chat/archive UI, hook and14 tests. Each loaded saved/common/role guidance and reported actual checks. No worker modified financial state or invoked models. Production code is frozen for Git delivery.

Walkthrough/setup: docs/MENTOR-CHAT.md and docs/DEMO-WALKTHROUGH-2026-11-07.md. External detailed artifacts are under the session visualization directory: chat-visual, chat-protected-baseline.json, vamm-chat-staging and chat-hosted. Final deployed SHA/status and any real-provider test results are recorded in the external delivery report after deployment, avoiding a documentation-only redeploy loop.
