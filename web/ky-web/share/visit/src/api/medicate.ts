import { request } from "comm/request";
import type {
  GetPrefabDetailReq,
  GetPrefabDetailRes,
  GetPrefabListReq,
  GetPrefabListRes,
} from "@/types/medicate";

/** 护士执行附加项模板列表 */
export const getMedicatePrefabListAPI = (params: GetPrefabListReq) =>
  request.post<GetPrefabListRes>("medicate/GetPrefabList", params);

/** 护士执行附加项模板明细 */
export const getMedicatePrefabDetailAPI = (params: GetPrefabDetailReq) =>
  request.post<GetPrefabDetailRes>("medicate/GetPrefabDetail", params);
