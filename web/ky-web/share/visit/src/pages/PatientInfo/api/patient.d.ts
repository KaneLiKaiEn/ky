import type { GetAddressListReq, GetAddressListRes, GetContactListReq, GetContactListRes, GetPatientAgeReq, GetPatientAgeRes, GetPatientNoReq, GetPatientNoRes, GetPatientPropertyReq, GetPatientPropertyRes, GetStatusPropertyReq, GetStatusPropertyRes, RetrievePatientList2Req, RetrievePatientList2Res, SaveAddressListReq, SaveAddressListRes, SaveContactListReq, SaveContactListRes, SavePatientPropertyReq, SavePatientPropertyRes, SaveStatusPropertyReq, SaveStatusPropertyRes } from "../types/patient";
/** 获取患者属性 */
export declare const getPatientPropertyAPI: (params: GetPatientPropertyReq) => Promise<GetPatientPropertyRes>;
/** 获取患者最新状态 */
export declare const getStatusPropertyAPI: (params: GetStatusPropertyReq) => Promise<GetStatusPropertyRes>;
/** 获取患者地址列表 */
export declare const getAddressListAPI: (params: GetAddressListReq) => Promise<GetAddressListRes>;
/** 获取患者年龄信息 */
export declare const getPatientAgeAPI: (params: GetPatientAgeReq) => Promise<GetPatientAgeRes>;
/** 获取患者联系人列表 */
export declare const getContactListAPI: (params: GetContactListReq) => Promise<GetContactListRes>;
/** 获取 / 自动生成病案号 */
export declare const getPatientNoAPI: (params: GetPatientNoReq) => Promise<GetPatientNoRes>;
/** 保存患者属性 */
export declare const savePatientPropertyAPI: (params: SavePatientPropertyReq) => Promise<SavePatientPropertyRes>;
/** 保存患者医保 / 状态属性 */
export declare const saveStatusPropertyAPI: (params: SaveStatusPropertyReq) => Promise<SaveStatusPropertyRes>;
/** 保存患者地址列表 */
export declare const saveAddressListAPI: (params: SaveAddressListReq) => Promise<SaveAddressListRes>;
/** 保存患者联系人列表 */
export declare const saveContactListAPI: (params: SaveContactListReq) => Promise<SaveContactListRes>;
/** 检索患者列表 */
export declare const retrievePatientList2API: (params: RetrievePatientList2Req) => Promise<RetrievePatientList2Res>;
