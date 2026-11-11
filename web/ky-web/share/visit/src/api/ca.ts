import { request } from "comm/request";
import type {
  GetConsentImageReq,
  GetConsentImageRes,
  GetSignImageReq,
  GetSignImageRes,
} from "@/types/ca";

export const getSignImage = (params: GetSignImageReq) => {
  return request.post<GetSignImageRes>("ca/GetSignImage", params);
};

export const getConsentImage = (params: GetConsentImageReq) => {
  return request.post<GetConsentImageRes>("ca/GetConsentImage", params);
};
