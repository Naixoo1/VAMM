import { z } from "zod";
import { CALCULATION_VERSION, CONTRACT_VERSION, DATASET_VERSION, SCENARIO_SEQUENCE_ID } from "@/contracts";
import type { LocalRepository, MutationRequest, MutationResult, Result, SessionBundle, StoredOutcome, TurnRecord } from "@/contracts";
import { idSchema, mutationRequestSchema, sessionBundleSchema, simulationSessionSchema, turnRecordSchema } from "@/contracts/validation";
import { corrupt, newId, RepositoryFault, request, requireOwner, runStorageOperation, STORE_NAMES, transaction, validId } from "./database";
import { getOrCreateLocalOwner } from "./local-owner";
import { canonicalJson, same, validateBundle, validateTransition, validateTurn } from "./state-validation";

const sessionRecordSchema = z.object({ owner: idSchema, id: idSchema, session: simulationSessionSchema }).strict();
const turnStoredSchema = z.object({ owner: idSchema, sessionId: idSchema, turnIndex: z.number().int(), turn: turnRecordSchema }).strict();
const activeSchema = z.object({ key: z.string(), value: idSchema }).strict();
const resultSchema = z.object({ session: simulationSessionSchema, turn: turnRecordSchema, feedbackStatus: z.literal("pending"), replayed: z.literal(false) }).strict();
const outcomeSchema = z.object({ owner: idSchema, scope: z.literal("mutation"), sessionId: idSchema, requestId: idSchema, canonicalPayload: z.string(), result: resultSchema }).strict();
const createSchema = z.object({ owner: idSchema, scope: z.literal("create"), sessionId: z.literal(""), requestId: idSchema, bundle: sessionBundleSchema }).strict();

function parseMutation(raw: unknown): MutationRequest {
  const parsed = mutationRequestSchema.safeParse(raw);
  if (!parsed.success) throw new RepositoryFault("INVALID_INPUT", "The simulation request is invalid.");
  return parsed.data;
}

export function canonicalizeMutation(raw: MutationRequest): string {
  const parsed = parseMutation(raw);
  const payload: Record<string, unknown> = { ...parsed };
  delete payload.requestId;
  return canonicalJson(payload);
}

function errorRequestId(raw: unknown): string | null {
  const parsed = idSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

async function loadBundle(tx: IDBTransaction, owner: string, sessionId: string): Promise<SessionBundle> {
  validId(sessionId);
  const raw = await request(tx.objectStore("sessions").get([owner, sessionId]));
  if (raw === undefined) throw new RepositoryFault("NOT_FOUND", "That session was not found in this local namespace.");
  const record = sessionRecordSchema.safeParse(raw);
  if (!record.success || record.data.owner !== owner || record.data.id !== sessionId || record.data.session.id !== sessionId) corrupt();
  const rows: unknown[] = await request(tx.objectStore("turns").index("bySession").getAll([owner, sessionId]));
  const turns = rows.map(row => {
    const parsed = turnStoredSchema.safeParse(row);
    if (!parsed.success || parsed.data.owner !== owner || parsed.data.sessionId !== sessionId || parsed.data.turnIndex !== parsed.data.turn.turnIndex) corrupt();
    return parsed.data.turn;
  }).sort((a, b) => a.turnIndex - b.turnIndex);
  return validateBundle({ session: record.data.session, turns });
}

async function activeBundle(tx: IDBTransaction, owner: string): Promise<SessionBundle | null> {
  const key = "active:" + owner;
  const raw = await request(tx.objectStore("metadata").get(key));
  if (raw === undefined) {
    if (await request(tx.objectStore("sessions").index("byOwner").count(owner)) !== 0) corrupt();
    return null;
  }
  const active = activeSchema.safeParse(raw);
  if (!active.success || active.data.key !== key) corrupt();
  try { return await loadBundle(tx, owner, active.data.value); }
  catch (error) {
    if (error instanceof RepositoryFault && error.code === "NOT_FOUND") corrupt();
    throw error;
  }
}

async function readOutcome(tx: IDBTransaction, owner: string, sessionId: string, requestId: string): Promise<StoredOutcome | null> {
  const raw = await request(tx.objectStore("requestOutcomes").get([owner, "mutation", sessionId, requestId]));
  if (raw === undefined) return null;
  const stored = outcomeSchema.safeParse(raw);
  if (!stored.success || stored.data.owner !== owner || stored.data.sessionId !== sessionId || stored.data.requestId !== requestId) corrupt();
  const value = stored.data;
  let original: MutationRequest;
  try {
    original = parseMutation({ ...JSON.parse(value.canonicalPayload), requestId });
    if (canonicalizeMutation(original) !== value.canonicalPayload) corrupt();
  } catch { corrupt(); }
  const turn = validateTurn(value.result.turn);
  if (original.sessionId !== sessionId || value.result.session.id !== sessionId ||
      value.result.session.version !== original.expectedVersion + 1 ||
      value.result.session.turnIndex !== turn.turnIndex ||
      value.result.session.cumulativeInflationIndex !== turn.cumulativeInflationIndex ||
      !same(value.result.session.balances, turn.endingBalances) ||
      ((value.result.session.phase === "awaiting_shock_decision") !== (turn.decisionStatus === "pending")) ||
      (turn.decisionStatus === "pending" && !same(value.result.session.pendingShock, turn.shock))) corrupt();
  if ((original.action === "ADVANCE") !== (turn.decisionStatus === "pending") ||
      (original.action === "SETTLE_SHOCK" && (!same(original.funding, turn.funding) || original.acknowledgeUnmetCost !== turn.acknowledgeUnmetCost))) corrupt();
  return { canonicalPayload: value.canonicalPayload, result: value.result };
}

export function createSession(owner: string, requestId: string): Promise<Result<SessionBundle>> {
  return runStorageOperation(errorRequestId(requestId), db => transaction(db, [...STORE_NAMES], "readwrite", async tx => {
    validId(requestId);
    await requireOwner(tx, owner);
    await activeBundle(tx, owner);
    const outcomes = tx.objectStore("requestOutcomes");
    const prior = await request(outcomes.get([owner, "create", "", requestId]));
    if (prior !== undefined) {
      const parsed = createSchema.safeParse(prior);
      if (!parsed.success || parsed.data.owner !== owner || parsed.data.requestId !== requestId) corrupt();
      const bundle = validateBundle(parsed.data.bundle);
      if (bundle.session.version !== 0 || bundle.turns.length !== 0) corrupt();
      await loadBundle(tx, owner, bundle.session.id);
      return bundle;
    }
    const bundle: SessionBundle = {
      session: { id: newId(), contractVersion: CONTRACT_VERSION, version: 0, phase: "ready", turnIndex: 0, age: 15, balances: { cash: 0, bonds: 0, equity: 0 }, cumulativeInflationIndex: 1, pendingShock: null, scenarioSequenceId: SCENARIO_SEQUENCE_ID, datasetVersion: DATASET_VERSION, calculationVersion: CALCULATION_VERSION },
      turns: [],
    };
    await request(tx.objectStore("sessions").add({ owner, id: bundle.session.id, session: bundle.session }));
    await request(tx.objectStore("metadata").put({ key: "active:" + owner, value: bundle.session.id }));
    await request(outcomes.add({ owner, scope: "create", sessionId: "", requestId, bundle }));
    return bundle;
  }));
}

export function getActiveSession(owner: string): Promise<Result<SessionBundle | null>> {
  return runStorageOperation(null, db => transaction(db, ["metadata", "sessions", "turns"], "readonly", async tx => {
    await requireOwner(tx, owner);
    return activeBundle(tx, owner);
  }));
}

export function getSession(owner: string, sessionId: string): Promise<Result<SessionBundle>> {
  return runStorageOperation(null, db => transaction(db, ["metadata", "sessions", "turns"], "readonly", async tx => {
    await requireOwner(tx, owner);
    return loadBundle(tx, owner, sessionId);
  }));
}

export async function getTurnHistory(owner: string, sessionId: string): Promise<Result<TurnRecord[]>> {
  const result = await getSession(owner, sessionId);
  return result.ok ? { ok: true, data: result.data.turns } : result;
}

export function getRequestOutcome(owner: string, sessionId: string, requestId: string): Promise<Result<StoredOutcome | null>> {
  return runStorageOperation(errorRequestId(requestId), db => transaction(db, [...STORE_NAMES], "readonly", async tx => {
    validId(sessionId); validId(requestId);
    await requireOwner(tx, owner);
    await loadBundle(tx, owner, sessionId);
    return readOutcome(tx, owner, sessionId, requestId);
  }));
}

export function commitMutation(owner: string, raw: MutationRequest, candidate: SessionBundle): Promise<Result<MutationResult>> {
  return runStorageOperation(errorRequestId(raw?.requestId), db => transaction(db, [...STORE_NAMES], "readwrite", async tx => {
    const action = parseMutation(raw);
    await requireOwner(tx, owner);
    const canonicalPayload = canonicalizeMutation(action);
    const previousOutcome = await readOutcome(tx, owner, action.sessionId, action.requestId);
    if (previousOutcome) {
      if (previousOutcome.canonicalPayload !== canonicalPayload) throw new RepositoryFault("IDEMPOTENCY_CONFLICT", "This request identifier was already used for a different action.");
      // A replay cannot conceal a missing/corrupt current session; it still precedes version checks.
      try { await loadBundle(tx, owner, action.sessionId); }
      catch (error) {
        if (error instanceof RepositoryFault && error.code === "NOT_FOUND") corrupt();
        throw error;
      }
      return { ...previousOutcome.result, replayed: true };
    }
    const current = await loadBundle(tx, owner, action.sessionId);
    if (current.session.version !== action.expectedVersion) throw new RepositoryFault("STATE_CONFLICT", "The session changed. Reload before making a new decision.");
    if ((action.action === "ADVANCE" && (current.session.phase !== "ready" || current.session.turnIndex === 3)) ||
        (action.action === "SETTLE_SHOCK" && current.session.phase !== "awaiting_shock_decision")) {
      throw new RepositoryFault("INVALID_PHASE", "This action is unavailable in the current simulation phase.");
    }
    const next = validateBundle(candidate, true);
    validateTransition(current, next, action);
    const turn = next.turns.at(-1)!;
    const result: MutationResult = { session: next.session, turn, feedbackStatus: "pending", replayed: false };
    await request(tx.objectStore("sessions").put({ owner, id: next.session.id, session: next.session }));
    const turnStore = tx.objectStore("turns");
    const turnRow = { owner, sessionId: next.session.id, turnIndex: turn.turnIndex, turn };
    if (action.action === "ADVANCE") await request(turnStore.add(turnRow));
    else await request(turnStore.put(turnRow));
    await request(tx.objectStore("requestOutcomes").add({ owner, scope: "mutation", sessionId: action.sessionId, requestId: action.requestId, canonicalPayload, result }));
    return result;
  }));
}

export const localRepository: LocalRepository = {
  getOrCreateLocalOwner, createSession, getActiveSession, getSession, getTurnHistory, getRequestOutcome, commitMutation,
};

