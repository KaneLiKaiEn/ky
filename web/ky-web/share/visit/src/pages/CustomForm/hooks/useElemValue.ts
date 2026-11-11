import { useEffect, useRef, useState } from "react";
import { getVisitInitValue } from "@/api/elem";
import type { ElemValue, InitValue } from "../components/DataElem/types";
import type { FieldValue } from "../model/fieldValue";
import type { FormProperty } from "../components/Form/types";
import { isDraftEmrBinding } from "../model/formIdentity";
import { LatestRequest } from "../runtime/latestRequest";

const toFieldValue = (value?: Partial<Pick<ElemValue, "value_text" | "value_code" | "value_note">>): FieldValue => ({
  value_text: value?.value_text ?? "", value_code: value?.value_code ?? "", value_note: value?.value_note ?? "",
});

interface FieldSnapshot {
  scopeKey: string;
  sourceKey: string;
  fieldKey: string;
  formProp?: FormProperty;
  value: FieldValue;
}

export const useElemValue = ({ elemValue, scopeKey, formProp, section_id, elem_id, row_no, onChanged }: {
  elemValue?: ElemValue;
  scopeKey: string;
  formProp?: FormProperty;
  section_id: number;
  elem_id: number;
  row_no?: number;
  onChanged: () => void;
}) => {
  const sourceKey = JSON.stringify([elemValue?.value_text, elemValue?.value_code, elemValue?.value_note]);
  const fieldKey = JSON.stringify([section_id, elem_id, row_no ?? 0]);
  const [snapshot, setSnapshot] = useState<FieldSnapshot>(() => ({
    scopeKey, sourceKey, fieldKey, formProp: formProp ? { ...formProp } : undefined,
    value: toFieldValue(elemValue),
  }));
  let current = snapshot;
  if (snapshot.scopeKey !== scopeKey || snapshot.sourceKey !== sourceKey || snapshot.fieldKey !== fieldKey) {
    const preserveDraft = snapshot.sourceKey === sourceKey && snapshot.fieldKey === fieldKey
      && snapshot.formProp != null && formProp != null && isDraftEmrBinding(snapshot.formProp, formProp);
    current = {
      scopeKey, sourceKey, fieldKey, formProp: formProp ? { ...formProp } : undefined,
      value: preserveDraft ? snapshot.value : toFieldValue(elemValue),
    };
    // Reset before children and imperative getters can observe another record's draft.
    setSnapshot(current);
  }
  const value = current.value;
  const valueRef = useRef(value);
  valueRef.current = value;
  const [initializing, setInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const requestRef = useRef(new LatestRequest());
  const mountedRef = useRef(true);
  const currentRef = useRef({ scopeKey, sourceKey, fieldKey });
  currentRef.current = { scopeKey, sourceKey, fieldKey };
  const previousInputRef = useRef(currentRef.current);
  const onChangedRef = useRef(onChanged);
  onChangedRef.current = onChanged;

  const writeValue = (next: FieldValue) => {
    const normalized = toFieldValue(next);
    valueRef.current = normalized;
    setSnapshot({ scopeKey, sourceKey, fieldKey, formProp: formProp ? { ...formProp } : undefined, value: normalized });
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const previous = previousInputRef.current;
    if (previous.scopeKey === scopeKey && previous.sourceKey === sourceKey && previous.fieldKey === fieldKey) return;
    previousInputRef.current = { scopeKey, sourceKey, fieldKey };
    requestRef.current.invalidate();
    setInitializing(false);
    setInitError(null);
  }, [scopeKey, sourceKey, fieldKey]);

  const changeValue = (next: FieldValue) => {
    requestRef.current.invalidate();
    setInitializing(false);
    setInitError(null);
    writeValue(next);
    onChangedRef.current();
  };

  const initialize = async (init: InitValue) => {
    const request = requestRef.current.begin();
    const initialScope = scopeKey;
    const initialSource = sourceKey;
    const initialField = fieldKey;
    const isCurrent = () => mountedRef.current && requestRef.current.isCurrent(request)
      && currentRef.current.scopeKey === initialScope && currentRef.current.sourceKey === initialSource
      && currentRef.current.fieldKey === initialField;
    setInitializing(true);
    setInitError(null);
    writeValue({ value_text: "" });
    try {
      const response = await getVisitInitValue({
        visit_id: init.visit_id, baby_id: init.baby_id, section_id, elem_id,
      });
      if (!isCurrent()) return;
      if (response.code !== 0) throw new Error(response.message || "初始化失败");
      writeValue(toFieldValue(response));
      onChangedRef.current();
    } catch (error) {
      if (isCurrent()) setInitError(error instanceof Error ? error.message : "初始化失败，请重试");
    } finally {
      if (isCurrent()) setInitializing(false);
    }
  };

  return { value, getValue: () => valueRef.current, changeValue, initialize, initializing, initError };
};
