import { request } from "comm/request";
import type {
  RetrieveDatasetReq,
  RetrieveDatasetRes,
} from "@/types/dataset";

export const BILL_CATEGORY_DISTRIBUTION_DATASET_CODE =
  "bill_category_distribution";

/** 通用 dataset 查询 */
export const retrieveDatasetAPI = (params: RetrieveDatasetReq) =>
  request.post<RetrieveDatasetRes>("dataset/RetrieveDataset", params);

/** 费用类型分布饼图 */
export const retrieveBillCategoryDistributionAPI = (visitId: number) =>
  retrieveDatasetAPI({
    dataset_code: BILL_CATEGORY_DISTRIBUTION_DATASET_CODE,
    arg_list: [
      {
        arg_code: "visit_id",
        arg_type: "INT",
        arg_value: String(visitId),
      },
    ],
  });
