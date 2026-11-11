import type { ReactNode, SyntheticEvent } from "react";
import { Checkbox, Input, Radio, Select } from "antd";
import type { ElemOptionRow } from "@/types/elem";
import type { ControlKind } from "../../../model/controlKind";
import {
  multiOptionValue,
  optionLabel,
  singleOptionValue,
  splitCodes,
  tagsOptionValue,
  type OptionValueIndex,
} from "../../../model/optionValue";
import { ScoreMark } from "./ScoreMark";
import type { FieldControlProps } from "./types";

const OPTION_NOTE_INPUT_WIDTH = 160;
const stopNotePointer = (event: SyntheticEvent) => event.stopPropagation();

export const OptionControl = ({
  kind,
  options,
  index,
  showAssessScore,
  value,
  behavior,
  onPatch,
}: FieldControlProps & {
  kind: ControlKind;
  options: ElemOptionRow[];
  index: OptionValueIndex;
  showAssessScore: boolean;
}) => {
  const codeValue = value.value_code ?? "";
  const selectedCodes = splitCodes(codeValue);
  const isReadOnly = behavior.isReadOnly;
  const verticalClass = behavior.isMultiCheckboxVertical
    ? "flex flex-col items-start gap-1"
    : undefined;

  const noteInput = (inline: boolean) => (
    <Input
      value={value.value_note ?? ""}
      readOnly={isReadOnly}
      onChange={(event) => onPatch({ value_note: event.target.value })}
      onMouseDown={inline ? stopNotePointer : undefined}
      onClick={inline ? stopNotePointer : undefined}
      style={{ width: OPTION_NOTE_INPUT_WIDTH, ...(!inline ? { flexShrink: 0 } : {}) }}
    />
  );

  const selectedNote = (code: string, selected: boolean) =>
    selected && index.noteCodes.has(code) ? noteInput(true) : null;

  const withNote = (select: ReactNode, codes: string[]) =>
    codes.some((code) => index.noteCodes.has(code)) ? (
      <div className="flex items-center gap-2 min-w-0" style={{ flex: 1 }}>
        {select}
        {noteInput(false)}
      </div>
    ) : select;

  const optionScore = (score: number | null | undefined) =>
    showAssessScore && score != null ? <ScoreMark score={score} /> : null;

  if (kind === "multiCheckbox") {
    return (
      <div className="flex items-center px-2 flex-1 gap-2 min-h-8">
        <div className={verticalClass ?? "flex flex-wrap items-center gap-x-4 gap-y-1"}>
          {options.map((option) => {
            const code = option.option_code ?? "";
            const checked = selectedCodes.includes(code);
            return (
              <span key={code} className="inline-flex items-center gap-2 text-[14px]">
                <Checkbox
                  disabled={isReadOnly}
                  checked={checked}
                  onChange={(event) => {
                    const codes = event.target.checked
                      ? [...selectedCodes, code]
                      : selectedCodes.filter((selected) => selected !== code);
                    onPatch(multiOptionValue(codes, index));
                  }}
                >
                  {optionLabel(option)}
                  {optionScore(option.option_score)}
                </Checkbox>
                {selectedNote(code, checked)}
              </span>
            );
          })}
        </div>
      </div>
    );
  }
  if (kind === "singleRadio") {
    return (
      <div className="flex items-center px-2 flex-1 gap-2 min-h-8">
        <Radio.Group
          disabled={isReadOnly}
          value={codeValue || undefined}
          className={verticalClass}
          onChange={(event) => onPatch(singleOptionValue((event.target.value ?? "") as string, index))}
        >
          {options.map((option) => {
            const code = option.option_code ?? "";
            return (
              <span key={code} className="inline-flex items-center gap-2 text-[14px] [&:not(:last-child)]:me-2">
                <Radio
                  value={code}
                  style={{ marginInlineEnd: 0 }}
                  onClick={(event) => {
                    if (behavior.isRadioCancelable && codeValue === code) {
                      event.preventDefault();
                      onPatch(singleOptionValue(undefined, index));
                    }
                  }}
                >
                  {optionLabel(option)}
                  {optionScore(option.option_score)}
                </Radio>
                {selectedNote(code, codeValue === code)}
              </span>
            );
          })}
        </Radio.Group>
      </div>
    );
  }
  if (kind === "multiSelect") {
    return withNote(
      <Select
        mode="multiple"
        style={{ flex: 1, minWidth: 0 }}
        disabled={isReadOnly}
        value={selectedCodes}
        options={index.selectOptions}
        onChange={(values: Array<string | number>) => onPatch(multiOptionValue(values.map(String), index))}
        optionFilterProp="label"
        allowClear={!behavior.isMustSelect}
      />,
      selectedCodes,
    );
  }
  if (kind === "singleTags") {
    return withNote(
      <Select
        mode="tags"
        maxCount={1}
        style={{ flex: 1, minWidth: 0 }}
        disabled={isReadOnly}
        value={codeValue ? [codeValue] : []}
        options={index.selectOptions}
        onChange={(values: string[]) => onPatch(tagsOptionValue(values, index))}
        optionFilterProp="label"
        allowClear={!behavior.isMustSelect}
      />,
      codeValue ? [codeValue] : [],
    );
  }
  return withNote(
    <Select
      style={{ flex: 1, minWidth: 0 }}
      disabled={isReadOnly}
      value={codeValue || undefined}
      options={index.selectOptions}
      onChange={(next: string | undefined) => onPatch(singleOptionValue(next, index))}
      showSearch={kind === "singleInstantDropdown" || undefined}
      optionFilterProp={kind === "singleInstantDropdown" ? "label" : undefined}
      allowClear={!behavior.isMustSelect}
    />,
    codeValue ? [codeValue] : [],
  );
};
