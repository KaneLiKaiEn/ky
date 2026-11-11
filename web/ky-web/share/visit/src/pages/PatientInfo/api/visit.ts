import { request } from "comm/request";
import type {
  GetAddressListReq,
  GetAddressListRes,
  GetContactListReq,
  GetContactListRes,
  GetPatientAgeReq,
  GetPatientAgeRes,
  GetStatusPropertyReq,
  GetStatusPropertyRes,
  SaveAddressListReq,
  SaveAddressListRes,
  SaveContactListReq,
  SaveContactListRes,
  SavePatientPropertyReq,
  SavePatientPropertyRes,
  SaveStatusPropertyReq,
  SaveStatusPropertyRes,
  VisitGetPatientPropertyReq,
  VisitGetPatientPropertyRes,
  VisitUpdateInsurancePropertyReq,
  VisitUpdateInsurancePropertyRes,
} from "../types/patient";
import type { GetVisitListReq, GetVisitListRes } from "../types/visit";

/** 获取就诊列表 */
export const getVisitListAPI = (params: GetVisitListReq) =>
  request.post<GetVisitListRes>("visit/GetVisitList", params);

/** 获取就诊患者属性（仅返回 patient_property） */
export const getPatientPropertyAPI = (params: VisitGetPatientPropertyReq) =>
  request.post<VisitGetPatientPropertyRes>("visit/GetPatientProperty", params);

/** 获取患者最新状态 */
export const getStatusPropertyAPI = (params: GetStatusPropertyReq) =>
  request.post<GetStatusPropertyRes>("visit/GetStatusProperty", params);

/** 获取患者地址列表 */
export const getAddressListAPI = (params: GetAddressListReq) =>
  request.post<GetAddressListRes>("visit/GetAddressList", params);

/** 获取患者年龄信息 */
export const getPatientAgeAPI = (params: GetPatientAgeReq) =>
  request.post<GetPatientAgeRes>("visit/GetPatientAge", params);

/** 获取患者联系人列表 */
export const getContactListAPI = (params: GetContactListReq) =>
  request.post<GetContactListRes>("visit/GetContactList", params);

/** 保存患者属性 */
export const savePatientPropertyAPI = (params: SavePatientPropertyReq) =>
  request.post<SavePatientPropertyRes>("visit/SavePatientProperty", params);

/** 保存患者医保 / 状态属性 */
export const saveStatusPropertyAPI = (params: SaveStatusPropertyReq) =>
  request.post<SaveStatusPropertyRes>("visit/SaveStatusProperty", params);

/** 保存患者地址列表 */
export const saveAddressListAPI = (params: SaveAddressListReq) =>
  request.post<SaveAddressListRes>("visit/SaveAddressList", params);

/** 保存患者联系人列表 */
export const saveContactListAPI = (params: SaveContactListReq) =>
  request.post<SaveContactListRes>("visit/SaveContactList", params);

/** 刷卡更新医保身份（就诊维度） */
export const updateInsurancePropertyAPI = (
  params: VisitUpdateInsurancePropertyReq,
) =>
  request.post<VisitUpdateInsurancePropertyRes>(
    "visit/UpdateInsuranceProperty",
    params,
  );
