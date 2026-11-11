import { request } from "comm/request";
import type {
  GetActiveReaderListRes,
  GetCardLostListReq,
  GetCardLostListRes,
  GetCardTypeListRes,
  GetPatientCardListReq,
  GetPatientCardListRes,
  GetPatientInfoRes,
  GetReaderCardTypeListReq,
  GetReaderPatientInfoReq,
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
