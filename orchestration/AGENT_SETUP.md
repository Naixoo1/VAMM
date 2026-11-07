# VAMM Agent Setup

State: user authorized implementation on 2026-11-07. BOOT-01 and existing worker briefs are locally Verified; scope and ownership remain v2. Public deployment is queued. Generic workers received the saved role instructions explicitly.

## Routing

| Agent | Configuration | Markdown assignment |
|---|---|---|
| CEO (primary session) | `.codex/config.toml` + `AGENTS.md` | MVP, contracts, TASKS, this guide |
| `vamm_interface` | `.codex/agents/vamm_interface.toml` | `roles/INTERFACE.md`, `briefs/VAMM-UI-01.md` |
| `vamm_data_platform` | `.codex/agents/vamm_data_platform.toml` | `roles/DATA_PLATFORM.md`, `briefs/VAMM-DATA-01.md` |
| `vamm_simulation_ai` | `.codex/agents/vamm_simulation_ai.toml` | `roles/SIMULATION_AI.md`, `briefs/VAMM-SIM-01.md`, Aegis runtime guide |

Role/brief paths above are relative to `orchestration/`. Every worker also reads
`AGENTS.md`, `docs/MVP.md`, `docs/FIXTURES.md`, and `src/contracts/README.md` from the root.
Markdown stays authoritative; configuration routes agents to current files rather
than embedding copies. The primary session is CEO; do not spawn a second CEO.

## Loading and verification

Start a fresh Codex session in this project to load project settings and custom agents.
The project must be trusted in Codex; do not override organizational policy or silently
change global trust settings. Existing sessions may retain their original agent catalog.

Ask the CEO: "Check readiness using the three VAMM worker roles. Read only; report each
role's documents, ownership, dependencies, and blockers. Do not implement anything."
This is an optional readiness prompt, not an instruction to run on session startup.

Frozen baseline: contract v2, exact fixture manifest, browser-local IndexedDB, shared
engine preview, create-new-session reset, synthetic index chart, prewritten feedback/news.
No auth/Supabase or default simulation HTTP implementation; only research uses a model.
Updated Markdown determines scope; saved role configurations route to these current files.
For incoming teammate files, CEO follows `orchestration/INTAKE.md`; workers report
affected contracts/ownership and re-read revised documents before resuming. Use
`orchestration/ISSUES.md` for observed errors. These guides are loaded on demand;
there is no background watcher or automatic file execution.

After explicit implementation authorization, CEO assigns bounded tasks under AGENTS.md.
Keep at most three spawned agents open, close completed agents when necessary, and
reuse a free slot for checkpoint review. Workers do not delegate.

If a client cannot select custom roles, CEO may pass the matching role instructions and
document paths explicitly to a generic worker; report the fallback rather than claiming
the named role loaded. Do not launch duplicate work.

## ECC integration and boundaries

Use the already-installed ECC plugin and inherited skills/tools. No copied plugin
catalog, global install, new credentials, model pinning, or permission overrides.

- Interface: frontend-patterns, frontend-a11y, react-testing as needed.
- Data/platform: api-design, security-review; Supabase skill when relevant.
- Simulation/AI: api-design, security-review, verification-loop; official API docs.
- CEO: installed planning/architecture guidance; code/security/browser review at checkpoints.

Read applicable skills on demand; do not load the full catalog as instructions.
Ownership and the implementation pause are agent instructions, not filesystem access
controls. Workers inherit the parent's permissions and available tools.
Preserve original IDENTITY, SOUL, and USER files. Do not deploy Aegis in this setup step.

## Setup validation

Validated with Codex CLI 0.167.0: strict startup configuration accepted; native prompt
assembly includes CEO instructions, project guidance, all three registered worker
descriptions, and inherited ECC skills. Required Markdown paths resolve.
That setup validation did not dispatch tasks or request model output. The later read-only
worker readiness check used the documented fallback and identified contract decisions;
contract v2 and FIXTURES now resolve them without starting application work.

## Feature checklist reconciliation — 2026-11-07

Read `orchestration/reviews/FEATURES-2026-11-07.md` when reviewing checklist scope.
User directed MVP preservation: existing views gain equivalent Home/Mentor/News Lab
labels and suggested prompts through the existing request. Contracts/fixtures/ownership
stay v2; Academy, stock trading, Missions/XP, profiles and live model sentiment remain deferred. A later explicit user request authorizes independent automatically updating TradingView News presentation; frozen synthetic practice remains unchanged.
The source checklist is reference-only; no new module or agent task is activated.
