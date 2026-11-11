import { pickRow } from "./dto";

export interface PersistRowChanges<T extends object> {
  rows: T[];
  deletedIds: readonly number[];
  completed: Set<number>;
  fields: readonly string[];
  assertCurrent: () => void;
  save: (rows: T[], deleted?: number) => Promise<unknown>;
}

/** Resume partial deletions without repeating successful writes or inferring clear-all. */
export async function persistRowChanges<T extends object>({
  rows,
  deletedIds,
  completed,
  fields,
  assertCurrent,
  save,
}: PersistRowChanges<T>): Promise<void> {
  for (const recordId of deletedIds) {
    if (completed.has(recordId)) continue;
    assertCurrent();
    await save([], recordId);
    completed.add(recordId);
  }
  assertCurrent();
  if (rows.length) await save(rows.map((row) => pickRow(row, fields)));
}
