/** 与 visit.proto（GetVisitList）对齐的类型定义 */
import type { ApiResult } from "./comm";
/** 就诊类型：O-门诊 E-急诊 I-住院 */
export type VisitTypeCode = "O" | "E" | "I" | string;
/**
 * 就诊状态
 * VISIT: 就诊 / OBSERVE: 留观 / FINISH: 完成就诊
 * ADMISSION: 入院 / DISCHARGE: 出院 / CANCEL: 作废
 */
export type VisitStatusCode = "VISIT" | "OBSERVE" | "FINISH" | "ADMISSION" | "DISCHARGE" | "CANCEL" | string;
/** 就诊主表行 */
export interface VisitRow {
    visit_id?: number;
    patient_id?: number;
    patient_no?: string;
    patient_xid?: string;
    org_id?: number;
    org_name?: string;
    dept_id?: number;
    dept_name?: string;
    /** O-门诊 E-急诊 I-住院 */
    visit_type?: VisitTypeCode;
    /** 就诊号，人读，机构唯一 */
    visit_no?: string;
    /** 就诊类型的就诊次数 */
    visit_serial?: number;
    visit_time?: string;
    visit_tag?: string;
    visit_status?: VisitStatusCode;
    visit_info?: string;
    diag_info?: string;
    link_name?: string;
    link_value?: number;
    link_tag?: string;
    link_data?: string;
    link_ext?: string;
    create_time?: string;
    create_session?: string;
    create_note?: string;
    input_time?: string;
    input_session?: string;
    input_note?: string;
}
/** 门诊扩展行（与 visit_id 关联） */
export interface VisitOpRow {
    visit_id?: number;
    /** 预约 ID */
    appoint_id?: number;
    /** 初诊，复诊，随访，体检，开药 */
    visit_type?: string;
    /** 挂号类型 id */
    reg_id?: number;
    /** 挂号类型名称 */
    reg_name?: string;
    /** 挂号类型标识：[中医][特需] */
    reg_tag?: string;
    reg_note?: string;
    /** 首诊类型：DOCTOR-医生，MDT-多学科会诊 */
    entity_type?: string;
    entity_id?: number;
    entity_name?: string;
    entity_level?: string;
    /** 就诊类型：初诊、复诊 */
    clinic_type?: string;
    clinic_tag?: string;
    clinic_note?: string;
    input_time?: string;
    input_session?: string;
    input_note?: string;
}
/** 急诊扩展行（与 visit_id 关联） */
export interface VisitEpRow {
    visit_id?: number;
    /** 院前急救 */
    emergency_id?: number;
    /** 急诊挂号 */
    appoint_id?: number;
    /** 挂号类型 id */
    reg_id?: number;
    reg_name?: string;
    /** 挂号类型标识：[中医][特需] */
    reg_tag?: string;
    reg_note?: string;
    /** 首诊类型：DOCTOR-医生 */
    entity_type?: string;
    entity_id?: number;
    entity_name?: string;
    entity_level?: string;
    /** 就诊类型：初诊、复诊 */
    clinic_type?: string;
    clinic_tag?: string;
    clinic_note?: string;
    input_time?: string;
    input_session?: string;
    input_note?: string;
}
/** 住院扩展行（与 visit_id 关联） */
export interface VisitIpRow {
    visit_id?: number;
    appoint_id?: number;
    clinic_id?: number;
    clinic_type?: string;
    reg_time?: string;
    reg_session?: string;
    reg_tag?: string;
    reg_note?: string;
    admission_time?: string;
    admission_type?: string;
    admission_type_code?: string;
    admission_level?: string;
    admission_level_code?: string;
    admission_dept_id?: number;
    admission_dept_name?: string;
    admission_ward_id?: number;
    admission_ward_name?: string;
    admission_session?: string;
    admission_tag?: string;
    admission_note?: string;
    ward_id?: number;
    ward_name?: string;
    room_id?: number;
    room_no?: string;
    bed_id?: number;
    bed_no?: string;
    bed_service?: number;
    doctor_id?: number;
    doctor_name?: string;
    doctor_level?: string;
    doctor_group_id?: number;
    doctor_group_name?: string;
    nurse_id?: number;
    nurse_name?: string;
    nurse_level?: string;
    nurse_group_id?: number;
    nurse_group_name?: string;
    discharge_time?: string;
    discharge_session?: string;
    discharge_tag?: string;
    discharge_note?: string;
    sort_no?: string;
    input_time?: string;
    input_session?: string;
    input_note?: string;
}
/** visit/GetVisitList 请求 */
export interface GetVisitListReq {
    patient_id?: number;
    include_cancel?: boolean;
    include_empi?: boolean;
    /** [O][E][I]，* 表示全部 */
    visit_type?: string;
    visit_start?: string;
    visit_end?: string;
    org_id?: number;
    dept_id?: number;
    column_list?: string;
    column_op?: string;
    column_ep?: string;
    column_ip?: string;
    /** 每页记录数，0=不分页 */
    page_size?: number;
    /** 获取第几页；page_size>0 且 page_no=0 时只返回 page_count */
    page_no?: number;
    /** 获取记录数限制，0=不限制；有分页时忽略 */
    row_limit?: number;
}
/** visit/GetVisitList 响应 */
export interface GetVisitListRes extends ApiResult {
    page_count?: number;
    visit_list?: VisitRow[];
    op_list?: VisitOpRow[];
    ep_list?: VisitEpRow[];
    ip_list?: VisitIpRow[];
}
