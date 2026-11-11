import type { SourceKind } from "./types";

export const FORM_LAYOUT = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 },
};

/** 系统级字典对应的虚拟机构 */
export const SYSTEM_ORG = { org_id: 0, org_name: "系统" };

export const SOURCE_KIND_OPTIONS: { value: SourceKind; label: string }[] = [
  { value: "elem", label: "数据元" },
  { value: "drug", label: "药品" },
  { value: "lab", label: "检验" },
  { value: "exam", label: "检查" },
  { value: "treat", label: "治疗" },
  { value: "bill", label: "收费" },
];

export const DEFAULT_SOURCE: SourceKind = "elem";

export const RETRIEVE_LIMIT = 20;

export const SEARCH_DEBOUNCE_MS = 300;
