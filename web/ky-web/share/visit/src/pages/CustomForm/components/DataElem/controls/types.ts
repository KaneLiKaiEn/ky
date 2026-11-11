import type { ElemProp } from "../types";
import type { FieldValue, FieldValuePatch } from "../../../model/fieldValue";
import type { ElemTagBehavior } from "../../../utils/elemTags";

export type ControlElement = Pick<
  ElemProp,
  | "elem_id"
  | "section_id"
  | "value_type"
  | "elem_name"
  | "elem_title"
  | "elem_tag"
  | "elem_note"
  | "value_length"
>;

export interface FieldControlProps {
  elemProp: ControlElement;
  value: FieldValue;
  behavior: ElemTagBehavior;
  onPatch: (patch: FieldValuePatch) => void;
}
