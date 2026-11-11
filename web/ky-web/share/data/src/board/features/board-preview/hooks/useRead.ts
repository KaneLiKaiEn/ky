import { useEffect, useRef, useState } from "react";
import { errorText } from "comm/utils";

export function useRead<T>(
  key: string,
  read: (signal: AbortSignal) => Promise<T>,
  revision?: number,
) {
  const reader = useRef(read);
  reader.current = read;
  const [attempt, setAttempt] = useState(0);
  const busy = useRef(false),
    pending = useRef(false),
    previousRefresh = useRef({ key, revision });
  const [state, setState] = useState<{
    key: string;
    data?: T;
    loading: boolean;
    error?: string;
  }>({ key, loading: true });
  useEffect(() => {
    const controller = new AbortController();
    busy.current = true;
    pending.current = false;
    setState((previous) => ({
      key,
      data: previous.key === key ? previous.data : undefined,
      loading: true,
    }));
    void reader.current(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) {
          setState({ key, data, loading: false });
          finish();
        }
      },
      (error) => {
        if (!controller.signal.aborted) {
          setState({ key, loading: false, error: errorText(error) });
          finish();
        }
      },
    );
    function finish() {
      busy.current = false;
      if (pending.current) {
        pending.current = false;
        setAttempt((v) => v + 1);
      }
    }
    return () => {
      controller.abort();
      busy.current = false;
    };
  }, [key, attempt]);
  const reload = () => {
    if (busy.current) pending.current = true;
    else setAttempt((v) => v + 1);
  };
  useEffect(() => {
    const previous = previousRefresh.current;
    previousRefresh.current = { key, revision };
    if (previous.key === key && previous.revision !== revision) reload();
  }, [key, revision]);
  return {
    ...(state.key === key
      ? state
      : { loading: true, data: undefined, error: undefined }),
    reload,
  };
}
