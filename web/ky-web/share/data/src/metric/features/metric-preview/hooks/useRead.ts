import { useCallback, useEffect, useRef, useState } from "react";

export const errorText = (error: unknown) =>
  error instanceof Error ? error.message : String(error);
export function useRead<T>(
  key: string | null,
  loader: (signal: AbortSignal) => Promise<T>,
) {
  const [state, setState] = useState<{
    key: string | null;
    data?: T;
    error?: string;
    loading: boolean;
  }>({ key: null, loading: false });
  const current = useRef({ key, loader });
  current.current = { key, loader };
  const pending = useRef<AbortController | undefined>(undefined);
  const sequence = useRef(0),
    mounted = useRef(true);
  const reload = useCallback(async (): Promise<T | undefined> => {
    const { key, loader } = current.current;
    pending.current?.abort();
    const controller = new AbortController(),
      ticket = ++sequence.current;
    pending.current = controller;
    if (key === null || !mounted.current) return;
    const accepted = () =>
      mounted.current &&
      !controller.signal.aborted &&
      sequence.current === ticket &&
      current.current.key === key;
    setState((previous) => ({
      key,
      data: previous.key === key ? previous.data : undefined,
      loading: true,
    }));
    try {
      const data = await loader(controller.signal);
      if (accepted()) {
        setState({ key, data, loading: false });
        return data;
      }
    } catch (error) {
      if (accepted()) {
        setState((previous) => ({
          key,
          data: previous.key === key ? previous.data : undefined,
          loading: false,
          error: errorText(error),
        }));
        throw error;
      }
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    void reload().catch(() => {});
    return () => {
      mounted.current = false;
      sequence.current++;
      pending.current?.abort();
    };
  }, [key, reload]);
  const mutate = useCallback((update: (value: T | undefined) => T) => {
    sequence.current++;
    pending.current?.abort();
    if (mounted.current && current.current.key !== null)
      setState((previous) => ({
        key: current.current.key,
        data: update(
          previous.key === current.current.key ? previous.data : undefined,
        ),
        loading: false,
      }));
  }, []);
  const matches = state.key === key && key !== null;
  return {
    data: matches ? state.data : undefined,
    error: matches ? state.error : undefined,
    loading: key !== null && (!matches || state.loading),
    reload,
    mutate,
  };
}
