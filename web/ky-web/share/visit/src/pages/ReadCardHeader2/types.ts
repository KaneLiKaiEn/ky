import type { ReadCardHeaderProps } from "../ReadCardHeader/types";

export type IpPatientStatus = "in" | "out";

export type VisitDateRange = [string, string];

export interface IpPatientListRow {
  visit_id?: number;
  patient_id?: number;
  patient_name?: string;
  dept_name?: string;
  doctor_name?: string;
  nurse_name?: string;
  admission_dept_name?: string;
  bed_name?: string;
  room_no?: string;
  diag_name?: string;
}

export interface ReadCardHeader2Props extends ReadCardHeaderProps {
  /** 无患者时是否展示「在院 / 出院」，默认 true */
  showIpPatientPicker?: boolean;
  /** 从在院/出院列表选中后的回调（含 visit_id，便于业务定位就诊） */
  onIpPatientSelect?: (row: IpPatientListRow) => void;
}
