import { useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import type { ElemOptionRow } from "@/types/elem";
import { useElemOptions } from "../../hooks/useElemOptions";
import { useElemScore } from "../../hooks/useElemScore";
import {
  computeControlTagFlags,
  hasElemNoteContent,
  resolveControlKind,
} from "../../model/controlKind";
import type { FieldValue, FieldValuePatch } from "../../model/fieldValue";
import {
  computeOptionScore,
  createOptionValueIndex,
  normalizeOptionValue,
  splitCodes,
} from "../../model/optionValue";
import { computeElemTagBehavior } from "../../utils/elemTags";
import { BasicControl } from "./controls/BasicControl";
import { BoolControl } from "./controls/BoolControl";
import { AddressControl, DynamicCascaderControl } from "./controls/CascaderControl";
import { OptionControl } from "./controls/OptionControl";
import { OptionsStatus } from "./controls/OptionsStatus";
import { ScoreMark } from "./controls/ScoreMark";
import type { ControlElement } from "./controls/types";

// 保留旧导入路径，普通字段、表格及其他调用方可以逐步迁移。
export { computeElemTagBehavior } from "../../utils/elemTags";
export type { ElemTagBehavior } from "../../utils/elemTags";
export { isBoolValueType, hasElemNoteContent } from "../../model/controlKind";
export { DATE_FORMAT, DATETIME_FORMAT, TIME_FORMAT } from "./controls/BasicControl";
export type DataElemControlValue = FieldValue;

export interface DataElemControlProps {
  elemProp: ControlElement;
  assessScoreKey?: string;
  value: DataElemControlValue;
  onChange: (next: DataElemControlValue) => void;
  onScoreChange?: (score: number | null) => void;
}

export const renderElemScore = (score: number, showScore: boolean): ReactNode =>
  showScore ? <ScoreMark score={score} /> : null;

const EMPTY_OPTIONS: ElemOptionRow[] = [];

const DataElemControl = ({
  elemProp,
  assessScoreKey,
  value,
  onChange,
  onScoreChange,
}: DataElemControlProps) => {
  const kind = resolveControlKind(elemProp);
  const tagFlags = useMemo(() => computeControlTagFlags(elemProp.elem_tag), [elemProp.elem_tag]);
  const behavior = useMemo(() => computeElemTagBehavior(elemProp.elem_tag), [elemProp.elem_tag]);
  const valueType = elemProp.value_type ?? "";
  const optionsEnabled =
    !hasElemNoteContent(elemProp.elem_note) &&
    (valueType === "" || valueType === "STR") &&
    (tagFlags.needsFlatOptions || tagFlags.isDynamicCascader);
  const options = useElemOptions(elemProp.elem_id, optionsEnabled);
  // 保持多级下拉优先使用树形选项，不将其根节点用作平面选项。
  const flatOptions = tagFlags.isDynamicCascader ? EMPTY_OPTIONS : options.rows;
  const optionIndex = useMemo(() => createOptionValueIndex(flatOptions), [flatOptions]);
  const normalizedValue: FieldValue = {
    value_text: value.value_text ?? "",
    value_code: value.value_code ?? "",
    value_note: value.value_note ?? "",
  };
  const valueRef = useRef(normalizedValue);
  valueRef.current = normalizedValue;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onPatch = (patch: FieldValuePatch) => {
    onChangeRef.current({ ...valueRef.current, ...patch });
  };

  useEffect(() => {
    if (!tagFlags.needsFlatOptions || flatOptions.length === 0) return;
    const patch = normalizeOptionValue(valueRef.current, flatOptions, optionIndex);
    if (patch) onChangeRef.current({ ...valueRef.current, ...patch });
  }, [tagFlags.needsFlatOptions, flatOptions, optionIndex, value.value_text, value.value_code]);

  const codeValue = normalizedValue.value_code ?? "";
  const scoringCodes = tagFlags.isSingleRadio ? (codeValue ? [codeValue] : []) : splitCodes(codeValue);
  const { isAssessForm } = useElemScore({
    scoreKey: assessScoreKey,
    eligible: (tagFlags.isSingleRadio || tagFlags.isMultiCheckbox) && flatOptions.length > 0,
    hasScores: optionIndex.scores.size > 0,
    score: computeOptionScore(scoringCodes, optionIndex),
    onScoreChange,
  });

  const controlProps = { elemProp, value: normalizedValue, behavior, onPatch };
  let control: ReactNode;
  switch (kind) {
    case "boolean":
    case "booleanNote":
      control = <BoolControl {...controlProps} />;
      break;
    case "address3":
    case "address4":
      control = <AddressControl {...controlProps} full={kind === "address4"} />;
      break;
    case "dynamicCascader":
      control = <DynamicCascaderControl {...controlProps} rows={options.rows} />;
      break;
    case "multiCheckbox":
    case "multiSelect":
    case "singleDropdown":
    case "singleInstantDropdown":
    case "singleRadio":
    case "singleTags":
      control = <OptionControl {...controlProps} kind={kind} options={flatOptions} index={optionIndex} showAssessScore={isAssessForm} />;
      break;
    default:
      control = <BasicControl {...controlProps} kind={kind} />;
  }
  return (
    <OptionsStatus loading={options.loading} error={options.error} onRetry={options.retry}>
      {control}
    </OptionsStatus>
  );
};

export default DataElemControl;
