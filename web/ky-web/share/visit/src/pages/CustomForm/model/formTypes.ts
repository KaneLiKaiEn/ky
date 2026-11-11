import type { ElemValue, LinkValue } from "./elementTypes";

export interface FormProperty {
  form_id: number;
  form_version?: number;
  visit_id: number;
  baby_id?: number;
  emr_id?: number;
}

export interface AssessResult {
  assess_system: string;
  assess_method: string;
  assess_total: number;
  assess_score: number;
  assess_result: string;
  assess_next: number | null;
  assess_color: string;
  assess_tag: string;
  assess_note: string;
  problem_type?: string;
  problem_id?: number;
  problem_name?: string;
}

/** 已有病历 GetEmrProperty 的评估快照。不含 assess_next（EMR 为时间字符串，表单侧为小时数）。 */
export interface InitialAssess {
  assess_score?: number;
  assess_result?: string;
  assess_color?: string;
  assess_tag?: string;
  assess_note?: string;
  problem_type?: string;
  problem_id?: number;
  problem_name?: string;
}

export interface FormRef {
  getFormValues: () => ElemValue[];
  initFormValue: (initFormValue: LinkValue) => void;
  getFormAssess: () => AssessResult;
  /** 保存病历前调用：SectionCode 侧效应（如体征 NewObserve） */
  saveFormExtras: () => Promise<void>;
}

export interface FormProps {
  formProp: FormProperty;
  formValues?: ElemValue[];
  /** 病历头所选时间，格式 YYYY-MM-DD HH:mm:ss */
  recordTime?: string;
  initialAssess?: InitialAssess;
  onFormValueChanged?: (section_id: number, elem_id: number) => void;
  onReady?: () => void;
}
