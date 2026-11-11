import { request } from "comm/request";

interface ApiResult {
  code: number;
  message: string;
}

export interface DealerRow {
  dealer_code?: string;
  dealer_name?: string;
}

export interface GetDealerListRes extends ApiResult {
  row_list?: DealerRow[];
}

/** 结算系统列表 */
export const getDealerListAPI = (params: { only_active?: boolean } = {}) =>
  request.post<GetDealerListRes>("settle/GetDealerList", params);

/** 医保状态、参保地、保险号（结算服务） */
export interface SettleServiceInfo extends ApiResult {
  service_name?: string;
  service_status?: string;
  service_note?: string;
  insurance_code?: string;
  insurance_no?: string;
  insurance_district?: string;
}

export const getSettleServiceInfoAPI = (params: {
  settle_type: string;
  patient_id: number;
}) =>
  request.post<SettleServiceInfo>("settle/GetSettleServiceInfo", params);

export interface SettleHandleInfo extends ApiResult {
  handle_id?: number;
  handle_no?: string;
  handle_tag?: string;
  handle_note?: string;
}

/** 获取结算登记信息（登记号） */
export const getSettleHandleInfoAPI = (params: {
  settle_type: string;
  patient_id: number;
}) => request.post<SettleHandleInfo>("settle/GetSettleHandleInfo", params);

/** 患者 / 就诊状态（结算方式、患者类型、医保展示字段） */
export interface StatusPropertyInfo {
  insurance_type?: string;
  insurance_name?: string;
  settle_type?: string;
  settle_name?: string;
  insurance_no?: string;
  insurance_code?: string;
  insurance_district?: string;
  service_status?: string;
  service_name?: string;
  service_note?: string;
  handle_no?: string;
}

/** @deprecated 使用 StatusPropertyInfo */
export type VisitStatusInfo = StatusPropertyInfo;

/** 就诊维度状态 */
export const getStatusPropertyAPI = (params: {
  visit_id: number;
  column_list?: string;
}) =>
  request.post<ApiResult & { status_property?: StatusPropertyInfo }>(
    "visit/GetStatusProperty",
    params,
  );

/** 患者维度状态（单独挂载面板时用于回填结算方式） */
export const getPatientStatusPropertyAPI = (params: {
  patient_id: number;
  column_list?: string;
}) =>
  request.post<ApiResult & { status_property?: StatusPropertyInfo }>(
    "patient/GetStatusProperty",
    params,
  );

export const getAreaPropertyAPI = (params: { area_id: number }) =>
  request.post<ApiResult & { area_property?: { area_name?: string } }>(
    "sys/GetAreaProperty",
    params,
  );
