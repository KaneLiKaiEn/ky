/** 与 patient.proto 对齐的类型定义（患者属性） */
import type { ApiResult } from "./comm";
/** patient/GetPatientProperty 请求 */
export interface GetPatientPropertyReq {
    /** 优先 */
    patient_id?: number;
    /** 其次 +orgid：优先根据 patient_no 查，然后再查 patient_ipno，最后再查 patient_opno, patient_xpno */
    patient_no?: string;
    /** 再次 patient_xid + patient_xid_system */
    patient_xid?: string;
    patient_xid_system?: string;
    column_list?: string;
    column_status?: string;
    column_address?: string;
    column_contact?: string;
    column_gp?: string;
    column_index?: string;
    column_ext?: string;
}
/**
 * visit 服务下的患者属性行（与 PatientRow 字段不完全一致）
 * 对应 visit.proto VisitPatientRow
 */
export interface VisitPatientRow {
    visit_id?: number;
    org_id?: number;
    patient_id?: number;
    patient_name?: string;
    patient_gender?: string;
    patient_idno?: string;
    patient_idno_system?: string;
    patient_telno?: string;
    patient_telno_system?: string;
    patient_email?: string;
    patient_info?: string;
    birth_date?: string;
    birth_time?: string;
    age_full?: string;
    age_year?: number;
    age_month?: number;
    age_day?: number;
    age_hour?: number;
    age_minute?: number;
    race_name?: string;
    race_code?: string;
    race_code_system?: string;
    kb_code?: string;
    input_time?: string;
    input_session?: string;
    input_note?: string;
}
/** visit/GetPatientProperty 请求（参数与 patient 服务不同） */
export interface VisitGetPatientPropertyReq {
    /** 优先 */
    visit_id?: number;
    /** 其次 +org_id */
    visit_no?: string;
    /** 允许为空；有值时作为条件 */
    visit_type?: string;
    column_list?: string;
}
/** visit/GetPatientProperty 仅返回 patient_property，其余需单独接口 */
export interface VisitGetPatientPropertyRes extends ApiResult {
    patient_property?: VisitPatientRow;
}
export interface PatientRow {
    patient_id?: number;
    baby_id?: number;
    /** 外部 ID */
    patient_xid?: string;
    patient_xid_system?: string;
    patient_name?: string;
    /** 脱敏姓名，姓** */
    patient_name_enc?: string;
    /** 男，女，未知 */
    patient_gender?: string;
    patient_idno?: string;
    patient_idno_system?: string;
    patient_telno?: string;
    patient_telno_system?: string;
    patient_email?: string;
    patient_tag?: string;
    patient_note?: string;
    /** 出生日期：YYYY-MM-DD 格式 */
    birth_date?: string;
    /** 出生时间：新生儿要到分钟，HH:MI */
    birth_time?: string;
    /** 生产方式：顺产、剖宫产、未知 */
    birth_type?: string;
    /** 民族 */
    race_name?: string;
    /** 民族代码 */
    race_code?: string;
    /** 民族代码标准, dict=GB/T 3304 */
    race_code_system?: string;
    /** 最新就诊 id */
    visit_id?: number;
    /** 最新就诊时间 */
    visit_time?: string;
    valid_status?: string;
    create_time?: string;
    /** ORG-医疗病人创建，PATIENT-自助创建，GP-家庭医生创建 */
    create_type?: string;
    create_session?: string;
    kb_code?: string;
    input_time?: string;
    input_session?: string;
    input_note?: string;
}
export interface PatientStatusRow {
    patient_id?: number;
    /** 保险类型: dict=insurance.type */
    insurance_type?: string;
    /** 保险类型名称 */
    insurance_name?: string;
    /** 保险号 */
    insurance_no?: string;
    /** 保险卡号 */
    insurance_code?: string;
    /** 参保地 */
    insurance_district?: string;
    insurance_tag?: string;
    insurance_note?: string;
    /** 结算类型：settle.GetActiveDealerList */
    settle_type?: string;
    /** 结算名称：settle.GetActiveDealerList */
    settle_name?: string;
    settle_tag?: string;
    settle_note?: string;
    service_code?: string;
    service_name?: string;
    service_status?: string;
    service_tag?: string;
    service_note?: string;
    /** 国籍 */
    country_name?: string;
    country_code?: string;
    /** dict=GB/T 2659.1 */
    country_code_system?: string;
    /** 文化程度 */
    edu_name?: string;
    edu_code?: string;
    /** dict=GB/T 4658-2006 */
    edu_code_system?: string;
    /** 职业 */
    work_name?: string;
    work_code?: string;
    /** dict=GB/T 6565 */
    work_code_system?: string;
    /** 工作单位 */
    work_org?: string;
    /** 职务 */
    work_title?: string;
    /** 参加工作日期 */
    work_start?: string;
    /** 退休日期 */
    work_end?: string;
    work_telno?: string;
    /** 婚姻状态 */
    marital_name?: string;
    marital_code?: string;
    /** dict=GB/T 2261.2 */
    marital_code_system?: string;
    /** 语种 */
    lang_name?: string;
    lang_code?: string;
    /** dict=GB/T 4880.1 */
    lang_code_system?: string;
    /** 信仰 */
    faith_name?: string;
    faith_code?: string;
    /** dict=patient_status.faith */
    faith_code_system?: string;
    /** ABO 血型, A, B, AB, O */
    blood_abo?: string;
    /** RH 血型, 阴性，阳性 */
    blood_rh?: string;
    /** 身高 */
    body_height?: number;
    /** 体重 */
    body_weight?: string;
    /** bmi */
    body_bmi?: string;
    /** 患者类型：军人、地方 dict=patient_status.patient_type */
    patient_type?: string;
    /** 患者标识：[保健对象][一级] dict=patient_status.patient_tag */
    patient_tag?: string;
    /** 合作单位 */
    partner_id?: number;
    partner_name?: string;
    death_date?: string;
    death_time?: string;
    death_place?: string;
    /** 死亡疾病 */
    death_disease?: string;
    /** 主诊断 */
    death_diag_name?: string;
    /** 主诊断代码 */
    death_diag_code?: string;
    /** dict=GB/T 14396-2016 */
    death_diag_code_system?: string;
    input_time?: string;
    input_session?: string;
    input_note?: string;
}
export interface PatientAddressRow {
    address_id?: number;
    patient_id?: number;
    /** 地址类型：dict=CV02.01.205,联系地址，户籍地址，籍贯，出生地址 */
    address_type?: string;
    /** 地址全称 */
    address_full?: string;
    /** 国家或地区， dict=GB/T 2659.1 */
    address_nation?: string;
    /** 国家或地区， dict=GB/T 2659.1 */
    address_nation_code?: string;
    /** 省自治区直辖市 */
    address_state?: string;
    /** 省自治区直辖市 */
    address_state_code?: string;
    /** 城市，旗 */
    address_city?: string;
    /** 城市，旗 */
    address_city_code?: string;
    /** 区、县 */
    address_county?: string;
    /** 区、县 */
    address_county_code?: string;
    /** 乡镇、街道 */
    address_town?: string;
    /** 乡镇、街道 */
    address_town_code?: string;
    /** 村，居委会 */
    address_village?: string;
    /** 村，居委会 */
    address_village_code?: string;
    /** 道路名 */
    address_road_name?: string;
    /** 路牌号 */
    address_road_no?: string;
    /** 门牌号 */
    address_house?: string;
    /** 详细描述 */
    address_detail?: string;
    /** 邮编 */
    address_post?: string;
    /** 行政区划代码 */
    address_district?: string;
    /** 归属：patient_address.address_location, 城镇、农村 */
    address_location?: string;
    /** 经度 */
    address_long?: number;
    /** 纬度 */
    address_lat?: number;
    /** 经纬度坐标系，patient_address.address_map, WGS84 */
    address_map?: string;
    sort_no?: string;
    valid_status?: string;
    input_time?: string;
    input_session?: string;
    input_note?: string;
}
export interface PatientContactRow {
    contact_id?: number;
    patient_id?: number;
    contact_name?: string;
    contact_telno?: string;
    /** 联系人关系 */
    contact_kinship?: string;
    contact_tag?: string;
    /** 证件号码 */
    contact_idno?: string;
    /** 证件类型, dict=CV02.01.101 */
    contact_idno_system?: string;
    /** 工作单位 */
    contact_org?: string;
    /** 联系地址 */
    contact_address?: string;
    contact_note?: string;
    sort_no?: string;
    valid_status?: string;
    input_time?: string;
    input_session?: string;
    input_note?: string;
}
export interface PatientGpRow {
    row_id?: number;
    patient_id?: number;
    doctor_id?: number;
    /** 身份证号 */
    doctor_no?: string;
    doctor_name?: string;
    doctor_level?: string;
    doctor_tag?: string;
    doctor_note?: string;
    /** 执照号码 */
    license_no?: string;
    /** 发证日期 */
    license_date?: string;
    /** 发证单位 */
    license_issuer?: string;
    license_tag?: string;
    license_note?: string;
    /** 执业机构 */
    license_org_id?: number;
    /** 执业机构 */
    license_org_name?: string;
    sort_no?: string;
    valid_status?: string;
    valid_start?: string;
    valid_end?: string;
    input_time?: string;
    input_session?: string;
    input_note?: string;
}
export interface PatientIndexRow {
    row_id?: number;
    patient_id?: number;
    /** 机构 ID，0-机构无关 */
    org_id?: number;
    /** 代码系统 */
    index_code?: string;
    index_name?: string;
    index_value?: string;
    index_tag?: string;
    index_note?: string;
    sort_no?: string;
    kb_code?: string;
    valid_status?: string;
    valid_start?: string;
    valid_end?: string;
    input_time?: string;
    input_session?: string;
    input_note?: string;
}
export interface PatientExtRow {
    row_id?: number;
    patient_id?: number;
    /** 机构 ID，0-机构无关 */
    org_id?: number;
    item_code?: string;
    item_name?: string;
    item_unit?: string;
    item_value?: string;
    /** int */
    item_value_int?: number;
    /** decimal */
    item_value_dec?: string;
    item_tag?: string;
    item_note?: string;
    sort_no?: string;
    valid_status?: string;
    valid_start?: string;
    valid_end?: string;
    input_time?: string;
    input_session?: string;
    input_note?: string;
}
export interface GetPatientPropertyRes extends ApiResult {
    patient_property?: PatientRow;
    /** column_status 有值时返回 */
    status_property?: PatientStatusRow;
    /** column_address 有值时返回 */
    address_list?: PatientAddressRow[];
    /** column_contact 有值时返回 */
    contact_list?: PatientContactRow[];
    /** column_gp 有值时返回 */
    gp_list?: PatientGpRow[];
    /** column_index 有值时返回 */
    index_list?: PatientIndexRow[];
    /** column_ext 有值时返回 */
    ext_list?: PatientExtRow[];
}
/** 患者最新状态 */
export interface GetStatusPropertyReq {
    patient_id?: number;
    /** visit 服务下按就诊记录查询 */
    visit_id?: number;
    visit_no?: string;
    visit_type?: string;
    column_list?: string;
}
export interface GetStatusPropertyRes extends ApiResult {
    status_property?: PatientStatusRow;
}
/** 地址列表 */
export interface GetAddressListReq {
    patient_id?: number;
    /** visit 服务下按就诊记录查询 */
    visit_id?: number;
    visit_no?: string;
    visit_type?: string;
    /** 地址类型，或 * */
    address_type?: string;
    column_list?: string;
}
export interface GetAddressListRes extends ApiResult {
    address_list?: PatientAddressRow[];
}
/** 年龄信息 */
export interface GetPatientAgeReq {
    patient_id?: number;
    /** visit 服务下按就诊记录查询 */
    visit_id?: number;
    visit_no?: string;
    visit_type?: string;
    /** empty=now */
    end_time?: string;
}
export interface GetPatientAgeRes extends ApiResult {
    age_year?: number;
    age_month?: number;
    age_day?: number;
    age_hour?: number;
    age_minute?: number;
    total_month?: number;
    total_week?: number;
    total_day?: number;
    total_hour?: number;
    total_minute?: number;
}
/** 患者联系人列表 */
export interface GetContactListReq {
    patient_id?: number;
    /** visit 服务下按就诊记录查询 */
    visit_id?: number;
    visit_no?: string;
    visit_type?: string;
    column_list?: string;
}
export interface GetContactListRes extends ApiResult {
    contact_list?: PatientContactRow[];
}
/** 保存患者属性 */
export interface SavePatientPropertyReq {
    patient_id?: number;
    /** visit 服务下按就诊记录保存 */
    visit_id?: number;
    patient_property?: PatientRow;
}
export interface SavePatientPropertyRes extends ApiResult {
}
/** 保存患者医保 / 状态属性 */
export interface SaveStatusPropertyReq {
    patient_id?: number;
    /** visit 服务下按就诊记录保存 */
    visit_id?: number;
    status_property?: PatientStatusRow;
}
export interface SaveStatusPropertyRes extends ApiResult {
}
/** 保存地址数据 */
export interface PatientAddressData {
    address_id?: number;
    patient_id?: number;
    /** 地址类型：dict=CV02.01.205,联系地址，户籍地址，籍贯，出生地址 */
    address_type?: string;
    /** 地址全称 */
    address_full?: string;
    /** 国家或地区， dict=GB/T 2659.1 */
    address_nation?: string;
    /** 国家或地区， dict=GB/T 2659.1 */
    address_nation_code?: string;
    /** 省自治区直辖市 */
    address_state?: string;
    /** 省自治区直辖市 */
    address_state_code?: string;
    /** 城市，旗 */
    address_city?: string;
    /** 城市，旗 */
    address_city_code?: string;
    /** 区、县 */
    address_county?: string;
    /** 区、县 */
    address_county_code?: string;
    /** 乡镇、街道 */
    address_town?: string;
    /** 乡镇、街道 */
    address_town_code?: string;
    /** 村，居委会 */
    address_village?: string;
    /** 村，居委会 */
    address_village_code?: string;
    /** 道路名 */
    address_road_name?: string;
    /** 路牌号 */
    address_road_no?: string;
    /** 门牌号 */
    address_house?: string;
    /** 详细描述 */
    address_detail?: string;
    /** 邮编 */
    address_post?: string;
    /** 行政区划代码 */
    address_district?: string;
    /** 归属：dict=patient_address.address_location, 城镇、农村 */
    address_location?: string;
    /** 经度 */
    address_long?: number;
    /** 纬度 */
    address_lat?: number;
    /** 经纬度坐标系，dict=patient_address.address_map, WGS84 */
    address_map?: string;
    sort_no?: string;
    valid_status?: string;
    input_time?: string;
    input_session?: string;
    input_note?: string;
}
/** 保存地址列表 */
export interface SaveAddressListReq {
    patient_id?: number;
    /** visit 服务下按就诊记录保存 */
    visit_id?: number;
    /** 先删除的地址类型，或 * */
    address_type?: string;
    address_list?: PatientAddressData[];
}
export interface SaveAddressListRes extends ApiResult {
}
/** 保存联系人数据 */
export interface PatientContactData {
    contact_id?: number;
    patient_id?: number;
    contact_name?: string;
    contact_telno?: string;
    /** 联系人关系 */
    contact_kinship?: string;
    contact_tag?: string;
    /** 证件号码 */
    contact_idno?: string;
    /** 证件类型, dict=CV02.01.101 */
    contact_idno_system?: string;
    /** 工作单位 */
    contact_org?: string;
    /** 联系地址 */
    contact_address?: string;
    contact_note?: string;
    sort_no?: string;
    valid_status?: string;
    input_time?: string;
    input_session?: string;
    input_note?: string;
}
/** 保存联系人列表 */
export interface SaveContactListReq {
    patient_id?: number;
    /** visit 服务下按就诊记录保存 */
    visit_id?: number;
    contact_list?: PatientContactData[];
}
export interface SaveContactListRes extends ApiResult {
}
export interface GetPatientNoReq {
    org_id?: number;
    patient_id?: number;
    auto_build?: boolean;
    visit_type?: string;
}
export interface GetPatientNoRes extends ApiResult {
    patient_no?: string;
    patient_opno?: string;
    patient_ipno?: string;
    patient_xpno?: string;
}
export interface RetrievePatientList2Req {
    retrieve_input?: string;
    retrieve_limit?: number;
    column_list?: string;
}
export interface RetrievePatientList2Res extends ApiResult {
    patient_list?: PatientRow[];
}
