import { useEffect, useMemo, useRef, useState } from "react";
import type { ElemProp } from "../components/DataElem/types";
import type { FieldValue } from "../model/fieldValue";
import { computeElemTagBehavior } from "../utils/elemTags";
import { useElemInputEvent } from "./useElemInputEvent";

export type FieldChangeSource = "user" | "event" | "init";

interface FieldControllerOptions {
  elemProp: Pick<ElemProp, "elem_id" | "section_id" | "row_no" | "value_type" | "elem_tag">;
  value: FieldValue;
  onChange: (value: FieldValue, source: FieldChangeSource) => void;
  getScore?: () => number;
}

/** Shared behavior only: the field or table remains the owner of its value. */
export const useFieldController = ({ elemProp, value, onChange, getScore }: FieldControllerOptions) => {
  const behavior = useMemo(() => computeElemTagBehavior(elemProp.elem_tag), [elemProp.elem_tag]);
  const [renderHtml, setRenderHtml] = useState(value.value_text);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const applyValue = (next: FieldValue, source: FieldChangeSource) => {
    if (behavior.isEventTriggerResultRender) setRenderHtml(next.value_text);
    onChangeRef.current(next, source);
  };

  const { notifyValueChange } = useElemInputEvent({
    ...elemProp,
    isEventTrigger: behavior.isEventTrigger,
    value,
    onExternalSet: (next) => applyValue(next, "event"),
    onRenderHtml: setRenderHtml,
    getScore,
  });

  useEffect(() => {
    if (behavior.isEventTriggerResultRender) setRenderHtml(value.value_text);
  }, [behavior.isEventTriggerResultRender, value.value_text]);

  const handleControlChange = (next: FieldValue) => {
    applyValue(next, "user");
    notifyValueChange(next);
  };

  return { behavior, renderHtml, applyValue, handleControlChange };
};
