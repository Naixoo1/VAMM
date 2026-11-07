# VAMM Shared Contracts

Version: 2. Frozen 2026-11-06; replaces v1. Interface changes require CEO approval and
a version bump. Read `docs/FIXTURES.md` for frozen IDs/values/versions.
This is documentation only; implementation remains unauthorized.

## Defaults and conventions

Default: browser-local IndexedDB, no sign-in or server-persisted simulation.
Data/platform owns local identity/storage/data; Simulation/AI owns gateway/engine/
preview/feedback; Interface calls the gateway without duplicating financial logic.
Supabase/server simulation is deferred and requires a reviewed contract amendment.

Validate inputs at runtime; reject unknown fields, unsupported versions, nonfinite or
unsafe numbers. Use stable IDs, ISO dates/timestamps, and null with an unavailable reason.
Money is safe integer rupiah; holdings/contributions/funding/costs are nonnegative.
Savings are integer basis points 0–10000; allocation uses all three assets, integer
0–10000 each, totaling 10000. Rates are decimals (0.05 = 5%).

- AssetId: cash | bonds | equity.
- DataMode: historical | synthetic | sample; default fixtures are synthetic only.
- MoneyByAsset: all three AssetId keys with nonnegative integer amounts.
- SessionPhase: ready | awaiting_shock_decision | complete.
- Origin: model | prewritten; label prewritten output.
- Evidence: {id,title,sourceUrl:string|null,observedAt,dataMode,datasetVersion}.
  Synthetic URL is null; never invent publishers or external provenance.
- ContractVersion: literal 2. Other version IDs are in FIXTURES.
- Result<T>: {ok:true,data:T} | {ok:false,error:ErrorResponse}.
- ErrorResponse: {code,message,retryable,requestId:string|null}; no secrets/internals.
  Read-only failures may use requestId:null.

## Market and news shapes

| Type | Fields |
|---|---|
| InstrumentSnapshot | id, name, assetClass:AssetId, currency:IDR, observedAt, dataMode, datasetVersion, evidenceIds[], metrics:ComparisonMetric[] |
| ComparisonMetric | key, value:number\|null, unit, periodStart:string\|null, periodEnd:string\|null, methodology, unavailableReason:string\|null |
| ChartSeries | instrumentId, currency:IDR, unit:index, baseValue:100, dataMode:synthetic, datasetVersion, evidenceIds[], points:{date,value}[] |
| MarketResponse | contractVersion:2, instruments:InstrumentSnapshot[], chartSeries:ChartSeries[], evidence:Evidence[] |
| NewsItem | id, headline, publishedAt, sourceName:string\|null, sourceUrl:string\|null, dataMode, evidenceIds[], sentiment:positive\|neutral\|negative\|mixed\|null, sentimentReason:string\|null, sentimentOrigin:Origin\|null |
| NewsResponse | contractVersion:2, datasetVersion, items:NewsItem[], evidence:Evidence[] |

Compare compatible keys/units/methodologies/periods/currencies; no FX conversion.
Chart is a Recharts synthetic index line, never a live price. Data/platform supplies
prewritten news sentiment; runtime model classification is deferred.

## Scenario and session shapes

Scenario: {id,datasetVersion,turnIndex:1|2|3,durationYears:1,weeklyAllowanceRupiah,
allowanceMultiplier,returnsByAsset:{cash,bonds,equity},inflationRate,
shock:{id,title,costRupiah,mechanism},evidenceIds[]}.
Gateway selects the next frozen scenario. Actions cannot supply returns/inflation/
allowance/multiplier/shock costs. Rates have at most four decimal places; return >= -1,
inflation > -1, multiplier >= 0. Reject any unsafe intermediate or result.

SimulationSession: {id,contractVersion:2,version,phase,turnIndex,age,balances:MoneyByAsset,
cumulativeInflationIndex,pendingShock:null|Scenario.shock,scenarioSequenceId,
datasetVersion,calculationVersion}.
Initial: version/turnIndex 0, age 15, zero balances, index 1, phase ready.
SessionBundle: {session:SimulationSession,turns:TurnRecord[]} ordered by turnIndex.
Owner namespace is repository metadata, never a supplied server identity.

## Frozen asynchronous interfaces

All operations return Promise<Result<T>>. IDs/owner are strings; versions are integers.
The gateway resolves local owner internally. Signatures are specifications, not code.

| Gateway operation | Request | Result data T |
|---|---|---|
| createSession | {requestId} | SessionBundle |
| getSession | {sessionId} | SessionBundle |
| getActiveSession | none | SessionBundle\|null |
| previewContribution | PreviewRequest | ContributionPreview |
| applyAction | MutationRequest | MutationResult |
| getFeedback | {sessionId,turnIndex,decisionStatus:pending\|settled} | FeedbackResponse |

| Repository operation | Parameters | Result data T |
|---|---|---|
| getOrCreateLocalOwner | none | string |
| createSession | owner, requestId | SessionBundle |
| getActiveSession | owner | SessionBundle\|null |
| getSession | owner, sessionId | SessionBundle |
| getTurnHistory | owner, sessionId | TurnRecord[] |
| getRequestOutcome | owner, sessionId, requestId | StoredOutcome\|null |
| commitMutation | owner, request:MutationRequest, next:SessionBundle | MutationResult |

StoredOutcome: {canonicalPayload:string,result:MutationResult}.
commitMutation checks owner/version/phase and atomically writes validated engine
candidate state, turn, and request outcome. ADVANCE inserts a pending turn;
SETTLE_SHOCK replaces it at (owner,sessionId,turnIndex). Never append an extra turn
or mutate earlier settled turns.

## Local persistence and reset

IndexedDB database `vamm-demo-v2`, schema version 1; stores `metadata`, `sessions`,
`turns`, `requestOutcomes`. Data/platform owns `src/lib/db/local-owner.ts` and
`src/lib/db/local-repository.ts`. Metadata stores random owner UUID and active session.
Namespace records by owner. This isolates namespaces, not people sharing a browser;
it provides no authentication or tamper resistance. Never trust local state on servers.

Create/reset uses a new UUID per user intent. Scope create replay keys to
(owner,create,requestId): repeating a create request returns the same new session
without moving an already-newer active pointer backward. UI reloads getActiveSession
after create/reset, including any replay.
Atomically create session and switch active pointer. Reset confirms, preserves old
session/history, and switches only on success. Restore never silently resets corruption.
Unavailable/corrupt storage returns STORAGE_UNAVAILABLE; no silent alternate store.

Mutation replay keys: (owner,sessionId,requestId). After owner lookup, check completed
outcomes before stale versions:
- Same ID + same canonical payload: replay original result without mutation.
- Same ID + changed payload: IDEMPOTENCY_CONFLICT.
- New ID + stale expectedVersion: STATE_CONFLICT.

Canonical payload is validated MutationRequest without requestId, compact JSON with
recursively lexicographically sorted object keys. Keep expectedVersion; values are
integers/strings/booleans/objects. No coercion or input rounding.
Replay returns original snapshot with replayed:true; UI reloads current state afterward
so a late replay cannot overwrite a newer displayed version.

A readwrite transaction across session/turn/outcome stores checks version and commits
all records once; concurrent writes cannot both succeed against one version.
Failure changes nothing. Never include a model call in a financial transaction.

## Preview and actions

PreviewRequest: {sessionId,expectedVersion,savingsRateBps,contributionAllocation}.
ContributionPreview: {sessionVersion,nextTurnIndex,scenarioId,ageAfter,
weeklyAllowanceRupiah,allowanceMultiplier,savingsRateBps,contributionAllocation,
contributionRupiah,allocatedContribution:MoneyByAsset,datasetVersion,calculationVersion}.
Preview requires ready phase/matching version, changes nothing, and uses the same pure
contribution helper as ADVANCE. UI never duplicates the formula.

MutationRequest is one of:
- {sessionId,expectedVersion,requestId,action:ADVANCE,savingsRateBps,contributionAllocation}
- {sessionId,expectedVersion,requestId,action:SETTLE_SHOCK,funding:MoneyByAsset,acknowledgeUnmetCost:boolean}

ADVANCE: ready → awaiting_shock_decision; increment age/turn/version once, contribute,
apply returns/inflation, and record one undeducted bill. Pending bills block ADVANCE.
SETTLE_SHOCK: deduct explicit funding; increment version only; phase ready, or complete
after turn 3. Never repeat contribution/returns/inflation.
Funding per asset cannot exceed holdings; total cannot exceed bill. Short funding
requires acknowledgeUnmetCost=true; record unmet expense without debt/penalty.
No automatic liquidation, rebalancing, or negative holdings.

## Exact rounding and accounting

For nonnegative x, roundHalfUp(x)=floor(x+0.5): ties upward. Use exact fixture decimal
values and full inflation products, never display-rounded intermediates.
Reject nonpositive/nonfinite inflation index and unsafe amounts.

    contribution = roundHalfUp(weeklyAllowanceRupiah * 52 * allowanceMultiplier * savingsRateBps / 10000)
    allocated[asset] = floor(contribution * contributionAllocation[asset] / 10000)

Distribute the remainder (at most two rupiah), one per asset in cash → bonds → equity
order, skipping zero weights. Allocation sums exactly to contribution and appears in preview.

    postReturn[asset] = roundHalfUp((starting[asset] + allocated[asset]) * (1 + return[asset]))
    ending[asset] = postReturn[asset] - approvedWithdrawal[asset]
    inflationIndex = previousInflationIndex * (1 + inflationRate)
    nominal = sum(ending)
    real = roundHalfUp(nominal / inflationIndex)
    investmentGain = sum(postReturn) - sum(starting) - contribution
    endingTotal = startingTotal + contribution + investmentGain - paidShockCost

Contributions precede annual returns; withdrawals follow returns. investmentGain may be
negative, computed by subtraction without independent rounding. Compounding already
includes path effects; never subtract an extra volatility-drag charge.

## Results and pending fields

MutationResult: {session,turn:TurnRecord,feedbackStatus:pending|available|unavailable,
replayed:boolean}. Financial response initially uses feedbackStatus:pending; feedback
is fetched separately and never rewrites cached financial outcomes.

TurnRecord: {turnIndex,scenarioId,ageBefore,ageAfter,startingBalances,contributionRupiah,
allocatedContribution,postReturnBalances,investmentGainRupiah,inflationRate,
cumulativeInflationIndex,shock,paidShockCostRupiah,unmetShockCostRupiah:number|null,
funding:MoneyByAsset|null,acknowledgeUnmetCost:boolean|null,endingBalances,
nominalBalanceRupiah,realBalanceRupiah,decisionStatus:pending|settled,
datasetVersion,calculationVersion}. All balance maps are MoneyByAsset.

Pending: paidShockCost=0, unmetShockCost=null, funding=null, acknowledgment=null,
endingBalances=postReturnBalances; session balances and nominal/real reflect undeducted
holdings, and pendingShock contains the separate bill.
Settled: record funding/acknowledgment; paid=sum(funding), unmet=bill-paid,
ending=postReturn-funding, pendingShock=null. Recalculate real without advancing
inflation. Session and turn balances agree after every mutation.

FeedbackResponse: {billSummary,mechanism,observations:string[],reflectionQuestion:string|null,
origin:Origin}. Default getFeedback reads a locally committed turn and versioned
prewritten templates, never replacement UI numbers. A decisionStatus mismatch returns
STATE_CONFLICT. Observations are under 25 words; no diagnoses or initiated actions.
Model adaptive feedback is deferred; feedback failure/retry never repeats or rolls back
financial state. Simulation works without a model.

## Default HTTP and research

Simulation uses local gateway methods, not HTTP persistence endpoints. Only these
server routes are in default scope:

| Method/path | Input / Result data |
|---|---|
| GET /api/market | none / MarketResponse |
| GET /api/news | none / NewsResponse |
| POST /api/research | ResearchRequest / ResearchResponse |

HTTP uses Result<T>. Status mapping: 400 invalid input/version, 404 missing ID, 409
state/idempotency conflict, 422 phase/balance, 429 rate limit, 503 model/data unavailable,
500 internal. Matching local fixture adapters may unblock UI during endpoint integration.

ResearchRequest: {instrumentIds:string[],question:string}; 1–2 distinct frozen IDs,
trimmed question 1–1000 characters. Server selects fixture evidence; no client URLs.
ResearchResponse: {summary,facts:{text,evidenceIds:string[]}[],limitations:string[],
evidence:Evidence[],origin:Origin}. Validate structured output and evidence IDs;
omit unsupported facts or mark unavailable.
15-second service timeout, no automatic model retry. Refusal/timeout/incomplete/
malformed output/unknown evidence returns labeled prewritten fixture-based output
with the failure reason in limitations. No financial mutation or trusted local-state input.

V1 simulation HTTP session/preview/turn/feedback routes are deferred with Supabase and
must not be scaffolded by default. No credential, model, auth, or database setup is
authorized here. Limit research request size/rate/output before public deployment:
CEO owns hosting configuration; Simulation/AI owns route guards.

## Errors

INVALID_INPUT, UNSUPPORTED_VERSION, UNAUTHORIZED, NOT_FOUND, STATE_CONFLICT,
IDEMPOTENCY_CONFLICT, INVALID_PHASE, INSUFFICIENT_BALANCE, STORAGE_UNAVAILABLE,
DATA_UNAVAILABLE, MODEL_UNAVAILABLE, RATE_LIMITED, INTERNAL_ERROR.
Only transient storage/service/rate-limit failures are retryable; conflicts require
reload/reconciliation. Financial retries keep requestId and payload. No privileged
keys in browser output or sensitive logs.
