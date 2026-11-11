import { request } from "comm/request";
import type {
  GetImplementList2Req,
  GetImplementList2Res,
} from "@/types/orderexe";

/** 查询执行单列表（GetImplementList2） */
export const getImplementList2API = (params: GetImplementList2Req) =>
  request.post<GetImplementList2Res>("ordexe/GetImplementList2", params);
