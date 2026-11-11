import type {
  RetrieveDict2ItemListReq,
  RetrieveDict2ItemListRes,
} from "@/types/sys";
import { request } from "comm/request";
import type {
  DeleteAllergyReq,
  DeleteAllergyRes,
  GetAllergyListReq,
  GetAllergyListRes,
  GetItemListReq,
  GetItemListRes,
  NewAllergyReq,
  NewAllergyRes,
  SaveAllergyPropertyReq,
  SaveAllergyPropertyRes,
} from "@/types/allergy";

/** 获取患者过敏史明细列表 */
export const getAllergyListAPI = (params: GetAllergyListReq) =>
  request.post<GetAllergyListRes>("allergy/GetAllergyList", params);

/** 获取过敏标准分类 */
export const getItemListAPI = (params?: GetItemListReq) =>
  request.post<GetItemListRes>("allergy/GetItemList", {
    column_list: "*",
    ...params,
  });

/** 新增过敏史 */
export const newAllergyAPI = (params: NewAllergyReq) =>
  request.post<NewAllergyRes>("allergy/NewAllergy", params);

/** 保存过敏史属性 */
export const saveAllergyPropertyAPI = (params: SaveAllergyPropertyReq) =>
  request.post<SaveAllergyPropertyRes>(
    "allergy/SaveAllergyProperty",
    params,
  );

/** 删除过敏史 */
export const deleteAllergyAPI = (params: DeleteAllergyReq) =>
  request.post<DeleteAllergyRes>("allergy/DeleteAllergy", params);

/** 检索过敏类型字典 */
export const retrieveDict2ItemList = (params: RetrieveDict2ItemListReq) =>
  request.post<RetrieveDict2ItemListRes>("sys/RetrieveDict2ItemList", {
    retrieve_input: "*",
    ...params,
  });
