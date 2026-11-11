import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash/debounce";

export function useRemoteOptions<T>(
  search: (keyword: string) => Promise<T[]>,
  wait = 300,
) {
  const [options, setOptions] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(search);
  searchRef.current = search;

  const debouncedSearch = useMemo(
    () =>
      debounce((trimmed: string) => {
        void (async () => {
          setLoading(true);
          try {
            setOptions(await searchRef.current(trimmed));
          } catch {
            setOptions([]);
          } finally {
            setLoading(false);
          }
        })();
      }, wait),
    [wait],
  );

  useEffect(
    () => () => {
      debouncedSearch.cancel();
    },
    [debouncedSearch],
  );

  const onSearch = useCallback(
    (keyword: string) => {
      const trimmed = keyword.trim();
      if (!trimmed) {
        debouncedSearch.cancel();
        setOptions([]);
        return;
      }
      debouncedSearch(trimmed);
    },
    [debouncedSearch],
  );

  return { options, loading, onSearch, setOptions };
}
