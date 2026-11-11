import type { ElemOptionRow } from "@/types/elem";
import { hasTag } from "../utils/elemTags";
import type { FieldValue, FieldValuePatch } from "./fieldValue";

export const optionLabel = (option: ElemOptionRow): string =>
  option.option_text ?? option.option_code ?? "";

export const splitCodes = (code: string | null | undefined): string[] =>
  code ? code.split(",").filter((part) => part.length > 0) : [];

export const createOptionValueIndex = (options: ElemOptionRow[]) => {
  const names = new Map<string, string>();
  const scores = new Map<string, number>();
  const noteCodes = new Set<string>();
  for (const option of options) {
    const code = option.option_code ?? "";
    names.set(code, optionLabel(option));
    if (code && option.option_score != null) scores.set(code, option.option_score);
    if (code && hasTag(option.option_tag, "[备注]")) noteCodes.add(code);
  }
  return {
    names,
    scores,
    noteCodes,
    selectOptions: options.map((option) => ({
      label: optionLabel(option),
      value: option.option_code ?? "",
    })),
  };
};

export type OptionValueIndex = ReturnType<typeof createOptionValueIndex>;

const clearUnusedNote = (
  codes: string[],
  index: OptionValueIndex,
): FieldValuePatch =>
  codes.some((code) => index.noteCodes.has(code)) ? {} : { value_note: "" };

export const multiOptionValue = (
  codes: string[],
  index: OptionValueIndex,
): FieldValuePatch => ({
  value_code: codes.join(","),
  value_text: codes.map((code) => index.names.get(code) ?? "").filter(Boolean).join(","),
  ...clearUnusedNote(codes, index),
});

export const singleOptionValue = (
  next: string | undefined,
  index: OptionValueIndex,
): FieldValuePatch => {
  const code = next ?? "";
  return {
    value_code: code,
    value_text: code ? (index.names.get(code) ?? "") : "",
    ...clearUnusedNote(code ? [code] : [], index),
  };
};

export const tagsOptionValue = (
  values: string[],
  index: OptionValueIndex,
): FieldValuePatch => {
  const last = values[values.length - 1] ?? "";
  if (!last) return { value_code: "", value_text: "", value_note: "" };
  const known = index.names.get(last);
  return known != null
    ? { value_code: last, value_text: known, ...clearUnusedNote([last], index) }
    : { value_code: last, value_text: last, value_note: "" };
};

/** 兼容历史数据将选项文字或编码存放在 value_text 的情况。 */
export const normalizeOptionValue = (
  value: FieldValue,
  options: ElemOptionRow[],
  index: OptionValueIndex,
): FieldValuePatch | null => {
  const text = value.value_text;
  const code = value.value_code ?? "";
  if (!text || index.names.get(code) === text) return null;
  const matched = options.find((option) => optionLabel(option) === text);
  if (matched) {
    const nextCode = matched.option_code ?? "";
    return nextCode !== code ? { value_code: nextCode, value_text: text } : null;
  }
  return index.names.has(text) && text !== code
    ? { value_code: text, value_text: index.names.get(text) ?? text }
    : null;
};

export const computeOptionScore = (codes: string[], index: OptionValueIndex): number =>
  codes.reduce((sum, code) => sum + (index.scores.get(code) ?? 0), 0);

export const cascaderValue = (
  values: Array<string | number>,
  labels: string[],
): FieldValuePatch => ({
  value_code: values.map(String).join(","),
  value_text: labels.join("/"),
});
