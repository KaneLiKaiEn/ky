import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useWorkspaceNavigation } from "comm/management";

export interface SelectionNavigationOptions<S> {
  readSelection: (params: URLSearchParams) => S;
  selectionParams: (params: URLSearchParams, selection: S) => URLSearchParams;
  sameSelection: (a: S, b: S) => boolean;
  discardContent?: string;
}

export function useSelectionNavigation<S>(options: SelectionNavigationOptions<S>) {
  const {
    busy,
    isBusy,
    onDirtyChange,
    onBusyChange,
    setPageBusy,
    allow,
    commitNavigation,
  } = useWorkspaceNavigation(undefined, {
    discardContent: options.discardContent,
    hideSaveWithoutHandler: true,
  });
  const config = useRef(options);
  config.current = options;
  const [params, setParams] = useSearchParams();
  const [selection, setSelection] = useState(() => options.readSelection(params));
  const selectionRef = useRef(selection);
  const paramsRef = useRef(params);
  const setParamsRef = useRef(setParams);
  paramsRef.current = params;
  setParamsRef.current = setParams;
  const mounted = useRef(false);
  const navigationId = useRef(0);
  const commit = useCallback(
    (next: S, replace = false) => {
      navigationId.current++;
      commitNavigation(() => {
        selectionRef.current = next;
        setSelection(next);
        setParamsRef.current(
          config.current.selectionParams(paramsRef.current, next),
          { replace },
        );
      });
    },
    [commitNavigation],
  );
  const allowDiscard = useCallback(async () => {
    return (await allow()) && !isBusy();
  }, [allow, isBusy]);
  const transition = useCallback(
    async (next: S) => {
      if (config.current.sameSelection(next, selectionRef.current)) return;
      const id = ++navigationId.current;
      if (
        (await allowDiscard()) &&
        mounted.current &&
        id === navigationId.current &&
        !isBusy()
      ) {
        commit(next);
      }
    },
    [allowDiscard, commit, isBusy],
  );

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      navigationId.current++;
    };
  }, []);

  useEffect(() => {
    // The shared navigator/history guard already approved this URL. Confirming
    // or replacing it here would repeat the prompt and create another navigation.
    const next = config.current.readSelection(params);
    if (config.current.sameSelection(next, selectionRef.current)) return;
    navigationId.current++;
    selectionRef.current = next;
    setSelection(next);
  }, [params]);

  return {
    selection,
    selectionRef,
    busy,
    mounted,
    isBusy,
    onDirtyChange,
    onBusyChange,
    setPageBusy,
    commit,
    transition,
    allowDiscard,
  };
}
