# VAMM-UI-01: Five-Screen Demo

Owner: Interface. Contract: v2 + frozen FIXTURES. Depends on CEO scaffold/types,
Data/platform market/news/storage, and Simulation/AI gateway. Implementation queued.
Ownership: `orchestration/roles/INTERFACE.md`; handoff: `AGENTS.md`.

## Deliver and accept

- Five screens per MVP with exact fixture IDs; Recharts uses MarketResponse.chartSeries.
- Default compare edu-bonds/edu-equity; savings 50%; new-contribution split 30/30/40.
- previewContribution supplies versioned integer allocation; no UI financial formulas.
- Explicit funding, pending bill distinct from undeducted balance, unmet null as undecided,
  nominal/real balance, and separate contribution/gain/cost; third settlement completes.
- Reset confirms and creates a new session; preserve history/switch only on success.
- Reload after replay/conflict; no silent stale-action resubmission.
- Local-device access limits, synthetic/prewritten labels, storage/model failures,
  loading/empty/invalid states; no pending duplicates/premature success.
- Desktop/mobile and keyboard accessibility with non-color labels.

Checkpoints: fixture screens 2.5h; local journey 3.5h; supporting screens 4.5h.
Fallback: omit widget/decorative detail before core behavior. Report actual checks/gaps.

## Reconciled feature meanings — 2026-11-07

Use Home/Dashboard, Research/AI Investment Mentor and News/News & Sentiment Lab labels
without new routes. Add the two suggested prompts from MVP by populating the existing
question field. Preserve evidence limits and visible prewritten/synthetic labels.
No Academy, quiz/XP, profile, stock-order form or chat-history scope is added.
