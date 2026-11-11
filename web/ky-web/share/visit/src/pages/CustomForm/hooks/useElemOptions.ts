import { useCallback, useEffect, useState } from "react";
import type { ElemOptionRow } from "@/types/elem";
import { loadElemOptions } from "../repositories/elemOptions";

const EMPTY_OPTIONS: ElemOptionRow[] = [];

interface OptionsState {
  elemId: number;
  rows: ElemOptionRow[];
  loading: boolean;
  error: boolean;
}

export const useElemOptions = (elemId: number, enabled: boolean) => {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<OptionsState>({
    elemId,
    rows: EMPTY_OPTIONS,
    loading: enabled,
    error: false,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ elemId, rows: EMPTY_OPTIONS, loading: enabled, error: false });
    if (!enabled) return;
    void loadElemOptions(elemId)
      .then((rows) => {
        if (!cancelled) setState({ elemId, rows, loading: false, error: false });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ elemId, rows: EMPTY_OPTIONS, loading: false, error: true });
        }
      });
    return () => { cancelled = true; };
  }, [elemId, enabled, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return {
    rows: enabled && state.elemId === elemId ? state.rows : EMPTY_OPTIONS,
    loading: enabled && (state.elemId !== elemId || state.loading),
    error: enabled && state.elemId === elemId && state.error,
    retry,
  };
};
