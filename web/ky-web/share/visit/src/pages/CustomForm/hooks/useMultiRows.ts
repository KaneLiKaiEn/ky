import { useEffect, useRef, useState } from "react";
import { getVisitInitValue } from "@/api/elem";
import { getSectionInitData } from "@/api/form";
import type { ElemProp, ElemValue, FormContext, InitValue } from "../components/DataElem/types";
import { buildInitialRows, EMPTY_CELL, getMultiRowScopeKey, isDraftRowsBinding, isRowEmpty, mapSectionInitDataToRows, serializeRows, type CellValue, type MultiRowContext, type TableRow } from "../model/multiRowModel";
import { LatestRequest } from "../runtime/latestRequest";

interface MultiRowsOptions {
  section_id: number;
  formContext?: FormContext;
  elemList: ElemProp[];
  sectionValues?: ElemValue[];
  sectionInit?: string;
  onSectionValueChanged?: (section_id: number, elem_id: number) => void;
}

interface RowsSnapshot {
  scopeKey: string;
  context: MultiRowContext;
  source: ElemValue[] | undefined;
  rows: TableRow[];
}

export const useMultiRows = ({
  section_id,
  formContext,
  elemList,
  sectionValues,
  sectionInit,
  onSectionValueChanged,
}: MultiRowsOptions) => {
  const context = { section_id, ...formContext };
  const scopeKey = getMultiRowScopeKey(context);
  const [snapshot, setSnapshot] = useState<RowsSnapshot>(() => ({
    scopeKey,
    context,
    source: sectionValues,
    rows: buildInitialRows(sectionValues),
  }));
  const nextIdRef = useRef(Math.max(0, ...snapshot.rows.map((row) => row.id)) + 1);
  const allocateId = () => nextIdRef.current++;
  const [initializing, setInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const requestRef = useRef(new LatestRequest());
  const mountedRef = useRef(true);
  const editVersionRef = useRef(0);
  const currentRef = useRef({ scopeKey, source: sectionValues, elemList });
  currentRef.current = { scopeKey, source: sectionValues, elemList };
  const previousInputRef = useRef(currentRef.current);
  const sectionInitRef = useRef(sectionInit);
  sectionInitRef.current = sectionInit;
  const onChangedRef = useRef(onSectionValueChanged);
  onChangedRef.current = onSectionValueChanged;
  const datasetScopeKey = JSON.stringify([
    section_id, formContext?.form_id, formContext?.visit_id, formContext?.baby_id,
  ]);
  const datasetScopeRef = useRef(datasetScopeKey);
  const importedKeyRef = useRef<string | null>(null);
  const datasetRequestRef = useRef<number | null>(null);
  const preserveDraft = snapshot.source === sectionValues && isDraftRowsBinding(snapshot.context, context);
  const snapshotMatches = (snapshot.scopeKey === scopeKey || preserveDraft) && snapshot.source === sectionValues;
  const rows = snapshotMatches ? snapshot.rows : [];
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const commitRows = (next: TableRow[]) => {
    rowsRef.current = next;
    setSnapshot({ scopeKey, context, source: sectionValues, rows: next });
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const previous = previousInputRef.current;
    if (previous.scopeKey === scopeKey && previous.source === sectionValues && previous.elemList === elemList) return;
    const sourceChanged = previous.source !== sectionValues;
    const datasetChanged = datasetScopeRef.current !== datasetScopeKey;
    previousInputRef.current = { scopeKey, source: sectionValues, elemList };
    if (datasetChanged) {
      datasetScopeRef.current = datasetScopeKey;
      importedKeyRef.current = null;
      editVersionRef.current = 0;
    } else if (sourceChanged) {
      importedKeyRef.current = null;
      editVersionRef.current = 0;
    }
    requestRef.current.invalidate();
    if (snapshot.scopeKey !== scopeKey || snapshot.source !== sectionValues) {
      const next = preserveDraft ? rowsRef.current : buildInitialRows(sectionValues, allocateId);
      rowsRef.current = next;
      setSnapshot({ scopeKey, context, source: sectionValues, rows: next });
    }
    setInitializing(false);
    setInitError(null);
    // The snapshot itself changes on edits and must not reset editable rows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeKey, sectionValues, elemList, datasetScopeKey]);

  const markEdited = () => {
    editVersionRef.current++;
    requestRef.current.invalidate();
    setInitializing(false);
    setInitError(null);
  };

  const changeCell = (rowId: number, elem_id: number, next: CellValue) => {
    markEdited();
    commitRows(rowsRef.current.map((row) => {
      if (row.id !== rowId) return row;
      const current = row.values[elem_id];
      return {
        ...row,
        values: {
          ...row.values,
          [elem_id]: {
            ...next,
            ...(current?.value_score != null ? { value_score: current.value_score } : {}),
          },
        },
      };
    }));
    onSectionValueChanged?.(section_id, elem_id);
  };

  const changeCellScore = (rowId: number, elem_id: number, score: number | null) => {
    const nextScore = score ?? undefined;
    const row = rowsRef.current.find((item) => item.id === rowId);
    if (!row) return;
    const current = row.values[elem_id] ?? EMPTY_CELL;
    if (current.value_score === nextScore) return;
    const nextCell = { ...current };
    if (nextScore == null) delete nextCell.value_score;
    else nextCell.value_score = nextScore;
    commitRows(rowsRef.current.map((item) => item.id === rowId
      ? { ...item, values: { ...item.values, [elem_id]: nextCell } }
      : item));
  };

  const addRow = () => {
    markEdited();
    commitRows([...rowsRef.current, { id: allocateId(), values: {} }]);
  };

  const deleteRow = (rowId: number) => {
    markEdited();
    commitRows(rowsRef.current.filter((row) => row.id !== rowId));
  };

  const loadSectionInit = async (initValue: InitValue, force: boolean): Promise<boolean> => {
    const statement = sectionInitRef.current?.trim() ?? "";
    if (!statement) return false;
    const importKey = `${datasetScopeKey}\0${statement}`;
    if (!force) {
      if ((currentRef.current.source?.length ?? 0) > 0) return true;
      if (importedKeyRef.current === importKey) return true;
      if (editVersionRef.current > 0) return true;
      if (rowsRef.current.some((row) => !isRowEmpty(row, currentRef.current.elemList))) return true;
      if (datasetRequestRef.current != null && requestRef.current.isCurrent(datasetRequestRef.current)) return true;
    }
    if (currentRef.current.elemList.length === 0) return true;

    const request = requestRef.current.begin();
    datasetRequestRef.current = request;
    const editVersion = editVersionRef.current;
    const initScopeKey = currentRef.current.scopeKey;
    const initSource = currentRef.current.source;
    const initDefinition = currentRef.current.elemList;
    const isCurrent = () => mountedRef.current && requestRef.current.isCurrent(request)
      && currentRef.current.scopeKey === initScopeKey
      && currentRef.current.source === initSource
      && currentRef.current.elemList === initDefinition
      && editVersionRef.current === editVersion;
    setInitError(null);
    setInitializing(true);
    try {
      const res = await getSectionInitData({
        visit_id: initValue.visit_id,
        section_id,
      });
      if (!isCurrent()) return true;
      if (res.code !== 0) throw new Error(res.message || "初始化失败");
      commitRows(mapSectionInitDataToRows(res.data, initDefinition, allocateId));
      importedKeyRef.current = importKey;
      initDefinition.forEach((elem) => onChangedRef.current?.(section_id, elem.elem_id));
    } catch (error) {
      if (isCurrent()) setInitError(error instanceof Error ? error.message : "初始化失败，请重试");
    } finally {
      if (requestRef.current.isCurrent(request)) {
        datasetRequestRef.current = null;
        setInitializing(false);
      }
    }
    return true;
  };
  const loadSectionInitRef = useRef(loadSectionInit);
  loadSectionInitRef.current = loadSectionInit;

  useEffect(() => {
    const visit_id = formContext?.visit_id;
    if (!(sectionInit?.trim()) || !visit_id || elemList.length === 0) return;
    if ((sectionValues?.length ?? 0) > 0) return;
    void loadSectionInitRef.current({ visit_id }, false);
  }, [sectionInit, datasetScopeKey, elemList, sectionValues, formContext?.visit_id]);

  const initSectionValue = async (initValue: InitValue, options?: { force?: boolean }) => {
    if (await loadSectionInitRef.current(initValue, options?.force ?? false)) return;
    const request = requestRef.current.begin();
    const editVersion = editVersionRef.current;
    const initScopeKey = scopeKey;
    const initSource = sectionValues;
    const initDefinition = elemList;
    const initElems = elemList.filter((elem) => elem.support_init);
    const isCurrent = () => mountedRef.current && requestRef.current.isCurrent(request)
      && currentRef.current.scopeKey === initScopeKey
      && currentRef.current.source === initSource
      && currentRef.current.elemList === initDefinition
      && editVersionRef.current === editVersion;
    setInitError(null);
    setInitializing(true);
    commitRows([]);
    try {
      const results = await Promise.all(initElems.map(async (elem) => {
        const res = await getVisitInitValue({
          visit_id: initValue.visit_id,
          baby_id: initValue.baby_id,
          section_id,
          row_no: 1,
          elem_id: elem.elem_id,
        });
        if (res.code !== 0) throw new Error(res.message || "初始化失败");
        return [elem.elem_id, {
          value_text: res.value_text ?? "",
          value_code: res.value_code,
          value_note: res.value_note,
        } satisfies CellValue] as const;
      }));
      if (!isCurrent()) return;
      commitRows([{ id: allocateId(), values: Object.fromEntries(results) }]);
      initElems.forEach((elem) => onSectionValueChanged?.(section_id, elem.elem_id));
    } catch (error) {
      if (isCurrent()) setInitError(error instanceof Error ? error.message : "初始化失败，请重试");
    } finally {
      if (isCurrent()) setInitializing(false);
    }
  };

  return {
    rows,
    initializing,
    initError,
    changeCell,
    changeCellScore,
    addRow,
    deleteRow,
    initSectionValue,
    getSectionValue: () => serializeRows(section_id, rowsRef.current, elemList),
  };
};
