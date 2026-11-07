import type { MoneyByAsset, MutationRequest, SessionBundle, TurnRecord } from "@/contracts";
import { ASSET_IDS } from "@/contracts";
import { sessionBundleSchema, turnRecordSchema } from "@/contracts/validation";
import { getScenario } from "@/lib/data/fixtures";
import { RepositoryFault } from "./database";

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  if (value !== null && typeof value === "object") {
    return "{" + Object.keys(value).sort().map(key => JSON.stringify(key) + ":" + canonicalJson((value as Record<string, unknown>)[key])).join(",") + "}";
  }
  return JSON.stringify(value);
}
export function same(a: unknown, b: unknown): boolean { return canonicalJson(a) === canonicalJson(b); }
const total = (balances: MoneyByAsset) => balances.cash + balances.bonds + balances.equity;

function invalid(candidate: boolean): never {
  throw new RepositoryFault(candidate ? "INVALID_INPUT" : "STORAGE_UNAVAILABLE", candidate ? "The proposed simulation state is inconsistent." : "Stored simulation data is invalid. Your history has not been reset.");
}

/** Structural linkage and accounting checks only; annual-return/preview math stays in the engine. */
export function validateTurn(raw: unknown, candidate = false): TurnRecord {
  const parsed = turnRecordSchema.safeParse(raw);
  if (!parsed.success) invalid(candidate);
  const turn = parsed.data;
  const scenario = getScenario(turn.turnIndex);
  if (turn.scenarioId !== scenario.id || !same(turn.shock, scenario.shock) || turn.inflationRate !== scenario.inflationRate ||
      turn.ageBefore !== 14 + turn.turnIndex || turn.ageAfter !== 15 + turn.turnIndex ||
      total(turn.allocatedContribution) !== turn.contributionRupiah || total(turn.endingBalances) !== turn.nominalBalanceRupiah ||
      !Number.isSafeInteger(total(turn.startingBalances) + turn.contributionRupiah + turn.investmentGainRupiah) ||
      total(turn.postReturnBalances) !== total(turn.startingBalances) + turn.contributionRupiah + turn.investmentGainRupiah) invalid(candidate);
  if (turn.decisionStatus === "pending") {
    if (turn.paidShockCostRupiah !== 0 || turn.unmetShockCostRupiah !== null || turn.funding !== null ||
        turn.acknowledgeUnmetCost !== null || !same(turn.endingBalances, turn.postReturnBalances)) invalid(candidate);
  } else {
    if (turn.funding === null || turn.unmetShockCostRupiah === null || turn.acknowledgeUnmetCost === null) invalid(candidate);
    const funding = turn.funding;
    if (total(funding) > turn.shock.costRupiah || turn.paidShockCostRupiah !== total(funding) ||
        turn.unmetShockCostRupiah !== turn.shock.costRupiah - total(funding) ||
        (turn.unmetShockCostRupiah > 0 && !turn.acknowledgeUnmetCost) ||
        ASSET_IDS.some(asset => funding[asset] > turn.postReturnBalances[asset] ||
          turn.endingBalances[asset] !== turn.postReturnBalances[asset] - funding[asset])) invalid(candidate);
  }
  return turn;
}

export function validateBundle(raw: unknown, candidate = false): SessionBundle {
  const parsed = sessionBundleSchema.safeParse(raw);
  if (!parsed.success) invalid(candidate);
  const bundle = parsed.data;
  let previousBalances: MoneyByAsset = { cash: 0, bonds: 0, equity: 0 };
  for (const [index, item] of bundle.turns.entries()) {
    const turn = validateTurn(item, candidate);
    if (!same(turn.startingBalances, previousBalances) ||
        (index < bundle.turns.length - 1 && turn.decisionStatus !== "settled")) invalid(candidate);
    previousBalances = turn.endingBalances;
  }
  const last = bundle.turns.at(-1);
  if (last) {
    const pending = bundle.session.phase === "awaiting_shock_decision";
    if ((last.decisionStatus === "pending") !== pending ||
        !same(bundle.session.balances, last.endingBalances) ||
        bundle.session.cumulativeInflationIndex !== last.cumulativeInflationIndex ||
        (pending && !same(bundle.session.pendingShock, last.shock))) invalid(candidate);
  }
  return bundle;
}

export function validateTransition(current: SessionBundle, next: SessionBundle, action: MutationRequest): void {
  const before = current.session;
  const after = next.session;
  if (after.id !== before.id || after.version !== before.version + 1) invalid(true);
  if (action.action === "ADVANCE") {
    if (before.phase !== "ready" || before.turnIndex === 3) throw new RepositoryFault("INVALID_PHASE", "Settle the current bill before advancing.");
    if (after.turnIndex !== before.turnIndex + 1 || after.phase !== "awaiting_shock_decision" ||
        !same(next.turns.slice(0, -1), current.turns)) invalid(true);
  } else {
    if (before.phase !== "awaiting_shock_decision") throw new RepositoryFault("INVALID_PHASE", "There is no pending bill to settle.");
    const previousTurn = current.turns.at(-1)!;
    const nextTurn = next.turns.at(-1)!;
    if (after.turnIndex !== before.turnIndex || after.cumulativeInflationIndex !== before.cumulativeInflationIndex ||
        !same(next.turns.slice(0, -1), current.turns.slice(0, -1)) ||
        !same(nextTurn.funding, action.funding) || nextTurn.acknowledgeUnmetCost !== action.acknowledgeUnmetCost ||
        nextTurn.decisionStatus !== "settled") invalid(true);
    const mutable = new Set(["paidShockCostRupiah", "unmetShockCostRupiah", "funding", "acknowledgeUnmetCost", "endingBalances", "nominalBalanceRupiah", "realBalanceRupiah", "decisionStatus"]);
    for (const key of Object.keys(previousTurn) as (keyof TurnRecord)[]) {
      if (!mutable.has(key) && !same(previousTurn[key], nextTurn[key])) invalid(true);
    }
  }
}

