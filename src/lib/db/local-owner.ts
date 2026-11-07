import type { Result } from "@/contracts";
import { corrupt, newId, ownerRecordSchema, request, runStorageOperation, STORE_NAMES, transaction } from "./database";

export function getOrCreateLocalOwner(): Promise<Result<string>> {
  return runStorageOperation(null, db => transaction(db, [...STORE_NAMES], "readwrite", async tx => {
    const metadata = tx.objectStore("metadata");
    const raw = await request(metadata.get("owner"));
    if (raw !== undefined) {
      const owner = ownerRecordSchema.safeParse(raw);
      if (!owner.success) corrupt();
      return owner.data.value;
    }
    // Missing identity in a nonempty database is corruption, never a new namespace.
    for (const name of STORE_NAMES) {
      if (await request(tx.objectStore(name).count()) !== 0) corrupt();
    }
    const owner = newId();
    await request(metadata.add({ key: "owner", value: owner }));
    return owner;
  }));
}

