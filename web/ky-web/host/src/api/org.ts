import { request } from "comm/request";
import type { GetOrgLogoReq, GetOrgLogoRes } from "@/types/org";

// 获取机构 Logo
export const getOrgLogo = (params: GetOrgLogoReq) => {
  return request.post<GetOrgLogoRes>("/org/GetOrgLogo", params);
};
