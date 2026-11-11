import { request } from "comm/request";
import type {
  CancelOrderReq,
  CancelOrderRes,
  CanReuseOrderReq,
  CanReuseOrderRes,
  CommitOrder2Req,
  CommitOrder2Res,
  CommitOrderReq,
  CommitOrderRes,
  DeleteOrderReq,
  DeleteOrderRes,
  GetCategoryItemListReq,
  GetCategoryItemListRes,
  GetOrderBaseLatestReq,
  GetOrderBaseLatestRes,
  GetDefaultPharmacyReq,
  GetDefaultPharmacyRes,
  GetDefaultUsageReq,
  GetDefaultUsageRes,
  InputBaseReq,
  InputBaseRes,
  StopAllReq,
  StopAllRes,
  StopOrderReq,
  StopOrderRes,
  UndoStopOrderReq,
  UndoStopOrderRes,
  GetOrderCheckAlertListReq,
  GetOrderCheckAlertListRes,
  GetOrderCheckConfirmListReq,
  GetOrderCheckConfirmListRes,
  GetOrderPropertyReq,
  GetOrderPropertyRes,
  GetOrderSubList2Req,
  GetOrderSubList2Res,
  GetOrderSubListReq,
  GetOrderSubListRes,
  GetPatientOrderListReq,
  GetPatientOrderListRes,
  GetVisitOrderListReq,
  GetVisitOrderListRes,
  InputOrderReq,
  InputOrderRes,
  NewPrefabReq,
  NewPrefabRes,
  RetrieveFreqListReq,
  RetrieveFreqListRes,
  SavePrefabDetailReq,
  SavePrefabDetailRes,
  UndoCommitOrder2Req,
  UndoCommitOrder2Res,
  UndoCommitOrderReq,
  UndoCommitOrderRes,
  GetPrefabListReq,
  GetPrefabListRes,
  GetPrefabDetailReq,
  GetPrefabDetailRes,
  AuthOrderReq,
  AuthOrderRes,
  EndOrderReq,
  EndOrderRes,
  VerifyOrderReq,
  VerifyOrderRes,
  ExecOrderReq,
  ExecOrderRes,
  TerminateOrderReq,
  TerminateOrderRes,
  UndoVerifyOrderReq,
  UndoVerifyOrderRes,
  AttachOrderSubListReq,
  AttachOrderSubListRes,
  DetachOrderSubListReq,
  DetachOrderSubListRes,
} from "@/types/ordent";

/** 获取类别项目列表（基础医嘱各 Select 懒加载） */
export const getCategoryItemListAPI = (params: GetCategoryItemListReq) =>
  request.post<GetCategoryItemListRes>("ordent/item/GetCategoryItemList", {
    column_list: "*",
    ...params,
  });

/** 下达基础医嘱 */
export const inputBaseAPI = (params: InputBaseReq) =>
  request.post<InputBaseRes>("ordent/InputBase", params);

/** 停止所有在执行医嘱并下达基础医嘱 */
export const stopAllAPI = (params: StopAllReq) =>
  request.post<StopAllRes>("ordent/StopAll", params);

/** 停止单条长期医嘱 */
export const stopOrderAPI = (params: StopOrderReq) =>
  request.post<StopOrderRes>("ordent/StopOrder", params);

/** 撤销停止（STOP_COMMIT） */
export const undoStopOrderAPI = (params: UndoStopOrderReq) =>
  request.post<UndoStopOrderRes>("ordent/UndoStopOrder", params);

/** 查询就诊最近基础医嘱（进入基础 Tab 时拉取，用于表单后占位展示） */
export const getOrderBaseLatestAPI = (params: GetOrderBaseLatestReq) =>
  request.post<GetOrderBaseLatestRes>("ordent/GetOrderBaseLatest", {
    column_list: "*",
    ...params,
  });

/** 获取缺省药房 */
export const getDefaultPharmacyAPI = (params: GetDefaultPharmacyReq) => {
  return request.post<GetDefaultPharmacyRes>(
    "ordent/item/GetDefaultPharmacy",
    params,
  );
};

/** 获取医嘱类型/分类的默认用法 */
export const getDefaultUsageAPI = (params: GetDefaultUsageReq) => {
  return request.post<GetDefaultUsageRes>(
    "ordent/item/GetDefaultUsage",
    params,
  );
};

/** 检索频次列表 */
export const retrieveFreqListAPI = (params: RetrieveFreqListReq) => {
  return request.post<RetrieveFreqListRes>(
    "ordent/item/RetrieveFreqList",
    params,
  );
};

/** 获取就诊医嘱列表；「全部」仅传 visit_id，分类过滤再传 order_catalog */
export const getVisitOrderListAPI = (params: GetVisitOrderListReq) =>
  request.post<GetVisitOrderListRes>("ordent/GetVisitOrderList", params);

export const saveOrderPropertyAPI = (order_id?: number, order_property?: any) =>
  request.post("ordent/SaveOrderProperty", {
    order_id,
    order_property,
  });

/** 删除医嘱 */
export const deleteOrderAPI = (params: DeleteOrderReq) =>
  request.post<DeleteOrderRes>("ordent/DeleteOrder", params);

/** 下达医嘱（长期 / 临时 / 检查检验等统一入口） */
export const inputOrderAPI = (data?: InputOrderReq) =>
  request.post<InputOrderRes>("ordent/InputOrder", {
    ...data,
  });

/** 获取医嘱属性（用法、频次、执行科室等） */
export const getOrderPropertyAPI = (params: GetOrderPropertyReq) =>
  request.post<GetOrderPropertyRes>("ordent/GetOrderProperty", {
    column_freq: "*",
    column_usage: "*",
    column_usage_step: "*",
    column_freq_time: "*",
    column_specimen: "*",
    column_body: "*",
    include_pharmacy: true,
    ...params,
  });

/** 获取医嘱药品、项目等子列表（含皮试扩展 column_drug_test，供编辑回显） */
export const getOrderSubListAPI = (params: GetOrderSubListReq) =>
  request.post<GetOrderSubListRes>("ordent/GetOrderSubList", {
    column_drug: "*",
    column_drug_test: "*",
    column_service: "*",
    ...params,
  });

/** 嘱托医嘱详情：文字明细 */
export const getNoteOrderSubListAPI = (
  params: Pick<GetOrderSubListReq, "order_id" | "order_no" | "rx_id">,
) =>
  request.post<GetOrderSubListRes>("ordent/GetOrderSubList", {
    column_note: "*",
    ...params,
  });

/** 转科 / 转床 / 转病区医嘱详情 */
export const getTransferOrderSubListAPI = (
  params: Pick<GetOrderSubListReq, "order_id" | "order_no" | "rx_id">,
) =>
  request.post<GetOrderSubListRes>("ordent/GetOrderSubList", {
    column_transfer: "*",
    ...params,
  });

/** 出院 / 转院 / 离院 / 死亡医嘱详情 */
export const getDischargeOrderSubListAPI = (
  params: Pick<GetOrderSubListReq, "order_id" | "order_no" | "rx_id">,
) =>
  request.post<GetOrderSubListRes>("ordent/GetOrderSubList", {
    column_discharge: "*",
    ...params,
  });

/** 嘱托医嘱详情：属性（主表含 link；频次回填） */
export const getNoteOrderPropertyAPI = (
  params: Pick<GetOrderPropertyReq, "order_id" | "order_no">,
) =>
  request.post<GetOrderPropertyRes>("ordent/GetOrderProperty", {
    column_list: "*",
    column_freq: "*",
    ...params,
  });

/** 检验医嘱详情：属性（子项 body + 标本 specimen） */
export const getLabOrderPropertyAPI = (
  params: Pick<GetOrderPropertyReq, "order_id" | "order_no">,
) =>
  request.post<GetOrderPropertyRes>("ordent/GetOrderProperty", {
    column_body: "*",
    column_specimen: "*",
    ...params,
  });

/** 检验医嘱详情：服务项目明细 */
export const getLabOrderSubListAPI = (
  params: Pick<GetOrderSubListReq, "order_id" | "order_no" | "rx_id">,
) =>
  request.post<GetOrderSubListRes>("ordent/GetOrderSubList", {
    column_service: "*",
    ...params,
  });

/** 检查医嘱详情：属性（部位 / 频次 / 申请单 / 数据元） */
export const getExamOrderPropertyAPI = (
  params: Pick<GetOrderPropertyReq, "order_id" | "order_no">,
) =>
  request.post<GetOrderPropertyRes>("ordent/GetOrderProperty", {
    column_body: "*",
    column_freq: "*",
    column_apply: "*",
    column_elem: "*",
    ...params,
  });

/** 检查医嘱详情：服务项目明细 */
export const getExamOrderSubListAPI = (
  params: Pick<GetOrderSubListReq, "order_id" | "order_no" | "rx_id">,
) =>
  request.post<GetOrderSubListRes>("ordent/GetOrderSubList", {
    column_service: "*",
    ...params,
  });

/** 治疗医嘱详情：属性（部位 / 频次 / 申请单 / 数据元） */
export const getTreatOrderPropertyAPI = (
  params: Pick<GetOrderPropertyReq, "order_id" | "order_no">,
) =>
  request.post<GetOrderPropertyRes>("ordent/GetOrderProperty", {
    column_apply: "*",
    column_freq: "*",
    column_elem: "*",
    column_body: "*",
    ...params,
  });

/** 治疗医嘱详情：服务 + 收费 + 材料明细（编辑回填附加项） */
export const getTreatOrderSubListAPI = (
  params: Pick<GetOrderSubListReq, "order_id" | "order_no" | "rx_id">,
) =>
  request.post<GetOrderSubListRes>("ordent/GetOrderSubList", {
    column_service: "*",
    column_charge: "*",
    column_material: "*",
    ...params,
  });

/** 治疗历史医嘱：服务 + 收费 + 材料明细 */
export const getTreatHistoryOrderSubListAPI = (
  params: Pick<GetOrderSubListReq, "order_id" | "order_no" | "rx_id">,
) =>
  request.post<GetOrderSubListRes>("ordent/GetOrderSubList", {
    column_service: "*",
    column_charge: "*",
    column_material: "*",
    ...params,
  });

/** 病理医嘱详情：属性（申请单 / 数据元 / 标本） */
export const getPathologyOrderPropertyAPI = (
  params: Pick<GetOrderPropertyReq, "order_id" | "order_no">,
) =>
  request.post<GetOrderPropertyRes>("ordent/GetOrderProperty", {
    column_apply: "*",
    column_elem: "*",
    column_specimen: "*",
    ...params,
  });

/** 病理医嘱详情：服务项目 + 标本明细 */
export const getPathologyOrderSubListAPI = (
  params: Pick<GetOrderSubListReq, "order_id" | "order_no" | "rx_id">,
) =>
  request.post<GetOrderSubListRes>("ordent/GetOrderSubList", {
    column_service: "*",
    column_specimen: "*",
    ...params,
  });

/** 批量获取医嘱药品、项目等子列表 */
export const getOrderSubList2API = (params: GetOrderSubList2Req) =>
  request.post<GetOrderSubList2Res>("ordent/GetOrderSubList2", {
    column_drug: "*",
    column_service: "*",
    column_drug_test: "*",
    column_charge: "*",
    column_material: "*",
    ...params,
  });

/** 人工审核质控列表 */
export const getOrderCheckConfirmListAPI = (
  params: GetOrderCheckConfirmListReq,
) =>
  request.post<GetOrderCheckConfirmListRes>(
    "ordent/GetOrderCheckConfirmList",
    params,
  );

/** 自动审核质控列表 */
export const getOrderCheckAlertListAPI = (params: GetOrderCheckAlertListReq) =>
  request.post<GetOrderCheckAlertListRes>(
    "ordent/GetOrderCheckAlertList",
    params,
  );

/** 限制级药品授权（传入授权医师登录后的 session_id） */
export const authOrderAPI = (params: AuthOrderReq) =>
  request.post<AuthOrderRes>("ordent/AuthOrder", params, {
    headers: {
      "xmhis-session-id": params.session_id,
      "Content-Type": "application/json",
    },
  });

/** 单条提交医嘱 */
export const commitOrderAPI = (params: CommitOrderReq) =>
  request.post<CommitOrderRes>("ordent/CommitOrder", params);

/** 批量提交医嘱 */
export const commitOrder2API = (params: CommitOrder2Req) =>
  request.post<CommitOrder2Res>("ordent/CommitOrder2", params);

/** 单条取消提交 */
export const undoCommitOrderAPI = (params: UndoCommitOrderReq) =>
  request.post<UndoCommitOrderRes>("ordent/UndoCommitOrder", params);

/** 批量取消提交 */
export const undoCommitOrder2API = (params: UndoCommitOrder2Req) =>
  request.post<UndoCommitOrder2Res>("ordent/UndoCommitOrder2", params);

/** 取消医嘱（已提交） */
export const cancelOrderAPI = (params: CancelOrderReq) =>
  request.post<CancelOrderRes>("ordent/CancelOrder", params);

export const saveRxAsPrefabAPI = (rx_id?: number, prefab_property?: any) =>
  request.post("ordent/SaveRxAsPrefab", {
    rx_id,
    prefab_property,
  });

export const getPrefabListAPI = (params: GetPrefabListReq) =>
  request.post<GetPrefabListRes>("ordent/GetPrefabList", params);

export const getPrefabDetailAPI = (params: GetPrefabDetailReq) =>
  request.post<GetPrefabDetailRes>("ordent/GetPrefabDetail", params);

/** 新建医嘱模板（存为模板第一步：建模板行） */
export const newPrefabAPI = (params: NewPrefabReq) =>
  request.post<NewPrefabRes>("ordent/NewPrefab", params);

export const getSuggestRxAPI = (
  visit_id?: number,
  rx_type?: string,
  rx_tag?: string,
) =>
  request.post("ordent/cdss/SuggestRx", {
    visit_id,
    rx_type,
    rx_tag,
  });

/** 按患者查询医嘱列表；皮试场景默认 order_catalog=皮试、visit_type=I */
export const getPatientOrderListAPI = (params: GetPatientOrderListReq) =>
  request.post<GetPatientOrderListRes>("ordent/GetPatientOrderList", {
    visit_type: "I",
    order_catalog: "皮试",
    ...params,
  });

export const commitAllAPI = (
  visit_id?: number,
  order_type?: string,
  order_catalog?: string,
  alert_list?: any[],
  confirm_list?: any[],
) =>
  request.post("ordent/CommitAll", {
    visit_id,
    order_type,
    order_catalog,
    alert_list,
    confirm_list,
  });

export const getImplementListAPI = (service: string, order_id: number) =>
  request.post(`${service}/GetImplementList`, {
    order_id,
    implement_status: "[NEW][CHARGE][APPOINT][EXEC][CANCEL]",
  });

export const getBillListAPI = (
  visit_id: number,
  link_name: string,
  link_value: number,
  settle_flag?: string,
) =>
  request.post(`bill/GetBillList`, {
    visit_id,
    link_name,
    link_value,
    baby_id: 0,
    column_item: "item_id,item_name,bill_id",
    settle_flag,
  });

/** 皮试医嘱是否可续用 */
export const canReuseOrderAPI = (params: CanReuseOrderReq) =>
  request.post<CanReuseOrderRes>("ordent/CanReuseOrder", params);

export const cancelImplementAPI = (
  implement_id: number,
  implement_type: string,
  cancel_note?: string,
) =>
  request.post("ordexe/CancelImplement", {
    implement_id,
    implement_type,
    cancel_note,
  });

export const deletePrefabAPI = (prefab_id: number) =>
  request.post("ordent/DeletePrefab", {
    prefab_id,
  });

export const getPrefabPropertyAPI = (prefab_id: number) =>
  request.post("ordent/GetPrefabProperty", {
    prefab_id,
  });

export const savePrefabPropertyAPI = (
  prefab_id: number,
  prefab_property: any,
) =>
  request.post("ordent/SavePrefabProperty", {
    prefab_id,
    prefab_property,
  });

/** 保存医嘱模板明细（存为模板第二步：写入选中的 order_id 列表） */
export const savePrefabDetailAPI = (params: SavePrefabDetailReq) =>
  request.post<SavePrefabDetailRes>("ordent/SavePrefabDetail", params);

/** 护士校对 / 退回 */
export const verifyOrderAPI = (params: VerifyOrderReq) =>
  request.post<VerifyOrderRes>("ordent/VerifyOrder", params);

/** 护士执行医嘱 */
export const execOrderAPI = (params: ExecOrderReq) =>
  request.post<ExecOrderRes>("ordent/ExecOrder", params);

/** 护士确认停止（停嘱校对） */
export const endOrderAPI = (params: EndOrderReq) =>
  request.post<EndOrderRes>("ordent/EndOrder", params);

/** 护士作废医嘱 */
export const terminateOrderAPI = (params: TerminateOrderReq) =>
  request.post<TerminateOrderRes>("ordent/TerminateOrder", params);

/** 护士取消校对 / 取消通过 */
export const undoVerifyOrderAPI = (params: UndoVerifyOrderReq) =>
  request.post<UndoVerifyOrderRes>("ordent/UndoVerifyOrder", params);

/** 附加收费 / 材料明细 */
export const attachOrderSubListAPI = (params: AttachOrderSubListReq) =>
  request.post<AttachOrderSubListRes>("ordent/AttachOrderSubList", params);

/** 删除附加收费 / 材料明细 */
export const detachOrderSubListAPI = (params: DetachOrderSubListReq) =>
  request.post<DetachOrderSubListRes>("ordent/DetachOrderSubList", params);

export const getRxRollbackListAPI = (rx_id: number) =>
  request.post("ordent/GetRxRollbackList", {
    rx_id,
  });

export const getFreqPropertyAPI = (item_id: number) =>
  request.post("ordent/item/GetFreqProperty", {
    item_id,
  });
