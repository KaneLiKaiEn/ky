import { useEffect, useRef } from "react";
import { useFormEvent } from "@/pages/CustomForm/contexts/FormEventContext";
import type { FieldValue } from "../model/fieldValue";
import { shouldDebounceElemEvent } from "@/pages/CustomForm/utils/elemTags";

export interface UseElemInputEventOptions {
  elem_id: number;
  section_id: number;
  row_no?: number;
  value_type?: string | null;
  elem_tag?: string;
  isEventTrigger: boolean;
  value: FieldValue;
  onExternalSet: (next: FieldValue) => void;
  onRenderHtml: (html: string) => void;
  getScore?: () => number;
}

export const useElemInputEvent = ({
  elem_id,
  section_id,
  row_no,
  value_type,
  elem_tag,
  isEventTrigger,
  value,
  onExternalSet,
  onRenderHtml,
  getScore,
}: UseElemInputEventOptions) => {
  const formEvent = useFormEvent();
  const registerElem = formEvent?.registerElem;
  const fireInputEvent = formEvent?.fireInputEvent;
  const valueRef = useRef(value);
  valueRef.current = value;
  const onExternalSetRef = useRef(onExternalSet);
  onExternalSetRef.current = onExternalSet;
  const onRenderHtmlRef = useRef(onRenderHtml);
  onRenderHtmlRef.current = onRenderHtml;
  const getScoreRef = useRef(getScore);
  getScoreRef.current = getScore;

  useEffect(() => {
    if (!registerElem) return;
    return registerElem({
      elem_id,
      section_id,
      row_no,
      isEventTrigger,
      getLatestVal: () => valueRef.current.value_text ?? "",
      getValueCode: () => valueRef.current.value_code ?? "",
      getScore: () => getScoreRef.current?.() ?? 0,
      set: (patch) => {
        const current = valueRef.current;
        const next: FieldValue = {
          value_text: patch.value_text ?? current.value_text,
          value_code:
            patch.value_code !== undefined
              ? patch.value_code
              : current.value_code,
          value_note:
            patch.value_note !== undefined
              ? patch.value_note
              : current.value_note,
        };
        valueRef.current = next;
        onExternalSetRef.current(next);
      },
      setRenderHtml: (html) => onRenderHtmlRef.current(html),
    });
  }, [elem_id, registerElem, isEventTrigger, row_no, section_id]);

  const notifyValueChange = (next: FieldValue) => {
    valueRef.current = next;
    if (!isEventTrigger || !fireInputEvent) return;
    fireInputEvent({
      elem_id,
      section_id,
      value_text: next.value_text,
      value_code: next.value_code,
      row_no,
      debounce: shouldDebounceElemEvent(value_type, elem_tag),
    });
  };

  return { notifyValueChange };
};
