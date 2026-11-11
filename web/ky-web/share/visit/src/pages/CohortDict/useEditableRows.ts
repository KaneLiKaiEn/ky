import { useCallback, useEffect, useRef, useState } from "react";
import { createRowKey } from "./utils";

export type EditableRow = { rowKey: string };

interface UseEditableRowsOptions<T extends EditableRow> {
  open: boolean;
  load: () => Promise<T[]>;
  save: (rows: T[]) => Promise<void>;
  createEmpty: () => Omit<T, "rowKey">;
}

export function useEditableRows<T extends EditableRow>({
  open,
  load,
  save,
  createEmpty,
}: UseEditableRowsOptions<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadRef = useRef(load);
  const saveRef = useRef(save);
  const createEmptyRef = useRef(createEmpty);
  loadRef.current = load;
  saveRef.current = save;
  createEmptyRef.current = createEmpty;

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const next = await loadRef.current();
      setRows(next);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setRows([]);
      return;
    }
    void reload();
  }, [open, reload]);

  const add = useCallback(() => {
    const empty = createEmptyRef.current();
    setRows((prev) => [...prev, { ...empty, rowKey: createRowKey() } as T]);
  }, []);

  const remove = useCallback((rowKey: string) => {
    setRows((prev) => prev.filter((row) => row.rowKey !== rowKey));
  }, []);

  const patch = useCallback((rowKey: string, updates: Partial<T>) => {
    setRows((prev) =>
      prev.map((row) => (row.rowKey === rowKey ? { ...row, ...updates } : row)),
    );
  }, []);

  const submit = useCallback(async () => {
    setSaving(true);
    try {
      await saveRef.current(rows);
      await reload();
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, [reload, rows]);

  return { rows, loading, saving, add, remove, patch, submit, reload };
}
