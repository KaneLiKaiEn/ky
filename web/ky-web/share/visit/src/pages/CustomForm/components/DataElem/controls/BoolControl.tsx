import { Checkbox, Input } from "antd";
import type { FieldControlProps } from "./types";

const resolveLabel = (title: string | null, name: string): string =>
  title === "null" || title === "" || title == null ? name : title;

export const BoolControl = ({ elemProp, value, behavior, onPatch }: FieldControlProps) => {
  const checked = value.value_code === "1";
  const showNote =
    elemProp.value_type === "BOOL_NOTE" ||
    (elemProp.value_type === "BOOL0_NOTE" && !checked) ||
    (elemProp.value_type === "BOOL1_NOTE" && checked);
  return (
    <div className={`flex items-center px-2 flex-1 min-h-8${elemProp.value_type === "BOOL" ? "" : " gap-2"}`}>
      <Checkbox
        checked={checked}
        disabled={behavior.isReadOnly}
        onChange={(event) => {
          const next = event.target.checked ? "1" : "0";
          onPatch({ value_code: next, value_text: next });
        }}
      >
        {resolveLabel(elemProp.elem_title, elemProp.elem_name)}
      </Checkbox>
      {showNote ? (
        <Input
          value={value.value_note ?? ""}
          readOnly={behavior.isReadOnly}
          onChange={(event) => onPatch({ value_note: event.target.value })}
          style={{ flex: 1 }}
        />
      ) : null}
    </div>
  );
};
