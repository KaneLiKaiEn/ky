export interface PersistRowChanges<T extends object> {
    rows: T[];
    deletedIds: readonly number[];
    completed: Set<number>;
    fields: readonly string[];
    assertCurrent: () => void;
    save: (rows: T[], deleted?: number) => Promise<unknown>;
}
/** Resume partial deletions without repeating successful writes or inferring clear-all. */
export declare function persistRowChanges<T extends object>({ rows, deletedIds, completed, fields, assertCurrent, save, }: PersistRowChanges<T>): Promise<void>;
