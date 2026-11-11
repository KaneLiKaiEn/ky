import { request } from "comm/request";
import type {
  GetEmrStakeholderToSignListReq,
  GetEmrStakeholderToSignListRes,
  SignEmrStakeholderReq,
  SignEmrStakeholderRes,
} from "@/types/emr";

/** 获取待签名病历列表 */
export const getEmrStakeholderToSignListAPI = (
  params: GetEmrStakeholderToSignListReq,
) =>
  request.post<GetEmrStakeholderToSignListRes>(
    "emr/GetEmrStakeholderToSignList",
    params,
  );

/** 病历相关人签名（支持 emr_id_list 批量签署） */
export const signEmrStakeholderAPI = (params: SignEmrStakeholderReq) =>
  request.post<SignEmrStakeholderRes>("emr/SignEmrStakeholder", params);
