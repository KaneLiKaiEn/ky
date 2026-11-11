import { cloneElement, type ReactElement } from "react";
import { Form, type FormItemProps } from "antd";

interface EditableCellProps {
  name: FormItemProps["name"];
  label: string;
  rules?: FormItemProps["rules"];
  disabled?: boolean;
  children: ReactElement<{ disabled?: boolean; "aria-label"?: string }>;
}

export type EditableControl = EditableCellProps["children"];

/** Shared field binding keeps table validation and accessible names consistent. */
export default function EditableCell({
  name,
  label,
  rules,
  disabled,
  children,
}: EditableCellProps) {
  return (
    <Form.Item name={name} rules={rules} className="organization-editable-cell">
      {cloneElement(children, { disabled, "aria-label": label })}
    </Form.Item>
  );
}
