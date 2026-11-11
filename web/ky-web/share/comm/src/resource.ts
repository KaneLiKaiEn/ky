import { useCallback, useEffect, useRef, useState } from "react";
import { errorText } from "./utils/result";

export interface ResourceState<T> {
  key: string | null;
  data?: T;
  loading: boolean;
  error?: string;
}

export interface ResourceOptions {
  formatError?: (error: unknown) => string;
}

export interface Resource<T> {
  data?: T;
  loading: boolean;
  error?: string;
  ready: boolean;
  reloadData: () => Promise<T | undefined>;
  reload: () => Promise<void>;
  /** Schedule a background read; failures are exposed through error. */
  refresh: () => void;
  mutate: (update: (data: T | undefined) => T) => void;
}

/** Each hook owns its snapshot; only the latest request for its current key may settle. */
export function useResource<T>(
  key: string | null,
  loader: () => Promise<T>,
  options: ResourceOptions = {},
): Resource<T> {
  const [state, setState] = useState<ResourceState<T>>({
    key: null,
    loading: false,
  });
  const [revision, setRevision] = useState(0);
  const loaderRef = useRef(loader);
  const keyRef = useRef(key);
  const formatErrorRef = useRef(options.formatError ?? errorText);
  const sequence = useRef(0);
  const mounted = useRef(true);
  loaderRef.current = loader;
  keyRef.current = key;
  formatErrorRef.current = options.formatError ?? errorText;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      sequence.current++;
    };
  }, []);

  const run = useCallback(
    async (resourceKey: string | null): Promise<T | undefined> => {
      if (!mounted.current) return;
      const requestId = ++sequence.current;
      if (resourceKey === null) {
        setState({ key: null, loading: false });
        return;
      }
      // Capture the loader before awaiting so it stays attached to this key.
      const load = loaderRef.current;
      const accepted = () =>
        mounted.current &&
        requestId === sequence.current &&
        keyRef.current === resourceKey;
      setState((previous) => ({
        key: resourceKey,
        data: previous.key === resourceKey ? previous.data : undefined,
        loading: true,
      }));
      try {
        const data = await load();
        if (accepted()) {
          setState({ key: resourceKey, data, loading: false });
          return data;
        }
      } catch (error) {
        if (accepted()) {
          setState((previous) => ({
            key: resourceKey,
            data: previous.key === resourceKey ? previous.data : undefined,
            loading: false,
            error: formatErrorRef.current(error),
          }));
          throw error;
        }
      }
    },
    [],
  );

  useEffect(() => {
    void run(key).catch(() => {
      /* Background failures are rendered through the returned state. */
    });
    return () => {
      sequence.current++;
    };
  }, [key, revision, run]);

  const reloadData = useCallback(() => run(keyRef.current), [run]);
  const reload = useCallback(async () => {
    await reloadData();
  }, [reloadData]);
  const refresh = useCallback(() => {
    if (!mounted.current) return;
    sequence.current++;
    const resourceKey = keyRef.current;
    setState((previous) => ({
      key: resourceKey,
      data:
        resourceKey !== null && previous.key === resourceKey
          ? previous.data
          : undefined,
      loading: resourceKey !== null,
    }));
    setRevision((value) => value + 1);
  }, []);
  const mutate = useCallback((update: (data: T | undefined) => T) => {
    if (!mounted.current) return;
    sequence.current++;
    const resourceKey = keyRef.current;
    if (resourceKey === null) return;
    setState((previous) => ({
      key: resourceKey,
      data: update(previous.key === resourceKey ? previous.data : undefined),
      loading: false,
    }));
  }, []);

  const matches = key !== null && state.key === key;
  const data = matches ? state.data : undefined;
  const loading = key !== null && (!matches || state.loading);
  const error = matches ? state.error : undefined;
  return {
    data,
    loading,
    error,
    ready: matches && !loading && !error && data !== undefined,
    reloadData,
    reload,
    refresh,
    mutate,
  };
}
