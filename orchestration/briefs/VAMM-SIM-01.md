# VAMM-SIM-01: Aegis and Local Simulation

Owner: Simulation/AI. Contract: v2 + FIXTURES. Depends on CEO types, Data/platform
scenarios/repository; matching stubs may unblock work. Implementation queued.
Ownership: `orchestration/roles/SIMULATION_AI.md`; handoff: `AGENTS.md`.

## Deliver and accept

- Pure engine/shared preview → local gateway → prewritten feedback → research.
  No default simulation HTTP routes/cloud persistence.
- Preview/ADVANCE match: floor allocation then fixed-order remainder, skip zero weights;
  half-up ties upward; preserve full inflation precision.
- Zero returns/inflation preserve value except contribution/approved withdrawals.
  Rp100 at +10% then -10%, no contributions, yields Rp99; Rp110/1.10 yields Rp100 real.
- Match FIXTURES turn-01 reference balances before/after explicit cash funding.
- Correct pending/null fields and version increments; bill blocks ADVANCE; settlement
  never repeats returns/contribution/inflation; third settlement completes.
- Funding fits holdings/bill; shortfall acknowledgment; no debt/silent liquidation.
- Repository idempotency/conflicts and reset/history integration follow frozen contract.
- Feedback loads committed turns/templates; observations <25 words, no diagnoses.
- Research validates IDs/evidence, 15-second timeout/no automatic retry, labeled
  refusal/invalid-output/outage fallback; no authority over financial state.

Checkpoints: engine/preview 2h; gateway 2.5h; local journey 3.5h; research 4.5h.
Fallback: labeled prewritten research, preserving deterministic simulation/storage.

## Reconciled feature meanings — 2026-11-07

AI Investment Mentor names the existing grounded research view; suggested prompts use
unchanged ResearchRequest. Explain only supported concepts/evidence; unavailable P/E,
company data and personal recommendations stay unavailable. Portfolio reflection remains
committed-turn prewritten feedback, not autonomous analysis or order execution.
No quiz/XP logic or new trading engine is assigned by the incoming checklist.
