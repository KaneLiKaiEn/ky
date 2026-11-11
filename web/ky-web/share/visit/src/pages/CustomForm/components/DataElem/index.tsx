import {
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import { Alert, Space, Tooltip } from "antd";
import DataElemControl, {
  hasElemNoteContent,
  isBoolValueType,
  renderElemScore,
} from "./Control";
import { PiecePickerAddon } from "./PiecePicker";
import { ReferenceDialogAddon } from "./ReferenceDialog";
import { useFieldController } from "../../hooks/useFieldController";
import { useElemValue } from "../../hooks/useElemValue";
import { useFormEvent } from "../../contexts/FormEventContext";
import type {
  DataElemProps,
  DataElemRef,
  ElemValue,
} from "./types";

const resolveLabel = (
  elem_title: string | null,
  elem_name: string,
): string | null => {
  if (elem_title === "null") return null;
  if (elem_title === "" || elem_title === undefined || elem_title === null)
    return elem_name;
  return elem_title;
};

const DataElem = forwardRef<DataElemRef, DataElemProps>(
  ({ elemProp, elemValue, formContext, onElemValueChanged }, ref) => {
    const [elemScore, setElemScore] = useState<number | null>(null);
    const formEvent = useFormEvent();
    const field = useElemValue({
      elemValue,
      scopeKey: `${formEvent?.scopeKey ?? JSON.stringify(formContext)}:${elemProp.section_id}:${elemProp.elem_id}:${elemProp.row_no ?? 0}`,
      formProp: formEvent?.formProp ?? (formContext?.form_id != null && formContext.visit_id != null ? {
        form_id: formContext.form_id,
        visit_id: formContext.visit_id,
        baby_id: formContext.baby_id,
        emr_id: formContext.emr_id,
      } : undefined),
      section_id: elemProp.section_id,
      elem_id: elemProp.elem_id,
      row_no: elemProp.row_no,
      onChanged: () => onElemValueChanged?.(elemProp.section_id, elemProp.elem_id),
    });
    const { behavior, renderHtml, handleControlChange } = useFieldController({
      elemProp,
      value: field.value,
      onChange: field.changeValue,
      getScore: () => elemScore ?? 0,
    });
    const { value_text: textValue, value_code: codeValue, value_note: noteValue } = field.value;

    const isNoteContent = hasElemNoteContent(elemProp.elem_note);
    const showRequiredMark = behavior.isRequired || behavior.isMustSelect;
    const showLabelAddon =
      !isBoolValueType(elemProp.value_type) && !isNoteContent;
    const label = resolveLabel(elemProp.elem_title, elemProp.elem_name);

    const renderLabelMarks = () => (
      <>
        {showRequiredMark ? (
          <span className="text-[#ff4d4f] ml-0.5 shrink-0">*</span>
        ) : null}
        {elemScore != null ? renderElemScore(elemScore, true) : null}
      </>
    );

    const renderWrappedLabel = () => {
      if (!showLabelAddon || label === null) return null;
      return (
        <>
          <span className="break-words">{label}</span>
          {renderLabelMarks()}
        </>
      );
    };

    const renderEllipsisLabel = () => {
      if (!showLabelAddon || label === null) return null;
      return (
        <>
          <Tooltip title={label}>
            <span className="min-w-0 truncate">{label}</span>
          </Tooltip>
          {renderLabelMarks()}
        </>
      );
    };

    const assessScoreKey = `${elemProp.section_id}-${elemProp.elem_id}${
      elemProp.row_no != null ? `-${elemProp.row_no}` : ""
    }`;

    const control = (
      <div className="flex min-w-0 flex-1">
        <DataElemControl
          elemProp={elemProp}
          assessScoreKey={assessScoreKey}
          value={{
            value_text: textValue,
            value_code: codeValue,
            value_note: noteValue,
          }}
          onChange={handleControlChange}
          onScoreChange={setElemScore}
        />
      </div>
    );

    const piecePickerButton =
      behavior.isPiece && !isNoteContent ? (
        <PiecePickerAddon
          elem_id={elemProp.elem_id}
          elem_name={elemProp.elem_name}
          context={formContext}
          currentValue={textValue}
          disabled={behavior.isReadOnly}
          onSelect={(content) => {
            handleControlChange({ value_text: content });
          }}
        />
      ) : null;

    const referenceDialogButton =
      behavior.isReference && !isNoteContent ? (
        <ReferenceDialogAddon
          disabled={behavior.isReadOnly}
          context={formContext}
          onSelect={(content) => {
            handleControlChange({ value_text: content });
          }}
        />
      ) : null;

    const piecePickerAddon = piecePickerButton ? (
      <Space.Addon className="shrink-0">{piecePickerButton}</Space.Addon>
    ) : null;

    const referenceDialogAddon = referenceDialogButton ? (
      <Space.Addon className="shrink-0">{referenceDialogButton}</Space.Addon>
    ) : null;

    useImperativeHandle(
      ref,
      () => ({
        getElemValue: (): ElemValue => {
          const value = field.getValue();
          return {
            section_id: elemProp.section_id,
            elem_id: elemProp.elem_id,
            value_text: value.value_text,
            value_code: value.value_code || undefined,
            value_note: value.value_note || undefined,
            ...(elemScore != null ? { value_score: elemScore } : {}),
          };
        },
        initElemValue: (initElemValue) => {
          if (elemProp.support_init) void field.initialize(initElemValue);
        },
      }),
      [elemProp, elemScore, field],
    );

    const hasVisibleLabel = showLabelAddon && label !== null;
    const addonsOnTitle = behavior.isMultiLine && hasVisibleLabel;

    const unitAddon = elemProp.elem_unit ? (
      <Space.Addon className="shrink-0">{elemProp.elem_unit}</Space.Addon>
    ) : null;

    const fieldBody = isNoteContent ? (
      control
    ) : behavior.isMultiLine ? (
      <div className="w-full min-w-0">
        {hasVisibleLabel ? (
          <div className="mb-1 flex min-w-0 items-center gap-1">
            <div className="min-w-0 flex-1 break-words">
              {renderWrappedLabel()}
            </div>
            {piecePickerButton || referenceDialogButton ? (
              <div className="inline-flex shrink-0 items-center">
                {piecePickerButton}
                {referenceDialogButton}
              </div>
            ) : null}
          </div>
        ) : null}
        <Space.Compact block className="min-w-0">
          {control}
          {addonsOnTitle ? null : piecePickerAddon}
          {addonsOnTitle ? null : referenceDialogAddon}
          {unitAddon}
        </Space.Compact>
      </div>
    ) : (
      <Space.Compact block className="min-w-0">
        {showLabelAddon && label !== null ? (
          <Space.Addon className="min-w-0 max-w-[50%] overflow-hidden">
            {renderEllipsisLabel()}
          </Space.Addon>
        ) : null}
        {control}
        {piecePickerAddon}
        {referenceDialogAddon}
        {unitAddon}
      </Space.Compact>
    );

    return (
      <div className="min-w-0 w-full" data-section-item-elem-id={elemProp.elem_id} aria-busy={field.initializing}>
        {field.initError ? <Alert type="error" title={field.initError} className="mb-1" /> : null}
        {behavior.isEventTriggerResultRender ? (
          <div
            className="min-h-8 px-2"
            dangerouslySetInnerHTML={{ __html: renderHtml }}
          />
        ) : null}
        <div
          className={
            behavior.isEventTriggerResultRender
              ? "hidden"
              : "min-w-0 w-full"
          }
        >
          {fieldBody}
        </div>
      </div>
    );
  },
);

export default DataElem;
