import type {
  RetrieveDict2ItemListReq,
  RetrieveDict2ItemListRes,
} from "@/types/sys";
import { request } from "comm/request";

export const getSessionInfoAPI = (params: any) =>
  request.post<any>("auth/GetSessionInfo", params);

/** 拼接接口/文档 URL */
export function getApiUrl(path: string) {
  const base =
    typeof window !== "undefined" && (window as any).TEST_API
      ? (window as any).TEST_API
      : window.location.hostname === "localhost"
        ? "https://xmhis.top:30101"
        : `${window.location.protocol}//${window.location.hostname}:${window.location.port || "30101"}`;
  return `${base}/api/${path}`;
}

export const getBedListAPI = (query: any) =>
  request.post<any>("bed/GetBedList", query);

export const getPatientProperty2 = (query: any) =>
  request.post<any>("visit/GetPatientProperty2", query);

export const getVisitProperty2 = (query: any) =>
  request.post<any>("visit/GetVisitProperty2", query);

export const getIpList = (query: any) =>
  request.post<any>("visit/GetIpList", query);

export const getBedListApi = (query: any) =>
  request.post<any>("bed/GetBedList", query);

export const getRoomListApi = (query: any) =>
  request.post<any>("org/GetRoomList", query);

export const getRoomProperty2Api = (query: any) =>
  request.post<any>("org/GetRoomProperty2", query);

export const changeBed = (query: any) =>
  request.post<any>("visit/TransferBed", query);

/** 查询医嘱执行单列表 */
export const getImplementList2 = (query: any) =>
  request.post<any>("ordexe/GetImplementList2", query);

/** 执行医嘱执行单 */
export const execImplement = (query: any) =>
  request.post<any>("ordexe/ExecImplement", query);

/** 取就诊属性（转床 from_*） */
export const getVisitProperty = (query: any) =>
  request.post<any>("visit/GetVisitProperty", query);

export const transferDepartment = (query: any) =>
  request.post<any>("visit/NewTransferDept", query);

/** 取医嘱属性（转科执行单关联 transfer_id） */
export const getOrderProperty = (query: any) =>
  request.post<any>("ordent/GetOrderProperty", query);

/** 查询转科记录列表 */
export const getTransferDeptList = (query: any) =>
  request.post<any>("visit/GetTransferDeptList", query);

export const getDepartmentList = (query: any) =>
  request.post<any>("org/GetDeptList", query);

export const discharge = (query: any) =>
  request.post<any>("visit/Predischarge", query);

export const assignBed = (query: any) =>
  request.post<any>("visit/AssignBed", query);

export const getDataset = (query: any) =>
  request.post<any>("dataset/RetrieveDataset", query);

export const GetObserveLatest = (query: any) =>
  request.post<any>("care/observe/GetObserveLatest", query);

export const getAllergyInfo = (query: any) =>
  request.post<any>("allergy/GetAllergyInfo", query);

export const getDeviceList = (query: any) =>
  request.post<any>("device/GetDeviceList", query);

export const getPatientDeviceList = (query: any) =>
  request.post<any>("device/GetDeviceServiceList", query);

/** 同一 visit_id 并发请求合并，避免 StrictMode / 重复挂载打两次 */
const deviceServiceListInflight = new Map<string, Promise<any>>();
export const getPatientDeviceListOnce = (query: { visit_id: number }) => {
  const key = String(query.visit_id);
  const existing = deviceServiceListInflight.get(key);
  if (existing) return existing;
  const req = getPatientDeviceList(query).finally(() => {
    deviceServiceListInflight.delete(key);
  });
  deviceServiceListInflight.set(key, req);
  return req;
};

export const bindPatientDevice = (query: any) =>
  request.post<any>("device/BeginDeviceService", query);

export const unbindPatientDevice = (query: any) =>
  request.post<any>("device/EndDeviceService", query);

export const updateInterval = (query: any) =>
  request.post<any>("device/SaveDeviceProperty", query);

export const getLatestSurgeryTime = (query: any) =>
  request.post<any>("ops/GetVisitOpsList", query);

/** 取患者属性（联系人 / 地址等） */
export const getPatientPropertyAPI = (params: {
  patient_id?: number;
  column_address?: string;
  column_contact?: string;
}) => request.post<any>("patient/GetPatientProperty", params);

export const dischargeAction = (query: any) =>
  request.post<any>("visit/Discharge", query);

export const sendTransferDeptReqApi = (query: any) =>
  request.post<any>("visit/SendTransferDept", query);

export const createPatient = (query: any) =>
  request.post<any>("patient/NewPatient", query);

export const createPatientNo = (query: any) =>
  request.post<any>("patient/BuildPatientNo", query);

export const createVisit = (query: any) =>
  request.post<any>("visit/NewVisit", query);

export const getAllDeptListApi = (query: any) =>
  request.post<any>("org/GetDeptList", query);

export const getSourceListApi = (query: RetrieveDict2ItemListReq) =>
  request.post<RetrieveDict2ItemListRes>("sys/RetrieveDict2ItemList", query);

export const updateVisitProperty = (query: any) =>
  request.post<any>("visit/SaveVisitProperty", query);

export const getDevicePropertyApi = (query: any) =>
  request.post<any>("device/GetDeviceProperty", query);

export const getUserDeptListApi = (query: any) =>
  request.post<any>("user/GetUserDeptList", query);

/** 批量取账户余额（预交金 / 担保等） */
export const getAccountListAPI = (params: {
  visit_id_list?: number[];
  include_prepay?: boolean;
  include_credit?: boolean;
  include_guarantee?: boolean;
}) => request.post<any>("account/GetAccountList", params);

/** 批量取记费 / 扣费金额 */
export const getBillAccount2API = (params: {
  org_id?: number;
  visit_id_list?: number[];
  bill_type?: string;
}) => request.post<any>("bill/GetBillAccount2", params);

/** 批量取护理信息（病情等） */
export const getCareList2API = (params: { visit_id_list?: number[] }) =>
  request.post<any>("care/GetCareList2", params);

/** 批量取就诊最近基础医嘱（护理等级等，取 order_name） */
export const getOrderBaseLatest2API = (params: {
  visit_id_list?: number[];
  item_type?: string;
}) => request.post<any>("ordent/GetOrderBaseLatest2", params);
