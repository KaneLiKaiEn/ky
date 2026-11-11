import type { GetAddressListReq, GetAddressListRes, GetContactListReq, GetContactListRes, GetPatientAgeReq, GetPatientAgeRes, GetStatusPropertyReq, GetStatusPropertyRes, SaveAddressListReq, SaveAddressListRes, SaveContactListReq, SaveContactListRes, SavePatientPropertyReq, SavePatientPropertyRes, SaveStatusPropertyReq, SaveStatusPropertyRes, VisitGetPatientPropertyReq, VisitGetPatientPropertyRes } from "../types/patient";
import type { GetVisitListReq, GetVisitListRes } from "../types/visit";
/** 获取就诊列表 */
export declare const getVisitListAPI: (params: GetVisitListReq) => Promise<GetVisitListRes>;
/** 获取就诊患者属性（仅返回 patient_property） */
export declare const getPatientPropertyAPI: (params: VisitGetPatientPropertyReq) => Promise<VisitGetPatientPropertyRes>;
/** 获取患者最新状态 */
export declare const getStatusPropertyAPI: (params: GetStatusPropertyReq) => Promise<GetStatusPropertyRes>;
/** 获取患者地址列表 */
export declare const getAddressListAPI: (params: GetAddressListReq) => Promise<GetAddressListRes>;
/** 获取患者年龄信息 */
export declare const getPatientAgeAPI: (params: GetPatientAgeReq) => Promise<GetPatientAgeRes>;
/** 获取患者联系人列表 */
export declare const getContactListAPI: (params: GetContactListReq) => Promise<GetContactListRes>;
/** 保存患者属性 */
export declare const savePatientPropertyAPI: (params: SavePatientPropertyReq) => Promise<SavePatientPropertyRes>;
/** 保存患者医保 / 状态属性 */
export declare const saveStatusPropertyAPI: (params: SaveStatusPropertyReq) => Promise<SaveStatusPropertyRes>;
/** 保存患者地址列表 */
export declare const saveAddressListAPI: (params: SaveAddressListReq) => Promise<SaveAddressListRes>;
/** 保存患者联系人列表 */
export declare const saveContactListAPI: (params: SaveContactListReq) => Promise<SaveContactListRes>;
