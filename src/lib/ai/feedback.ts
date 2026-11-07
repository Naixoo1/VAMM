import type { DecisionStatus, FeedbackResponse, TurnRecord } from "@/contracts";
import { FEEDBACK_TEMPLATE_VERSION } from "@/contracts";
import { SimulationError } from "@/lib/simulation/engine";

export const feedbackTemplateVersion = FEEDBACK_TEMPLATE_VERSION;
const rupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
export function feedbackForTurn(turn: TurnRecord, decisionStatus: DecisionStatus): FeedbackResponse {
  if (turn.decisionStatus !== decisionStatus) throw new SimulationError("STATE_CONFLICT", "The bill decision changed. Reload the committed turn.");
  const pending = turn.decisionStatus === "pending";
  return {
    billSummary: pending ? `${turn.shock.title}: ${rupiah(turn.shock.costRupiah)} awaits your funding decision.`
      : `${turn.shock.title}: paid ${rupiah(turn.paidShockCostRupiah)}; unmet expense ${rupiah(turn.unmetShockCostRupiah ?? 0)}.`,
    mechanism: turn.shock.mechanism,
    observations: [
      pending ? "The bill has not been deducted. Choose explicit funding or acknowledge an unmet expense."
        : "Your recorded funding was deducted once. Any unmet expense creates no debt or additional penalty.",
      `Nominal balance is ${rupiah(turn.nominalBalanceRupiah)}; inflation-adjusted purchasing power is ${rupiah(turn.realBalanceRupiah)}.`,
      `New savings contributed ${rupiah(turn.contributionRupiah)}; the modeled investment change was ${rupiah(turn.investmentGainRupiah)}.`,
    ],
    reflectionQuestion: pending ? "Which holdings would you use for this bill, and why?" : "How did this bill and inflation affect your view of emergency savings?",
    origin: "prewritten",
  };
}

