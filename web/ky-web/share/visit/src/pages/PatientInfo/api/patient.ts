import type { AxiosRequestConfig } from "axios";
import { request } from "comm/request";
import type {
  GetAddressListReq,
  GetAddressListRes,
  GetContactListReq,
  GetContactListRes,
  GetPatientAgeReq,
  GetPatientAgeRes,
  GetPatientNoReq,
  GetPatientNoRes,
  GetPatientPropertyReq,
  GetPatientPropertyRes,
  GetStatusPropertyReq,
  GetStatusPropertyRes,
  DeletePatientReq,
  DeletePatientRes,
  MergePatientListReq,
  MergePatientListRes,
  NewPatientReq,
  NewPatientRes,
  PreparePatientReq,
  PreparePatientRes,
  RetrievePatientList2Req,
  RetrievePatientList2Res,
  SaveAddressListReq,
  SaveAddressListRes,
  SaveContactListReq,
  SaveContactListRes,
  SavePatientPropertyReq,
  SavePatientPropertyRes,
  SaveStatusPropertyReq,
  SaveStatusPropertyRes,
  UpdateInsurancePropertyReq,
  UpdateInsurancePropertyRes,
} from "../types/patient";

/** 获取患者属性 */
export const getPatientPropertyAPI = (params: GetPatientPropertyReq) =>
  request.post<GetPatientPropertyRes>("patient/GetPatientProperty", params);

/** 获取患者最新状态 */
export const getStatusPropertyAPI = (params: GetStatusPropertyReq) =>
  request.post<GetStatusPropertyRes>("patient/GetStatusProperty", params);

/** 获取患者地址列表 */
export const getAddressListAPI = (params: GetAddressListReq) =>
  request.post<GetAddressListRes>("patient/GetAddressList", params);

/** 获取患者年龄信息 */
export const getPatientAgeAPI = (params: GetPatientAgeReq) =>
  request.post<GetPatientAgeRes>("patient/GetPatientAge", params);

/** 获取患者联系人列表 */
export const getContactListAPI = (params: GetContactListReq) =>
  request.post<GetContactListRes>("patient/GetContactList", params);

/** 获取 / 自动生成病案号 */
export const getPatientNoAPI = (params: GetPatientNoReq) =>
  request.post<GetPatientNoRes>("patient/GetPatientNo", params);

/** 保存患者属性 */
export const savePatientPropertyAPI = (params: SavePatientPropertyReq) =>
  request.post<SavePatientPropertyRes>("patient/SavePatientProperty", params);

/** 保存患者医保 / 状态属性 */
export const saveStatusPropertyAPI = (params: SaveStatusPropertyReq) =>
  request.post<SaveStatusPropertyRes>("patient/SaveStatusProperty", params);

/** 保存患者地址列表 */
export const saveAddressListAPI = (params: SaveAddressListReq) =>
  request.post<SaveAddressListRes>("patient/SaveAddressList", params);

/** 保存患者联系人列表 */
export const saveContactListAPI = (params: SaveContactListReq) =>
  request.post<SaveContactListRes>("patient/SaveContactList", params);

/** 检索患者列表 */
export const retrievePatientList2API = (params: RetrievePatientList2Req) =>
  request.post<RetrievePatientList2Res>("patient/RetrievePatientList2", params);

/** 新建患者 */
export const newPatientAPI = (params: NewPatientReq) =>
  request.post<NewPatientRes>("patient/NewPatient", params);

/** 建档前查重。业务码非 0 时由调用方决定是否继续建档，因此可跳过统一报错 */
export const preparePatientAPI = (
  params: PreparePatientReq,
  config?: AxiosRequestConfig,
) => request.post<PreparePatientRes>("empi/PreparePatient", params, config);

/** 合并查重命中的患者 */
export const mergePatientListAPI = (params: MergePatientListReq) =>
  request.post<MergePatientListRes>("empi/MergePatientList", params);

/** 删除患者 */
export const deletePatientAPI = (params: DeletePatientReq) =>
  request.post<DeletePatientRes>("patient/DeletePatient", params);

/** 刷卡更新医保身份 */
export const updateInsurancePropertyAPI = (
  params: UpdateInsurancePropertyReq,
) =>
  request.post<UpdateInsurancePropertyRes>(
    "patient/UpdateInsuranceProperty",
    params,
  );