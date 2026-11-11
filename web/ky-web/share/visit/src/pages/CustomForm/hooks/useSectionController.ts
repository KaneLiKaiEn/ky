import { useCallback, useEffect, useMemo, useRef } from "react";
import type { DataElemRef, ElemProp, ElemValue, InitValue } from "../components/DataElem/types";
import type { MultiRowTableRef } from "../components/MultiRowTable/types";
import type { SectionRef } from "../components/Section/types";
import { getElemKey } from "../model/sectionDefinition";

export const useSectionController = ({
  contextKey,
  loading,
  elemList,
  isMultiRow,
}: {
  contextKey: string;
  loading: boolean;
  elemList: ElemProp[];
  isMultiRow: boolean;
}) => {
  const elemRefs = useRef(new Map<string, DataElemRef>());
  const multiRowTableRef = useRef<MultiRowTableRef>(null);
  const pendingInitRef = useRef<{ key: string; value: InitValue; force?: boolean } | null>(null);
  const currentRef = useRef({ contextKey, loading });
  currentRef.current = { contextKey, loading };

  const applySectionInit = useCallback((value: InitValue, force?: boolean) => {
    if (isMultiRow) {
      multiRowTableRef.current?.initSectionValue(value, force ? { force: true } : undefined);
      return;
    }
    elemList.forEach((elem, index) => {
      elemRefs.current.get(getElemKey(elem, index))?.initElemValue(value);
    });
  }, [elemList, isMultiRow]);

  const queueSectionInit = useCallback((value: InitValue, options?: { force?: boolean }) => {
    pendingInitRef.current = { key: currentRef.current.contextKey, value, force: options?.force };
    if (currentRef.current.loading) return;
    pendingInitRef.current = null;
    applySectionInit(value, options?.force);
  }, [applySectionInit]);

  useEffect(() => {
    const pending = pendingInitRef.current;
    if (!pending) return;
    if (pending.key !== contextKey) {
      pendingInitRef.current = null;
      return;
    }
    if (loading) return;
    pendingInitRef.current = null;
    applySectionInit(pending.value, pending.force);
  }, [applySectionInit, contextKey, loading]);

  const controller = useMemo<SectionRef>(() => ({
    getSectionValue: () => isMultiRow
      ? multiRowTableRef.current?.getSectionValue() ?? []
      : elemList.map((elem, index) =>
        elemRefs.current.get(getElemKey(elem, index))?.getElemValue())
        .filter((value): value is ElemValue => value != null),
    initSectionValue: (value) => queueSectionInit(value),
  }), [elemList, isMultiRow, queueSectionInit]);

  return { elemRefs, multiRowTableRef, controller, queueSectionInit };
};
