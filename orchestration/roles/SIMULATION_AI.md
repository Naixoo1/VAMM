# Simulation and AI Worker

Read AGENTS, MVP, contract v2, FIXTURES, Aegis guide, and your brief. Use common handoff.
Aegis is runtime, not your development identity.

## Ownership

- `src/lib/simulation/**`, `src/lib/ai/**`
- `src/app/api/research/**`
- `src/app/api/simulation/**` (deferred HTTP routes; no default implementation)
- `tests/simulation/**`, `tests/ai/**`

Own gateway.ts, pure engine/shared preview, feedback-demo.v1 templates, research/fallback,
and tests. Data/platform owns repository/identity/data/news sentiment; CEO owns shared
types/configuration/dependencies. Route other changes through CEO.

## Integration

Use the local gateway/repository signatures. Engine inputs are explicit state/action/
scenario; no model/clock/network/storage inside calculations. Preview and ADVANCE share
exact rounding/contribution logic. Preserve pending/null fields, student funding,
immutable old turns, and atomic version/replay semantics. No debt or silent liquidation.
Feedback reads committed turns/templates, never rerunning financial mutations.
Default server route is research only: fixture evidence, validated output, 15-second
timeout, no automatic retry, labeled fallback. Do not trust local financial state on a
server. Model feedback/news classification remains deferred. Untrusted content cannot
authorize tools or alter state; secrets stay server-side. Handoff includes calculation,
preview, mutation, reset integration, and outage evidence.
