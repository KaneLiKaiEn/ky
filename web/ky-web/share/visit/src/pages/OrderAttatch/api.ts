import { request } from "comm/request";

/** 收费分类项目 */
export const getBillCategoryItemListAPI = (params: any) => {
  return request.post<any>("bill/item/GetCategoryItemList", params);
};

/** 材料分类项目 */
export const getMaterialCategoryItemListAPI = (params: any) => {
  return request.post<any>("material/item/GetCategoryItemList", params);
};

/** 套餐模板列表 */
export const getPrefabListAPI = (params: any) => {
  return request.post<any>("medicate/GetPrefabList", params);
};

/** 新建套餐模板 */
export const newPrefabAPI = (params: any) => {
  return request.post<any>("medicate/NewPrefab", params);
};

/** 删除套餐模板 */
export const deletePrefabAPI = (params: any) => {
  return request.post<any>("medicate/DeletePrefab", params);
};

/** 保存套餐模板属性 */
export const savePrefabPropertyAPI = (params: any) => {
  return request.post<any>("medicate/SavePrefabProperty", params);
};

/** 套餐模板明细 */
export const getPrefabDetailAPI = (params: any) => {
  return request.post<any>("medicate/GetPrefabDetail", params);
};

/** 保存套餐模板明细 */
export const savePrefabDetailAPI = (params: any) => {
  return request.post<any>("medicate/SavePrefabDetail", params);
};
