import type { FormProps } from "antd";

/** Left label, right control. Shared by property panels and dialogs. */
export const formLayout = {
  className: "mw-form",
  layout: "horizontal",
  colon: false,
  labelAlign: "right",
  wrapperCol: { flex: "auto" },
} satisfies Pick<
  FormProps,
  "className" | "layout" | "colon" | "labelAlign" | "wrapperCol"
>;
