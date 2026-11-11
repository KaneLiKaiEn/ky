import { request } from "comm/request";
import type {
  CancelAdmissionReq,
  CancelAdmissionRes,
  GetAdmissionListReq,
  GetAdmissionListRes,
  RegAdmissionReq,
  RegAdmissionRes,
  UndoRegAdmissionReq,
  UndoRegAdmissionRes,
} from "../types/appoint";

/** 获取入院列表 */
export const getAdmissionListAPI = (params: GetAdmissionListReq) =>
  request.post<GetAdmissionListRes>("appoint/GetAdmissionList", params);

/** 入院办理 */
export const regAdmissionAPI = (params: RegAdmissionReq) =>
  request.post<RegAdmissionRes>("appoint/RegAdmission", params);

/** 取消住院 */
export const cancelAdmissionAPI = (params: CancelAdmissionReq) =>
  request.post<CancelAdmissionRes>("appoint/CancelAdmission", params);

/** 撤销住院登记 */
export const undoRegAdmissionAPI = (params: UndoRegAdmissionReq) =>
  request.post<UndoRegAdmissionRes>("appoint/UndoRegAdmission", params);
