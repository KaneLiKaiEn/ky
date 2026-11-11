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