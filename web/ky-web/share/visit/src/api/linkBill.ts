import type {
  RetrieveDict2ItemListReq,
  RetrieveDict2ItemListRes,
} from "@/types/sys";
import { request } from "comm/request";
import axios from "axios";
import type {
  ChargeBillReq,
  DeleteBillReq,
  GetAnesDrugListRes,
  GetBillListReq,
  GetBillListRes,
  GetBillApplyReq,
  GetBillApplyRes,
  GetApplyDetailDispenseListReq,
  GetApplyDetailDispenseListRes,
  NewApplyWithdrawReq,
  GetCatalogListRes,
  GetCatalogPropertyRes,
  GetDocTagListReq,
  GetDocTagListRes,
  GetPcaDrugListRes,
  GetPcaListRes,
  GetPrefabDetailRes,
  GetPrefabListRes,
  GetSessionInfoRes,
  GetStockListRes,
  NewBillReq,
  RefundBillReq,
  RetrieveItemListRes,
  RetrieveUsageListRes,
  RetrieveUserListRes,
  SaveBillPropertyReq,
} from "@/types/linkBill";

/**
 * 外部服务（旧 anes-bill 直连的任务服务），暂沿用绝对地址。
 * TODO: 若新框架需要，统一走网关/代理。
 */
const DRUG_STOCK_URL =
  "https://xmhis.top:30101/glue/taskservice/zhiy/GetOperaDrugRepertory";

/* ------------------------------ 会话 / 科室 ------------------------------ */

export const getSessionInfoAPI = (params: { session_id?: string }) =>
  request.post<GetSessionInfoRes>("auth/GetSessionInfo", params);

/* ------------------------------ 打印 / 文档 ------------------------------ */

export const getDocTagListAPI = (params: GetDocTagListReq) =>
  request.post<GetDocTagListRes>("doc/GetDocTagList", params);

/* ------------------------------ 麻醉用药 / PCA ------------------------------ */

export const getAnesDrugListAPI = (params: {
  anes_id: number;
  order_type: string;
  include_children: boolean;
}) => request.post<GetAnesDrugListRes>("anes/GetAnesDrugList", params);

export const addAnesDrugAPI = (params: Record<string, unknown>) =>
  request.post<ApiResultLike>("anes/AddAnesDrug", params);

export const deleteAnesDrugAPI = (params: { row_id: number }) =>
  request.post<ApiResultLike>("anes/DeleteAnesDrug", params);

export const getPcaListAPI = (params: Record<string, unknown>) =>
  request.post<GetPcaListRes>("anes/GetPcaList", params);

export const getPcaDrugListAPI = (params: { pca_id: number }) =>
  request.post<GetPcaDrugListRes>("anes/GetPcaDrugList", params);

/* ------------------------------ 计费列表 ------------------------------ */

export const getBillListAPI = (params: GetBillListReq) =>
  request.post<GetBillListRes>("bill/GetBillList", params);

/* ------------------------------ 计费操作 ------------------------------ */

export const saveBillPropertyAPI = (params: SaveBillPropertyReq) =>
  request.post<ApiResultLike>("bill/SaveBillProperty", params);

export const newBillAPI = (params: NewBillReq) =>
  request.post<ApiResultLike>("bill/NewBill", params);

export const chargeBill2API = (params: ChargeBillReq) =>
  request.post<ApiResultLike>("bill/ChargeBill2", params);

export const deleteBillAPI = (params: DeleteBillReq) =>
  request.post<ApiResultLike>("bill/DeleteBill", params);

export const refundBillAPI = (params: RefundBillReq) =>
  request.post<ApiResultLike>("bill/RefundBill", params);

export const getBillApplyAPI = (params: GetBillApplyReq) =>
  request.post<GetBillApplyRes>("pharmacy/apply/GetBillApply", params);

export const getApplyDetailDispenseListAPI = (params: GetApplyDetailDispenseListReq) =>
  request.post<GetApplyDetailDispenseListRes>("pharmacy/apply/GetApplyDetailDispenseList", params);

export const newApplyWithdrawAPI = (params: NewApplyWithdrawReq) =>
  request.post<ApiResultLike>("pharmacy/apply/NewApplyWithdraw", params);

/* ------------------------------ 检索 ------------------------------ */

export const retrieveDict2ItemList = (params: RetrieveDict2ItemListReq) => request.post<RetrieveDict2ItemListRes>("sys/RetrieveDict2ItemList", params);

export const retrieveUsageListAPI = (params: { retrieve_input: string }) =>
  request.post<RetrieveUsageListRes>("drug/item/RetrieveUsageList", params);

export const retrieveChargeListAPI = (params: {
  retrieve_input: string;
  retrieve_limit: number;
}) => request.post<RetrieveItemListRes>("bill/item/RetrieveItemList", params);

export const retrieveMaterialListAPI = (params: {
  retrieve_input: string;
  retrieve_limit: number;
}) => request.post<RetrieveItemListRes>("material/item/RetrieveItemList", params);

export const retrieveDrugListAPI = (params: {
  retrieve_input: string;
  retrieve_limit: number;
  store_id?: number;
}) => request.post<RetrieveItemListRes>("drug/item/RetrieveItemList", params);

export const retrieveUserListAPI = (params: {
  dept_id: number;
  retrieve_input: string;
  retrieve_limit: number;
}) => request.post<RetrieveUserListRes>("user/RetrieveUserList", params);

/* ------------------------------ 库存单元（药房） ------------------------------ */

export const getStockListAPI = () =>
  request.post<GetStockListRes>("drug/item/GetStoreList", {});

/** 检索频次（返回 row_list） */
export const retrieveAnesBillFreq = async () => {
  const res = await retrieveDict2ItemList({ dict_code: "anes_bill_freq", retrieve_input: "*" });
  return res?.row_list || [];
};

/** 检索用法（返回 row_list） */
export const retrieveUsageList = async (searchStr = "") => {
  const res = await retrieveUsageListAPI({ retrieve_input: searchStr });
  return res?.row_list || [];
};

export const getCatalogListAPI = (params: Record<string, unknown>) =>
  request.post<GetCatalogListRes>("sys/GetCatalogList", params);

export const newCatalogAPI = (params: Record<string, unknown>) =>
  request.post<ApiResultLike>("sys/NewCatalog", params);

export const getCatalogPropertyAPI = (params: { catalog_id: number }) =>
  request.post<GetCatalogPropertyRes>("sys/GetCatalogProperty", params);

export const saveCatalogPropertyAPI = (params: Record<string, unknown>) =>
  request.post<ApiResultLike>("sys/SaveCatalogProperty", params);

export const deleteCatalogAPI = (params: { catalog_id: number; delete_note: string }) =>
  request.post<ApiResultLike>("sys/DeleteCatalog", params);

/* ------------------------------ 模板 ------------------------------ */

export const getPrefabListAPI = (params: Record<string, unknown>) =>
  request.post<GetPrefabListRes>("bill/GetPrefabList", params);

export const getPrefabDetailAPI = (params: { prefab_id: number }) =>
  request.post<GetPrefabDetailRes>("bill/GetPrefabDetail", params);

export const savePrefabDetailAPI = (params: Record<string, unknown>) =>
  request.post<ApiResultLike>("bill/SavePrefabDetail", params);

export const savePrefabPropertyAPI = (params: Record<string, unknown>) =>
  request.post<ApiResultLike>("bill/SavePrefabProperty", params);

export const deletePrefabAPI = (params: { prefab_id: number; delete_note: string }) =>
  request.post<ApiResultLike>("bill/DeletePrefab", params);

export const newPrefabAPI = (params: Record<string, unknown>) =>
  request.post<ApiResultLike>("bill/NewPrefab", params);

/* ------------------------------ 外部服务 ------------------------------ */

/** 获取药品库存（外部任务服务） */
export const getOperaDrugRepertory = async (param1: string, param2: string) => {
  const res = await axios.post(DRUG_STOCK_URL, {
    param1: String(param1),
    param2: String(param2),
  });

  return res?.data?.data;
};

/** 兼容旧代码中大量使用的通用响应结构 */
export interface ApiResultLike {
  code: number;
  message: string;
  hint?: string;
  [key: string]: unknown;
}
