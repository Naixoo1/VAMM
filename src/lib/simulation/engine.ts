import type { ContributionPreview, ErrorCode, MoneyByAsset, MutationRequest, PreviewRequest, Scenario, SessionBundle, TurnRecord } from "@/contracts";
import { ASSET_IDS } from "@/contracts";
import { mutationRequestSchema, previewRequestSchema, scenarioSchema, sessionBundleSchema } from "@/contracts/validation";

export class SimulationError extends Error {
  constructor(public readonly code: ErrorCode, message: string) { super(message); this.name = "SimulationError"; }
}
function invalid(message: string): never { throw new SimulationError("INVALID_INPUT", message); }
const MAX = BigInt(Number.MAX_SAFE_INTEGER);

/** Decimal inputs become exact integer ratios before money is rounded. */
function ratio(value: number): [bigint, bigint] {
  if (!Number.isFinite(value)) invalid("A finite number is required.");
  const [coefficient, exponent = "0"] = Math.abs(value).toString().toLowerCase().split("e");
  const [whole, decimals = ""] = coefficient.split(".");
  const scale = decimals.length - Number(exponent);
  let numerator = BigInt(whole + decimals);
  let denominator = 1n;
  if (scale >= 0) denominator = 10n ** BigInt(scale);
  else numerator *= 10n ** BigInt(-scale);
  return [value < 0 ? -numerator : numerator, denominator];
}
export function roundHalfUpRatio(numerator: bigint, denominator = 1n): number {
  if (numerator < 0n || denominator <= 0n) invalid("Invalid nonnegative money ratio.");
  const rounded = (2n * numerator + denominator) / (2n * denominator);
  if (rounded > MAX) invalid("Calculation exceeds safe rupiah limits.");
  return Number(rounded);
}
function safeMoney(value: number): bigint {
  if (!Number.isSafeInteger(value) || value < 0) invalid("Money must be a nonnegative safe integer.");
  return BigInt(value);
}
function total(values: MoneyByAsset): number {
  return roundHalfUpRatio(ASSET_IDS.reduce((sum, asset) => sum + safeMoney(values[asset]), 0n));
}
export function applyAnnualReturn(amount: number, rate: number): number {
  const [numerator, denominator] = ratio(rate);
  if (rate < -1 || denominator > 10000n) invalid("Return must be at least -1 with at most four decimal places.");
  return roundHalfUpRatio(safeMoney(amount) * (denominator + numerator), denominator);
}
export function calculateRealBalance(nominal: number, inflationIndex: number): number {
  if (inflationIndex <= 0) invalid("Inflation index must be positive.");
  const [numerator, denominator] = ratio(inflationIndex);
  return roundHalfUpRatio(safeMoney(nominal) * denominator, numerator);
}
export function calculateContribution(scenario: Scenario, savingsRateBps: number, contributionAllocation: MoneyByAsset) {
  if (!scenarioSchema.safeParse(scenario).success) invalid("Invalid scenario.");
  const parsed = previewRequestSchema.safeParse({ sessionId: "calculation", expectedVersion: 0, savingsRateBps, contributionAllocation });
  if (!parsed.success) invalid("Savings or contribution allocation is invalid.");
  const [multiplier, denominator] = ratio(scenario.allowanceMultiplier);
  const contributionRupiah = roundHalfUpRatio(safeMoney(scenario.weeklyAllowanceRupiah) * 52n * multiplier * BigInt(savingsRateBps), denominator * 10000n);
  const allocatedContribution: MoneyByAsset = { cash: 0, bonds: 0, equity: 0 };
  let allocated = 0;
  for (const asset of ASSET_IDS) {
    allocatedContribution[asset] = Number(BigInt(contributionRupiah) * BigInt(contributionAllocation[asset]) / 10000n);
    allocated += allocatedContribution[asset];
  }
  let remainder = contributionRupiah - allocated;
  for (const asset of ASSET_IDS) if (remainder > 0 && contributionAllocation[asset] > 0) {
    allocatedContribution[asset] += 1; remainder -= 1;
  }
  if (remainder !== 0) invalid("Allocation remainder could not be distributed.");
  return { contributionRupiah, allocatedContribution };
}
function validateBundle(bundle: SessionBundle): void {
  if (!sessionBundleSchema.safeParse(bundle).success) invalid("Invalid session or turn history.");
}
function ensureReady(bundle: SessionBundle, expectedVersion: number, scenario: Scenario): void {
  const session = bundle.session;
  if (session.version !== expectedVersion) throw new SimulationError("STATE_CONFLICT", "Session changed. Reload before continuing.");
  if (session.phase !== "ready" || session.turnIndex >= 3) throw new SimulationError("INVALID_PHASE", "Settle the pending bill before advancing; completed sessions cannot advance.");
  if (scenario.turnIndex !== session.turnIndex + 1 || scenario.datasetVersion !== session.datasetVersion) invalid("Scenario does not match the next turn.");
}
export function calculatePreview(bundle: SessionBundle, request: PreviewRequest, scenario: Scenario): ContributionPreview {
  validateBundle(bundle);
  if (!previewRequestSchema.safeParse(request).success) invalid("Invalid preview request.");
  if (request.sessionId !== bundle.session.id) throw new SimulationError("NOT_FOUND", "Session not found.");
  ensureReady(bundle, request.expectedVersion, scenario);
  return { sessionVersion: bundle.session.version, nextTurnIndex: scenario.turnIndex, scenarioId: scenario.id,
    ageAfter: bundle.session.age + 1, weeklyAllowanceRupiah: scenario.weeklyAllowanceRupiah,
    allowanceMultiplier: scenario.allowanceMultiplier, savingsRateBps: request.savingsRateBps,
    contributionAllocation: { ...request.contributionAllocation },
    ...calculateContribution(scenario, request.savingsRateBps, request.contributionAllocation),
    datasetVersion: bundle.session.datasetVersion, calculationVersion: bundle.session.calculationVersion };
}
export function calculateNextBundle(bundle: SessionBundle, request: MutationRequest, scenario: Scenario): SessionBundle {
  validateBundle(bundle);
  if (!mutationRequestSchema.safeParse(request).success || !scenarioSchema.safeParse(scenario).success) invalid("Invalid action or scenario.");
  const session = bundle.session;
  if (request.sessionId !== session.id) throw new SimulationError("NOT_FOUND", "Session not found.");
  if (request.expectedVersion !== session.version) throw new SimulationError("STATE_CONFLICT", "Session changed. Reload before continuing.");
  if (request.action === "ADVANCE") {
    ensureReady(bundle, request.expectedVersion, scenario);
    const { contributionRupiah, allocatedContribution } = calculateContribution(scenario, request.savingsRateBps, request.contributionAllocation);
    const postReturnBalances: MoneyByAsset = { cash: 0, bonds: 0, equity: 0 };
    for (const asset of ASSET_IDS) {
      const amount = roundHalfUpRatio(safeMoney(session.balances[asset]) + safeMoney(allocatedContribution[asset]));
      postReturnBalances[asset] = applyAnnualReturn(amount, scenario.returnsByAsset[asset]);
    }
    const nominalBalanceRupiah = total(postReturnBalances);
    const investmentGainRupiah = Number(BigInt(nominalBalanceRupiah) - BigInt(total(session.balances)) - BigInt(contributionRupiah));
    if (!Number.isSafeInteger(investmentGainRupiah)) invalid("Investment gain exceeds safe rupiah limits.");
    const [previous, previousDenominator] = ratio(session.cumulativeInflationIndex);
    const [inflation, inflationDenominator] = ratio(scenario.inflationRate);
    const cumulativeInflationIndex = Number(previous * (inflationDenominator + inflation)) / Number(previousDenominator * inflationDenominator);
    if (!Number.isFinite(cumulativeInflationIndex) || cumulativeInflationIndex <= 0) invalid("Invalid cumulative inflation index.");
    const turn: TurnRecord = { turnIndex: scenario.turnIndex, scenarioId: scenario.id, ageBefore: session.age,
      ageAfter: session.age + 1, startingBalances: { ...session.balances }, contributionRupiah, allocatedContribution,
      postReturnBalances, investmentGainRupiah, inflationRate: scenario.inflationRate, cumulativeInflationIndex,
      shock: { ...scenario.shock }, paidShockCostRupiah: 0, unmetShockCostRupiah: null, funding: null,
      acknowledgeUnmetCost: null, endingBalances: { ...postReturnBalances }, nominalBalanceRupiah,
      realBalanceRupiah: calculateRealBalance(nominalBalanceRupiah, cumulativeInflationIndex),
      decisionStatus: "pending", datasetVersion: session.datasetVersion, calculationVersion: session.calculationVersion };
    return { session: { ...session, version: session.version + 1, phase: "awaiting_shock_decision",
      turnIndex: scenario.turnIndex, age: session.age + 1, balances: { ...postReturnBalances },
      cumulativeInflationIndex, pendingShock: { ...scenario.shock } }, turns: [...bundle.turns, turn] };
  }
  if (session.phase !== "awaiting_shock_decision" || !session.pendingShock) throw new SimulationError("INVALID_PHASE", "There is no pending bill to settle.");
  const pending = bundle.turns.at(-1);
  if (!pending || pending.decisionStatus !== "pending" || scenario.turnIndex !== session.turnIndex ||
      scenario.id !== pending.scenarioId || scenario.datasetVersion !== session.datasetVersion) invalid("Pending turn does not match the scenario.");
  const paidShockCostRupiah = total(request.funding);
  if (paidShockCostRupiah > session.pendingShock.costRupiah || ASSET_IDS.some(asset => request.funding[asset] > session.balances[asset])) {
    throw new SimulationError("INSUFFICIENT_BALANCE", "Funding cannot exceed holdings or the bill.");
  }
  const unmetShockCostRupiah = session.pendingShock.costRupiah - paidShockCostRupiah;
  if (unmetShockCostRupiah > 0 && !request.acknowledgeUnmetCost) invalid("Acknowledge the unmet expense before settling with partial funding.");
  const endingBalances = { cash: session.balances.cash - request.funding.cash, bonds: session.balances.bonds - request.funding.bonds, equity: session.balances.equity - request.funding.equity };
  const nominalBalanceRupiah = total(endingBalances);
  const settled: TurnRecord = { ...pending, paidShockCostRupiah, unmetShockCostRupiah,
    funding: { ...request.funding }, acknowledgeUnmetCost: request.acknowledgeUnmetCost, endingBalances,
    nominalBalanceRupiah, realBalanceRupiah: calculateRealBalance(nominalBalanceRupiah, session.cumulativeInflationIndex), decisionStatus: "settled" };
  return { session: { ...session, version: session.version + 1, phase: session.turnIndex === 3 ? "complete" : "ready", balances: { ...endingBalances }, pendingShock: null },
    turns: [...bundle.turns.slice(0, -1), settled] };
}


