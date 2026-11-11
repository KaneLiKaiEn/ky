import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash/debounce";
import { DEFAULT_SOURCE, SEARCH_DEBOUNCE_MS } from "../constants";
import { retrieveSourceItemList } from "../services/sourceSearch";
import type { SourceItemOption, SourceKind } from "../types";

/** 多来源防抖检索：用于字典项弹窗中“从已有数据回填” */
export function useSourceSearch(orgId?: number) {
  const [source, setSource] = useState<SourceKind>(DEFAULT_SOURCE);
  const [value, setValue] = useState<string>();
  const [options, setOptions] = useState<SourceItemOption[]>([]);
  const [searching, setSearching] = useState(false);
  const sourceRef = useRef(source);
  const orgIdRef = useRef(orgId);
  sourceRef.current = source;
  orgIdRef.current = orgId;

  const debouncedSearch = useMemo(
    () =>
      debounce(async (input: string) => {
        const requestSource = sourceRef.current;
        setSearching(true);
        try {
          const result = await retrieveSourceItemList(requestSource, {
            org_id: orgIdRef.current,
            retrieve_input: input,
          });
          if (sourceRef.current !== requestSource) return;
          setOptions(result);
        } catch {
          if (sourceRef.current !== requestSource) return;
          setOptions([]);
        } finally {
          if (sourceRef.current === requestSource) setSearching(false);
        }
      }, SEARCH_DEBOUNCE_MS),
    [],
  );

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  const reset = useCallback(() => {
    debouncedSearch.cancel();
    setSearching(false);
    setSource(DEFAULT_SOURCE);
    setValue(undefined);
    setOptions([]);
  }, [debouncedSearch]);

  const changeSource = useCallback(
    (next: SourceKind) => {
      debouncedSearch.cancel();
      setSearching(false);
      setSource(next);
      setValue(undefined);
      setOptions([]);
    },
    [debouncedSearch],
  );

  const search = useCallback(
    (input: string) => {
      void debouncedSearch(input);
    },
    [debouncedSearch],
  );

  return { source, value, setValue, options, searching, changeSource, search, reset };
}
