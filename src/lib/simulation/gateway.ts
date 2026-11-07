import type { ContributionPreview, DecisionStatus, FeedbackResponse, MutationRequest, MutationResult, PreviewRequest, Result, SessionBundle } from "@/contracts";
import { z } from "zod";
import { idSchema, mutationRequestSchema, previewRequestSchema } from "@/contracts/validation";
import { getScenario } from "@/lib/data/fixtures";
import { getOrCreateLocalOwner } from "@/lib/db/local-owner";
import * as repository from "@/lib/db/local-repository";
import { feedbackForTurn } from "@/lib/ai/feedback";
import { calculateNextBundle, calculatePreview, SimulationError } from "./engine";

const createSchema = z.object({ requestId: idSchema }).strict();
const sessionSchema = z.object({ sessionId: idSchema }).strict();
const feedbackSchema = z.object({ sessionId: idSchema, turnIndex: z.number().int().min(1).max(3), decisionStatus: z.enum(["pending", "settled"]) }).strict();
function failure<T>(error: unknown, requestId: string | null = null): Result<T> {
  return { ok: false, error: { code: error instanceof SimulationError ? error.code : "INVALID_INPUT",
    message: error instanceof SimulationError ? error.message : "The request or local session could not be validated.",
    retryable: false, requestId } };
}
async function withOwner<T>(operation: (owner: string) => Promise<Result<T>>, requestId: string | null = null): Promise<Result<T>> {
  try {
    const owner = await getOrCreateLocalOwner();
    return owner.ok ? await operation(owner.data) : owner;
  } catch (error) { return failure(error, requestId); }
}
export async function createSession(request: { requestId: string }): Promise<Result<SessionBundle>> {
  const parsed = createSchema.safeParse(request);
  if (!parsed.success) return failure(null);
  return withOwner(owner => repository.createSession(owner, parsed.data.requestId), parsed.data.requestId);
}
export async function getSession(request: { sessionId: string }): Promise<Result<SessionBundle>> {
  const parsed = sessionSchema.safeParse(request);
  if (!parsed.success) return failure(null);
  return withOwner(owner => repository.getSession(owner, parsed.data.sessionId));
}
export async function getActiveSession(): Promise<Result<SessionBundle | null>> {
  return withOwner(owner => repository.getActiveSession(owner));
}
export async function previewContribution(request: PreviewRequest): Promise<Result<ContributionPreview>> {
  const parsed = previewRequestSchema.safeParse(request);
  if (!parsed.success) return failure(null);
  return withOwner(async owner => {
    const bundle = await repository.getSession(owner, parsed.data.sessionId);
    if (!bundle.ok) return bundle;
    const scenario = getScenario(Math.min(3, bundle.data.session.turnIndex + 1));
    return { ok: true, data: calculatePreview(bundle.data, parsed.data, scenario) };
  });
}
export async function applyAction(request: MutationRequest): Promise<Result<MutationResult>> {
  const parsed = mutationRequestSchema.safeParse(request);
  if (!parsed.success) return failure(null);
  const action = parsed.data;
  return withOwner(async owner => {
    // Replay is resolved before checking the current session version.
    const prior = await repository.getRequestOutcome(owner, action.sessionId, action.requestId);
    if (!prior.ok) return prior;
    if (prior.data) {
      if (prior.data.canonicalPayload !== repository.canonicalizeMutation(action)) {
        throw new SimulationError("IDEMPOTENCY_CONFLICT", "This request ID was already used with a different payload.");
      }
      return { ok: true, data: { ...prior.data.result, replayed: true } };
    }
    const bundle = await repository.getSession(owner, action.sessionId);
    if (!bundle.ok) return bundle;
    if (bundle.data.session.version !== action.expectedVersion) {
      // A same-ID request may have committed after the first outcome lookup.
      const raced = await repository.getRequestOutcome(owner, action.sessionId, action.requestId);
      if (!raced.ok) return raced;
      if (raced.data) {
        if (raced.data.canonicalPayload !== repository.canonicalizeMutation(action)) {
          throw new SimulationError("IDEMPOTENCY_CONFLICT", "This request ID was already used with a different payload.");
        }
        return { ok: true, data: { ...raced.data.result, replayed: true } };
      }
    }
    const nextTurn = action.action === "ADVANCE" ? Math.min(3, bundle.data.session.turnIndex + 1) : Math.max(1, bundle.data.session.turnIndex);
    const next = calculateNextBundle(bundle.data, action, getScenario(nextTurn));
    return repository.commitMutation(owner, action, next);
  }, action.requestId);
}
export async function getFeedback(request: { sessionId: string; turnIndex: number; decisionStatus: DecisionStatus }): Promise<Result<FeedbackResponse>> {
  const parsed = feedbackSchema.safeParse(request);
  if (!parsed.success) return failure(null);
  return withOwner(async owner => {
    const bundle = await repository.getSession(owner, parsed.data.sessionId);
    if (!bundle.ok) return bundle;
    const turn = bundle.data.turns.find(candidate => candidate.turnIndex === parsed.data.turnIndex);
    if (!turn) throw new SimulationError("NOT_FOUND", "Committed turn not found.");
    return { ok: true, data: feedbackForTurn(turn, parsed.data.decisionStatus) };
  });
}


