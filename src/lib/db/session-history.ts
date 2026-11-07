import type { Result, SessionBundle } from "@/contracts";
import { idSchema, simulationSessionSchema, turnRecordSchema } from "@/contracts/validation";
import { z } from "zod";
import { corrupt, ownerRecordSchema, request, runStorageOperation, STORE_NAMES, transaction } from "./database";
import { validateBundle } from "./state-validation";

const sessionRowSchema = z.object({ owner: idSchema, id: idSchema, session: simulationSessionSchema }).strict();
const turnRowSchema = z.object({ owner: idSchema, sessionId: idSchema, turnIndex: z.number().int(), turn: turnRecordSchema }).strict();
const activeRecordSchema = z.object({ key: z.string(), value: idSchema }).strict();

/** Internal discovery, not a v2 repository mutation or a second persistence index.
 * Owner identity, active pointer, session rows and turns share one readonly snapshot.
 * Results retain IndexedDB key order; no creation date or recency is inferred.
 */
export function readPreservedSessionHistory(): Promise<Result<SessionBundle[]>> {
  return runStorageOperation(null, db => transaction(db, [...STORE_NAMES], "readonly", async tx => {
    const metadata = tx.objectStore("metadata");
    const ownerRaw = await request(metadata.get("owner"));
    if (ownerRaw === undefined) {
      // A pristine database has no history. Never bootstrap an identity on this read.
      for (const name of STORE_NAMES) if (await request(tx.objectStore(name).count()) !== 0) corrupt();
      return [];
    }
    const ownerParsed = ownerRecordSchema.safeParse(ownerRaw);
    if (!ownerParsed.success) corrupt();
    const owner = ownerParsed.data.value;
    const activeKey = "active:" + owner;
    const activeRaw = await request(metadata.get(activeKey));
    const rows: unknown[] = await request(tx.objectStore("sessions").index("byOwner").getAll(owner));
    if (activeRaw === undefined) {
      if (rows.length !== 0) corrupt();
      return [];
    }
    const active = activeRecordSchema.safeParse(activeRaw);
    if (!active.success || active.data.key !== activeKey) corrupt();
    const activeId = active.data.value;
    let activeFound = false;
    const preserved: SessionBundle[] = [];
    for (const raw of rows) {
      const row = sessionRowSchema.safeParse(raw);
      if (!row.success || row.data.owner !== owner || row.data.id !== row.data.session.id) corrupt();
      const session = row.data.session;
      const turnRows: unknown[] = await request(tx.objectStore("turns").index("bySession").getAll([owner, session.id]));
      const turns = turnRows.map(rawTurn => {
        const turnRow = turnRowSchema.safeParse(rawTurn);
        if (!turnRow.success || turnRow.data.owner !== owner || turnRow.data.sessionId !== session.id ||
            turnRow.data.turnIndex !== turnRow.data.turn.turnIndex) corrupt();
        return turnRow.data.turn;
      }).sort((a, b) => a.turnIndex - b.turnIndex);
      const bundle = validateBundle({ session, turns });
      // Validate the active record too, rather than silently concealing corruption.
      if (session.id === activeId) activeFound = true;
      else preserved.push(bundle);
    }
    if (!activeFound) corrupt();
    return preserved;
  }));
}
