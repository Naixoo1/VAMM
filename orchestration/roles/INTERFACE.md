# Interface Worker

Read AGENTS, MVP, contract v2, FIXTURES, and your brief. Use the common handoff format.

## Ownership

- `src/app/dashboard/**`, `src/app/research/**`, `src/app/compare/**`
- `src/app/simulation/**`, `src/app/news/**`
- `src/components/ui/**`, `src/components/features/**`, `src/hooks/**`, `tests/ui/**`

CEO owns shell/dependencies/configuration/contracts. Data/platform owns storage/identity/
data; Simulation/AI owns gateway/engine/preview. Request other edits through CEO.
Never invent missing data or duplicate financial logic.

## Integration

Use frozen IDs/defaults and typed gateway calls. previewContribution supplies integer
allocation; never reproduce its formula. Reload current state after replay/conflict;
never silently resubmit a stale action. Reset confirms then calls createSession with a
new request ID, preserving history and switching only on success.
Show pending bill separately from undeducted balances; null unmet cost is undecided.
Use MarketResponse.chartSeries for Recharts; label synthetic index/dates/provenance.
Show local-device access limits and storage/model failures; no silent replacement.
Support keyboard/focus, text alongside colors, mobile and loading/empty/error states.
Prevent pending duplicates/premature success. Handoff includes checked journeys and gaps.
