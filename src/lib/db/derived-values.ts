import type { SessionBundle, TurnRecord } from "@/contracts";
import { CALCULATION_VERSION, CONTRACT_VERSION, DATASET_VERSION, DEFAULT_CONTRIBUTION_ALLOCATION, SCENARIO_SEQUENCE_ID } from "@/contracts";
import { getScenario } from "@/lib/data/fixtures";
import { calculateNextBundle, calculateRealBalance } from "@/lib/simulation/engine";

let inflationIndexes: readonly number[] | undefined;

/** Use the frozen engine as the authority, including its exact decimal arithmetic.
 * A zero-contribution reference journey isolates inflation from user decisions.
 * This is pure, bounded to three turns, and never touches stored sessions.
 */
function referenceInflationIndexes(): readonly number[] {
  if (inflationIndexes) return inflationIndexes;
  let reference: SessionBundle = {
    session: {
      id: "restore-inflation-reference", contractVersion: CONTRACT_VERSION, version: 0,
      phase: "ready", turnIndex: 0, age: 15, balances: { cash: 0, bonds: 0, equity: 0 },
      cumulativeInflationIndex: 1, pendingShock: null, scenarioSequenceId: SCENARIO_SEQUENCE_ID,
      datasetVersion: DATASET_VERSION, calculationVersion: CALCULATION_VERSION,
    },
    turns: [],
  };
  const indexes = [reference.session.cumulativeInflationIndex];
  for (let turnIndex = 1; turnIndex <= 3; turnIndex += 1) {
    const scenario = getScenario(turnIndex);
    reference = calculateNextBundle(reference, {
      sessionId: reference.session.id, expectedVersion: reference.session.version,
      requestId: `reference-advance-${turnIndex}`, action: "ADVANCE", savingsRateBps: 0,
      contributionAllocation: { ...DEFAULT_CONTRIBUTION_ALLOCATION },
    }, scenario);
    indexes.push(reference.session.cumulativeInflationIndex);
    reference = calculateNextBundle(reference, {
      sessionId: reference.session.id, expectedVersion: reference.session.version,
      requestId: `reference-settle-${turnIndex}`, action: "SETTLE_SHOCK",
      funding: { cash: 0, bonds: 0, equity: 0 }, acknowledgeUnmetCost: true,
    }, scenario);
  }
  inflationIndexes = Object.freeze(indexes);
  return inflationIndexes;
}

export function hasExpectedInflationIndex(turnIndex: number, cumulativeInflationIndex: number): boolean {
  return referenceInflationIndexes()[turnIndex] === cumulativeInflationIndex;
}

export function hasExpectedDerivedValues(turn: TurnRecord): boolean {
  return hasExpectedInflationIndex(turn.turnIndex, turn.cumulativeInflationIndex) &&
    turn.realBalanceRupiah === calculateRealBalance(turn.nominalBalanceRupiah, turn.cumulativeInflationIndex);
}
