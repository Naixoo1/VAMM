# VAMM Frozen Fixtures

Frozen 2026-11-06 for contract v2. This manifest is to implement later, not live data.
All returns, inflation, chart values, stories, and dates are synthetic teaching examples.
Never present them as real observations or fabricate publishers/source URLs.

## Versions and defaults

- datasetVersion: `vamm-demo-2026-11-06.v1`
- calculationVersion: `vamm-calc.v1`
- scenarioSequenceId: `student-15-18.v1`
- feedback template: `feedback-demo.v1`; research fallback: `research-demo.v1`
- Initial age=15, balances=0, turnIndex/version=0, inflation index=1.
- Default savingsRateBps=5000; contributionAllocation cash=3000, bonds=3000, equity=4000.
- Synthetic observedAt/publishedAt: `2026-11-06T00:00:00Z`; currency IDR.

| Instrument ID | Display name | Asset class |
|---|---|---|
| edu-cash | Simulated cash | cash |
| edu-bonds | Simulated bond basket | bonds |
| edu-equity | Simulated diversified equity basket | equity |

Only these instruments are selectable, ordered as above. Default compare: edu-bonds/
edu-equity. All instruments/scenarios/charts cite `ev-demo-method`: title "VAMM synthetic
teaching methodology", sourceUrl=null, dataMode=synthetic, fixed observedAt above.
It identifies authored assumptions, not external corroboration.

## Scenario sequence

One-year turns; weeklyAllowanceRupiah=100000 before multiplier.
Rates below are decimals, not percentages or forecasts.

| Turn / Scenario ID | Ages | Multiplier | Returns cash / bonds / equity | Inflation | Shock ID / cost Rp |
|---|---|---|---|---|---|
| 1 / turn-01 | 15 → 16 | 1 | 0 / 0.04 / 0.08 | 0.03 | shock-device / 150000 |
| 2 / turn-02 | 16 → 17 | 1.5 | 0 / 0.03 / -0.12 | 0.04 | shock-school / 200000 |
| 3 / turn-03 | 17 → 18 | 2 | 0 / 0.05 / 0.10 | 0.025 | shock-home / 300000 |

Frozen title/mechanism:
- shock-device: Device repair / "An essential study device needs an unexpected repair."
- shock-school: School expense / "An unexpected school-related cost reduces available savings."
- shock-home: Household repair / "The scenario includes a contribution to an urgent household repair."

Use this order, one shock per turn, without randomness. These costs do not imply
a real student's obligations.

## Chart and comparison

Recharts index line, baseValue=100. Synthetic dates/values, not asset prices.

| Date | edu-cash | edu-bonds | edu-equity |
|---|---|---|---|
| 2023-11-06 | 100 | 100 | 100 |
| 2024-11-06 | 100 | 104 | 108 |
| 2025-11-06 | 100 | 107.12 | 95.04 |
| 2026-11-06 | 100 | 112.476 | 104.544 |

Keep full fixture values; display index values to two decimals.
Every instrument has these metrics in order:
- cumulative_return: cash=0, bonds=0.12476, equity=0.04544; unit=ratio;
  periodStart=2023-11-06, periodEnd=2026-11-06; unavailableReason=null;
  methodology="Compounded synthetic returns; no contributions or withdrawals".
- annual_fee: value=null, unit=ratio, both periods=null; methodology="Not modeled";
  unavailableReason="Educational basket has no modeled product fee".
No live-price or volatility metric.

## Synthetic news

All use sourceName/sourceUrl=null, dataMode=synthetic, sentimentOrigin=prewritten,
and fixed publishedAt above. Matching evidence uses headline as title, the same null
URL/time/mode/datasetVersion. Order as listed.

| News ID / Evidence ID | Exact headline | Sentiment | Reason |
|---|---|---|---|
| news-inflation / ev-news-inflation | Synthetic scenario: rising prices reduce cash purchasing power | negative | Describes pressure on purchasing power |
| news-bonds / ev-news-bonds | Synthetic scenario: bond basket records a modest gain | positive | Describes a positive scenario return |
| news-equity / ev-news-equity | Synthetic scenario: equity basket falls before recovering | mixed | Describes both a decline and recovery |

Each item's evidenceIds contains its matching news evidence ID. Evidence catalog is
exactly ev-demo-method plus these three news evidence IDs. No runtime news model calls.

## Feedback and research fallback

Simulation/AI authors feedback-demo.v1 templates under `src/lib/ai/**`, selected by
committed pending/settled status. Bill first, then mechanism, paid/unmet cost,
nominal/real distinction, one reflection question. Use calculated fields, under 25
words per observation, origin=prewritten, and no diagnoses.

research-demo.v1 fallback uses selected instruments and ev-demo-method, explains
synthetic modeled changes and unavailable fees, and includes the question limitation
or service-failure reason. Never invent facts or claim fresh generation.

## Reference checks for later implementation

Defaults, turn-01: contribution=2600000; allocated cash/bonds/equity=
780000/780000/1040000; post-return=780000/811200/1123200.
Before bill: nominal=2714400, investment gain=114400, real=2635340.
Explicit cash funding=150000 settles to 630000/811200/1123200;
nominal=2564400, real=2489709, unmet=0, phase=ready, age=16, turnIndex=1, version=2.
These are specification examples, not executed application tests.
