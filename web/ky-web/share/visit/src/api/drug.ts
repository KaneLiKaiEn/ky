import { request } from "comm/request";
import type { GetItemPropertyReq, GetItemPropertyRes } from "@/types/drug";

/** 获取单个药品属性（price_latest、price_quantity，长期医嘱费用明细单价） */
export const getItemPropertyAPI = (params: GetItemPropertyReq) =>
  request.post<GetItemPropertyRes>("drug/item/GetItemProperty", {
    column_list: "*",
    ...params,
  });
