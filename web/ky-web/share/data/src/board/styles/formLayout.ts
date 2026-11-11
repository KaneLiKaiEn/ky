import type { FormProps } from "antd";

/** Left label, right control. */
export const formLayout = {
  className: "bw-form",
  layout: "horizontal",
  colon: false,
  labelAlign: "right",
  wrapperCol: { flex: "auto" },
} satisfies Pick<
  FormProps,
  "className" | "layout" | "colon" | "labelAlign" | "wrapperCol"
>;
