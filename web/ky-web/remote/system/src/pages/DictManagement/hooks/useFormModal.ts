import { useCallback, useState } from "react";

/** 新增 / 编辑弹窗的开关与当前编辑记录 */
export function useFormModal<T>() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);

  const openCreate = useCallback(() => {
    setEditing(null);
    setOpen(true);
  }, []);

  const openEdit = useCallback((record: T) => {
    setEditing(record);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setEditing(null);
  }, []);

  return { open, editing, openCreate, openEdit, close };
}
