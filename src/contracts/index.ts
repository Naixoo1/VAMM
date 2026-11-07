/** Executable types for the frozen contract v2. README.md remains the specification. */
export const CONTRACT_VERSION = 2 as const;
export const DATASET_VERSION = "vamm-demo-2026-11-06.v1" as const;
export const CALCULATION_VERSION = "vamm-calc.v1" as const;
export const SCENARIO_SEQUENCE_ID = "student-15-18.v1" as const;
export const FEEDBACK_TEMPLATE_VERSION = "feedback-demo.v1" as const;
export const RESEARCH_FALLBACK_VERSION = "research-demo.v1" as const;
export const ASSET_IDS = ["cash", "bonds", "equity"] as const;
export const DEFAULT_SAVINGS_RATE_BPS = 5000;
export const DEFAULT_CONTRIBUTION_ALLOCATION = { cash: 3000, bonds: 3000, equity: 4000 } as const;
export const DEFAULT_ALLOCATION = DEFAULT_CONTRIBUTION_ALLOCATION;
export type ContractVersion = typeof CONTRACT_VERSION;
export type AssetId = typeof ASSET_IDS[number];
export type DataMode = "historical" | "synthetic" | "sample";
export type Origin = "model" | "prewritten";
export type MoneyByAsset = Record<AssetId, number>;
export type SessionPhase = "ready" | "awaiting_shock_decision" | "complete";
export type DecisionStatus = "pending" | "settled";
export type ErrorCode = "INVALID_INPUT" | "UNSUPPORTED_VERSION" | "UNAUTHORIZED" | "NOT_FOUND" | "STATE_CONFLICT" | "IDEMPOTENCY_CONFLICT" | "INVALID_PHASE" | "INSUFFICIENT_BALANCE" | "STORAGE_UNAVAILABLE" | "DATA_UNAVAILABLE" | "MODEL_UNAVAILABLE" | "RATE_LIMITED" | "INTERNAL_ERROR";
export interface ErrorResponse { code: ErrorCode; message: string; retryable: boolean; requestId: string | null; }
export type Result<T> = { ok: true; data: T } | { ok: false; error: ErrorResponse };
export interface Evidence { id: string; title: string; sourceUrl: string | null; observedAt: string; dataMode: DataMode; datasetVersion: string; }
export interface ComparisonMetric { key: string; value: number | null; unit: string; periodStart: string | null; periodEnd: string | null; methodology: string; unavailableReason: string | null; }
export interface InstrumentSnapshot { id: string; name: string; assetClass: AssetId; currency: "IDR"; observedAt: string; dataMode: DataMode; datasetVersion: string; evidenceIds: string[]; metrics: ComparisonMetric[]; }
export interface ChartSeries { instrumentId: string; currency: "IDR"; unit: "index"; baseValue: 100; dataMode: "synthetic"; datasetVersion: string; evidenceIds: string[]; points: { date: string; value: number }[]; }
export interface MarketResponse { contractVersion: 2; instruments: InstrumentSnapshot[]; chartSeries: ChartSeries[]; evidence: Evidence[]; }
export interface NewsItem { id: string; headline: string; publishedAt: string; sourceName: string | null; sourceUrl: string | null; dataMode: DataMode; evidenceIds: string[]; sentiment: "positive" | "neutral" | "negative" | "mixed" | null; sentimentReason: string | null; sentimentOrigin: Origin | null; }
export interface NewsResponse { contractVersion: 2; datasetVersion: string; items: NewsItem[]; evidence: Evidence[]; }
export interface Shock { id: string; title: string; costRupiah: number; mechanism: string; }
export interface Scenario { id: string; datasetVersion: string; turnIndex: 1 | 2 | 3; durationYears: 1; weeklyAllowanceRupiah: number; allowanceMultiplier: number; returnsByAsset: MoneyByAsset; inflationRate: number; shock: Shock; evidenceIds: string[]; }
export interface SimulationSession { id: string; contractVersion: 2; version: number; phase: SessionPhase; turnIndex: number; age: number; balances: MoneyByAsset; cumulativeInflationIndex: number; pendingShock: Shock | null; scenarioSequenceId: string; datasetVersion: string; calculationVersion: string; }
export interface TurnRecord { turnIndex: number; scenarioId: string; ageBefore: number; ageAfter: number; startingBalances: MoneyByAsset; contributionRupiah: number; allocatedContribution: MoneyByAsset; postReturnBalances: MoneyByAsset; investmentGainRupiah: number; inflationRate: number; cumulativeInflationIndex: number; shock: Shock; paidShockCostRupiah: number; unmetShockCostRupiah: number | null; funding: MoneyByAsset | null; acknowledgeUnmetCost: boolean | null; endingBalances: MoneyByAsset; nominalBalanceRupiah: number; realBalanceRupiah: number; decisionStatus: DecisionStatus; datasetVersion: string; calculationVersion: string; }
export interface SessionBundle { session: SimulationSession; turns: TurnRecord[]; }
export interface PreviewRequest { sessionId: string; expectedVersion: number; savingsRateBps: number; contributionAllocation: MoneyByAsset; }
export interface ContributionPreview { sessionVersion: number; nextTurnIndex: number; scenarioId: string; ageAfter: number; weeklyAllowanceRupiah: number; allowanceMultiplier: number; savingsRateBps: number; contributionAllocation: MoneyByAsset; contributionRupiah: number; allocatedContribution: MoneyByAsset; datasetVersion: string; calculationVersion: string; }
export interface AdvanceRequest extends PreviewRequest { requestId: string; action: "ADVANCE"; }
export interface SettleShockRequest { sessionId: string; expectedVersion: number; requestId: string; action: "SETTLE_SHOCK"; funding: MoneyByAsset; acknowledgeUnmetCost: boolean; }
export type MutationRequest = AdvanceRequest | SettleShockRequest;
export interface MutationResult { session: SimulationSession; turn: TurnRecord; feedbackStatus: "pending" | "available" | "unavailable"; replayed: boolean; }
export interface StoredOutcome { canonicalPayload: string; result: MutationResult; }
export interface FeedbackResponse { billSummary: string; mechanism: string; observations: string[]; reflectionQuestion: string | null; origin: Origin; }
export interface ResearchRequest { instrumentIds: string[]; question: string; }
export interface ResearchResponse { summary: string; facts: { text: string; evidenceIds: string[] }[]; limitations: string[]; evidence: Evidence[]; origin: Origin; }
export interface SimulationGateway { createSession(request: { requestId: string }): Promise<Result<SessionBundle>>; getSession(request: { sessionId: string }): Promise<Result<SessionBundle>>; getActiveSession(): Promise<Result<SessionBundle | null>>; previewContribution(request: PreviewRequest): Promise<Result<ContributionPreview>>; applyAction(request: MutationRequest): Promise<Result<MutationResult>>; getFeedback(request: { sessionId: string; turnIndex: number; decisionStatus: DecisionStatus }): Promise<Result<FeedbackResponse>>; }
export interface LocalRepository { getOrCreateLocalOwner(): Promise<Result<string>>; createSession(owner: string, requestId: string): Promise<Result<SessionBundle>>; getActiveSession(owner: string): Promise<Result<SessionBundle | null>>; getSession(owner: string, sessionId: string): Promise<Result<SessionBundle>>; getTurnHistory(owner: string, sessionId: string): Promise<Result<TurnRecord[]>>; getRequestOutcome(owner: string, sessionId: string, requestId: string): Promise<Result<StoredOutcome | null>>; commitMutation(owner: string, request: MutationRequest, next: SessionBundle): Promise<Result<MutationResult>>; }
