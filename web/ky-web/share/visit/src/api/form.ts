import { request } from "comm/request";
import type {
  GetSectionElemListReq,
  GetSectionElemListRes,
  GetSectionListReq,
  GetSectionListRes,
  GetSectionInitDataReq,
  GetSectionInitDataRes,
  GetPieceListReq,
  GetPieceListRes,
  ElemInputEventReq,
  ElemInputEventRes,
  NewPieceReq,
  NewPieceRes,
  DeletePieceReq,
  DeletePieceRes,
  SavePiecePropertyReq,
  SavePiecePropertyRes,
  GetFormPropertyReq,
  GetFormPropertyRes,
  GetFormListReq,
  GetFormListRes,
  GetPrefabListReq,
  GetPrefabListRes,
  GetPrefabValueListReq,
  GetPrefabValueListRes,
} from "@/types/form";

// 获取表单分段元素列表
export const getSectionElemList = (params: GetSectionElemListReq) => {
  return request.post<GetSectionElemListRes>("form/GetSectionElemList", params);
};

// 获取表单分段列表
export const getSectionList = (params: GetSectionListReq) => {
  return request.post<GetSectionListRes>("form/GetSectionList", params);
};

// 按分段上配置的语句/数据集导入多行初始值
export const getSectionInitData = (params: GetSectionInitDataReq) => {
  return request.post<GetSectionInitDataRes>("form/GetSectionInitData", params);
};

// 元素输入事件
export const elemInputEvent = (params: ElemInputEventReq) => {
  return request.post<ElemInputEventRes>("form/input/ElemInputEvent", params);
};

// 获取表单分段列表
export const getPieceList = (params: GetPieceListReq) => {
  return request.post<GetPieceListRes>("form/GetPieceList", params);
};

// 新建片段
export const newPiece = (params: NewPieceReq) => {
  return request.post<NewPieceRes>("form/NewPiece", params);
};

// 删除片段
export const deletePiece = (params: DeletePieceReq) => {
  return request.post<DeletePieceRes>("form/DeletePiece", params);
};

// 保存片段属性
export const savePieceProperty = (params: SavePiecePropertyReq) => {
  return request.post<SavePiecePropertyRes>("form/SavePieceProperty", params);
};

// 获取表单属性
export const getFormProperty = (params: GetFormPropertyReq) => {
  return request.post<GetFormPropertyRes>("form/GetFormProperty", params);
};

// 按文档类型 / 名称 / 标签获取表单列表
export const getFormList = (params: GetFormListReq) => {
  return request.post<GetFormListRes>("form/GetFormList", params);
};

/** @deprecated 别名，与 getFormList 相同 */
export const getFormListAPI = getFormList;

/** 获取表单模板列表 */
export const getPrefabList = (params: GetPrefabListReq) => {
  return request.post<GetPrefabListRes>("form/GetPrefabList", params);
};

/** @deprecated 别名 */
export const getPrefabListAPI = getPrefabList;

/** 获取模板数据 */
export const getPrefabValueList = (params: GetPrefabValueListReq) => {
  return request.post<GetPrefabValueListRes>("form/GetPrefabValueList", params);
};

/** @deprecated 别名 */
export const getPrefabValueListAPI = getPrefabValueList;
