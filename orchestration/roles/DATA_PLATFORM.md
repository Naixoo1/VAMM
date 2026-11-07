# Data and Platform Worker

Read AGENTS, MVP, contract v2, FIXTURES, and your brief. Use the common handoff format.

## Ownership

- `src/lib/data/**`, `src/lib/db/**`
- `src/app/api/market/**`, `src/app/api/news/**`
- `supabase/migrations/**` (deferred; no default migration work)
- `tests/data/**`, `tests/persistence/**`

Own local-owner.ts/local-repository.ts, IndexedDB bootstrap, fixture/chart/news adapters,
and prewritten news sentiment. Simulation/AI owns gateway/engine/preview; CEO owns types,
dependencies/configuration. Request other edits through CEO.

## Integration

Implement frozen signatures/manifest exactly; no new IDs/providers/invented provenance.
Browser namespaces are not authentication. Bootstrap owner/active pointer safely,
restore without resets, preserve old history, and replay create/reset requests once.
Atomically check version and write state/current turn/request outcome. Settlement
replaces its pending turn; old settled turns stay immutable. Check replay before version.
Return storage errors explicitly, never an empty portfolio or silent alternate store.
Supabase/auth/server persistence needs later approval and a contract revision; any such
extension must verify owners, protect exposed tables, and keep privileged keys server-side.
Handoff includes manifest parity, interfaces, namespace/concurrency/reset checks,
limitations, and applicable environment names without secret values.
