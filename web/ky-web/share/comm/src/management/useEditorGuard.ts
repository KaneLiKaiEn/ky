import { useEffect, useRef } from "react";
export interface EditorGuard {
  registerDiscard?: (discard: (() => void) | null) => void;
  onDirtyChange: (dirty: boolean) => void;
  onBusyChange: (busy: boolean) => void;
  registerSave: (save: (() => Promise<boolean>) | null) => void;
}

export function useEditorGuard(
  props: EditorGuard,
  dirty: boolean,
  busy: boolean,
  save: () => Promise<boolean>,
): void {
  const { onDirtyChange, onBusyChange, registerSave } = props;
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    onBusyChange(busy);
  }, [busy, onBusyChange]);
  useEffect(() => {
    registerSave(() => saveRef.current());
    return () => {
      registerSave(null);
      onDirtyChange(false);
      onBusyChange(false);
    };
  }, [registerSave, onDirtyChange, onBusyChange]);
}
