import { useCallback, useEffect, useRef, useState } from "react";
import { errorText } from "../utils/result";

export interface EditorLifecycle {
  onDirtyChange: (dirty: boolean) => void;
  onBusyChange: (busy: boolean) => void;
  disabled?: boolean;
}

export function useEditor(callbacks: EditorLifecycle) {
  const latest = useRef(callbacks);
  latest.current = callbacks;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const busy = useRef(false);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      latest.current.onDirtyChange(false);
      latest.current.onBusyChange(false);
    };
  }, []);
  const run = useCallback(
    async (action: () => Promise<void>) => {
      if (busy.current || !mounted.current || latest.current.disabled) return;
      busy.current = true;
      setSaving(true);
      setError(undefined);
      latest.current.onBusyChange(true);
      try {
        await action();
      } catch (error) {
        if (mounted.current) setError(errorText(error));
      } finally {
        busy.current = false;
        if (mounted.current) {
          setSaving(false);
          latest.current.onBusyChange(false);
        }
      }
    },
    [],
  );
  const dirty = useCallback((value: boolean) => {
    if (mounted.current) latest.current.onDirtyChange(value);
  }, []);
  return { saving, error, run, setError, dirty, mounted };
}
