import { request } from "comm/request";
import type {
  GetCareProblemListReq,
  GetCareProblemListRes,
  NewCareProblemAssessReq,
  NewCareProblemAssessRes,
} from "@/types/careProblem";

/** 获取护理问题列表 */
export const getCareProblemList = (params: GetCareProblemListReq) =>
  request.post<GetCareProblemListRes>("care/problem/GetProblemList", params);

/** 新建护理问题评估 */
export const newCareProblemAssess = (params: NewCareProblemAssessReq) =>
  request.post<NewCareProblemAssessRes>(
    "care/problem/NewProblemAssess",
    params,
  );
