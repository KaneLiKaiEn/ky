export interface ObserveRow {
  observe_id?: number;
  org_id?: number;
  patient_id?: number;
  visit_id?: number;
  baby_id?: number;
  care_id?: number;
  user_id?: number;
  user_name?: string;

  elem_id?: number;
  elem_code?: string;
  elem_name?: string;
  elem_unit?: string;

  observe_time?: string;
  observe_value?: string;
  observe_value_int?: number;
  observe_value_dec?: string;
  observe_value_tip?: string;
  observe_duration?: number;

  observe_body?: string;
  observe_method?: string;
  observe_device?: string;
  observe_app?: string;
  observe_tag?: string;
  observe_note?: string;
  observe_status?: string;

  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;

  commit_time?: string;
  commit_session?: string;
  commit_note?: string;

  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface VisitValueRow {
  value_id?: number;
  org_id?: number;
  visit_id?: number;
  baby_id?: number;

  link_name?: string;
  link_value?: number;
  link_data?: string;
  link_tag?: string;
  link_ext?: string;

  entry_id?: number;
  section_id?: number;
  row_id?: string;
  row_no?: number;
  serial_no?: number;
  elem_id?: number;
  elem_code?: string;
  elem_name?: string;
  elem_version?: number;

  value_time?: string;
  value_score?: number;
  value_text?: string;
  value_code?: string;
  value_code_system?: string;
  value_tag?: string;
  value_note?: string;
  value_int?: number;
  value_dec?: string;
  value_tip?: string;

  input_time?: string;
  input_session?: string;
  input_note?: string;
}

export interface VitalColumn {
  elem_name: string;
  item_unit?: string;
  item_tag?: string;
}
