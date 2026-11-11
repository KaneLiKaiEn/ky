export interface ElemProp {
  section_id: number;
  row_id?: number;
  row_no?: number;
  elem_id: number;
  elem_name: string;
  elem_title: string | null;
  elem_unit?: string | null;
  elem_type?: string | null;
  value_type?: string | null;
  value_length?: number | null;
  elem_width?: string;
  elem_tag?: string;
  elem_note?: string;

  support_init?: boolean; // 是否支持初始化
}

export interface InitValue {
  visit_id: number;
  baby_id?: number;
  row_no?: number;
  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;
}

export interface LinkValue {
  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;
}

export interface ElemValue {
  section_id: number;
  /** 已配置元素时必有；未配置元素时可仅用 elem_name */
  elem_id?: number;
  elem_name?: string;
  row_no?: number;
  value_time?: string;
  value_score?: number;
  value_text: string;
  value_code?: string;
  value_code_system?: string;
  value_tag?: string;
  value_note?: string;
}

export interface DataElemRef {
  getElemValue: () => ElemValue;
  initElemValue: (initElemValue: InitValue) => void;
}

export interface FormContext {
  form_id?: number;
  org_id?: number;
  visit_id?: number;
  baby_id?: number;
  emr_id?: number;
}

export interface DataElemProps {
  elemProp: ElemProp;
  elemValue?: ElemValue;
  formContext?: FormContext;
  onElemValueChanged?: (
    section_id: ElemProp["section_id"],
    elem_id: ElemProp["elem_id"],
  ) => void;
}
