import { request } from "comm/request";
import type {
  AttachPatientRes,
  CardPatientActionReq,
  DetachPatientRes,
  GetActiveReaderListRes,
  GetCardLostListReq,
  GetCardLostListRes,
  GetCardTypeListRes,
  GetOrgReaderListReq,
  GetOrgReaderListRes,
  GetPatientCardListReq,
  GetPatientCardListRes,
  GetPatientInfoRes,
  GetReaderCardTypeListReq,
  GetReaderPatientInfoReq,
  LostCardRes,
} from "../types/card";

/** 激活的读卡器列表 */
export const getActiveReaderListAPI = () =>
  request.post<GetActiveReaderListRes>("card/GetActiveReaderList", {});

/** 读卡器支持的卡类型列表 */
export const getReaderCardTypeListAPI = (params: GetReaderCardTypeListReq) =>
  request.post<GetCardTypeListRes>("card/GetReaderCardTypeList", params);

/** 读卡器读取患者信息 */
export const getReaderPatientInfoAPI = (params: GetReaderPatientInfoReq) =>
  request.post<GetPatientInfoRes>("card/GetReaderPatientInfo", params);

/** 患者卡列表 */
export const getPatientCardListAPI = (params: GetPatientCardListReq) =>
  request.post<GetPatientCardListRes>("card/GetPatientCardList", params);

/** 挂失卡列表 */
export const getCardLostListAPI = (params: GetCardLostListReq) =>
  request.post<GetCardLostListRes>("card/GetCardLostList", params);

/** 机构可用读卡器，发卡时作为卡类型 */
export const getOrgReaderListAPI = (params: GetOrgReaderListReq) =>
  request.post<GetOrgReaderListRes>("card/GetOrgReaderList", params);

/** 绑定就诊卡 */
export const attachPatientAPI = (params: CardPatientActionReq) =>
  request.post<AttachPatientRes>("card/AttachPatient", params);

/** 解绑就诊卡 */
export const detachPatientAPI = (params: CardPatientActionReq) =>
  request.post<DetachPatientRes>("card/DetachPatient", params);

/** 挂失就诊卡 */
export const lostCardAPI = (params: CardPatientActionReq) =>
  request.post<LostCardRes>("card/LostCard", params);
