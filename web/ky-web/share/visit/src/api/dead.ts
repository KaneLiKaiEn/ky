import { request } from "comm/request";
import type { GetDeadPropertyReq, GetDeadPropertyRes } from "@/types/dead";

export const getDeadPropertyAPI = (params: GetDeadPropertyReq) =>
  request.post<GetDeadPropertyRes>("dead/GetDeadProperty", params);
