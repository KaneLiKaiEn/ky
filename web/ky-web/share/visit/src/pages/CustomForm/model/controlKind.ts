import { hasTag } from "../utils/elemTags";

export type ControlKind =
  | "note"
  | "date"
  | "datetime"
  | "time"
  | "integer"
  | "number"
  | "boolean"
  | "booleanNote"
  | "address3"
  | "address4"
  | "textarea"
  | "dynamicCascader"
  | "multiCheckbox"
  | "multiSelect"
  | "singleDropdown"
  | "singleInstantDropdown"
  | "singleRadio"
  | "singleTags"
  | "input";

export interface ControlTagFlags {
  isMultiLineText: boolean;
  isDynamicCascader: boolean;
  isMultiSelect: boolean;
  isMultiCheckbox: boolean;
  isSingleDropdown: boolean;
  isSingleInstantDropdown: boolean;
  isSingleRadio: boolean;
  isSingleTags: boolean;
  needsFlatOptions: boolean;
}

export const hasElemNoteContent = (
  elem_note: string | null | undefined,
): boolean => Boolean(elem_note?.trim());

export const isBoolValueType = (
  valueType: string | null | undefined,
): boolean =>
  valueType === "BOOL" ||
  valueType === "BOOL_NOTE" ||
  valueType === "BOOL0_NOTE" ||
  valueType === "BOOL1_NOTE";

export const computeControlTagFlags = (
  elem_tag: string | null | undefined,
): ControlTagFlags => {
  const hasMulti = hasTag(elem_tag, "[多选]");
  const hasMultiExpand = hasTag(elem_tag, "[多选展开]");
  const hasSingle = hasTag(elem_tag, "[单选]");
  const hasDropdown = hasTag(elem_tag, "[下拉框]");
  const hasInstantDropdown = hasTag(elem_tag, "[即时下拉框]");
  const hasSingleExpand = hasTag(elem_tag, "[单选展开]");
  const flags = {
    isMultiLineText: hasTag(elem_tag, "[多行]"),
    isDynamicCascader: hasTag(elem_tag, "[多级下拉]"),
    isMultiCheckbox: hasMulti && hasMultiExpand,
    isMultiSelect: hasMulti && !hasMultiExpand,
    isSingleDropdown: hasSingle && hasDropdown,
    isSingleInstantDropdown: hasSingle && hasInstantDropdown,
    isSingleRadio: hasSingle && hasSingleExpand,
    isSingleTags:
      hasSingle && !hasDropdown && !hasInstantDropdown && !hasSingleExpand,
  };
  return {
    ...flags,
    needsFlatOptions:
      flags.isMultiSelect ||
      flags.isMultiCheckbox ||
      flags.isSingleDropdown ||
      flags.isSingleInstantDropdown ||
      flags.isSingleRadio ||
      flags.isSingleTags,
  };
};

/** 保持备注内容、固定类型、标签控件的既有优先级。 */
export const resolveControlKind = (elem: {
  value_type?: string | null;
  elem_tag?: string | null;
  elem_note?: string | null;
}): ControlKind => {
  if (hasElemNoteContent(elem.elem_note)) return "note";
  switch (elem.value_type) {
    case "DATE": return "date";
    case "DATETIME": return "datetime";
    case "TIME": return "time";
    case "INT": return "integer";
    case "NUM": return "number";
    case "BOOL": return "boolean";
    case "BOOL_NOTE":
    case "BOOL0_NOTE":
    case "BOOL1_NOTE": return "booleanNote";
    case "ADDRESS3": return "address3";
    case "ADDRESS4": return "address4";
    default: {
      const flags = computeControlTagFlags(elem.elem_tag);
      if (flags.isMultiLineText) return "textarea";
      if (flags.isDynamicCascader) return "dynamicCascader";
      if (flags.isMultiCheckbox) return "multiCheckbox";
      if (flags.isMultiSelect) return "multiSelect";
      if (flags.isSingleDropdown) return "singleDropdown";
      if (flags.isSingleInstantDropdown) return "singleInstantDropdown";
      if (flags.isSingleRadio) return "singleRadio";
      if (flags.isSingleTags) return "singleTags";
      return "input";
    }
  }
};
