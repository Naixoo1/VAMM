import type { Result, SessionBundle } from "@/contracts";
import { readPreservedSessionHistory } from "@/lib/db/session-history";

/** Read-only, owner-scoped discovery for the separate preserved-history UI. */
export function listPreservedSessions(): Promise<Result<SessionBundle[]>> {
  return readPreservedSessionHistory();
}
