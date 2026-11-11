import { getSessionInfo } from "comm/session";
import { request } from "comm/request";
import type { ApiResult } from "../types/comm";

export interface PartnerRow {
  partner_id?: number;
  partner_name?: string;
  partner_name_abbr?: string;
  kb_code?: string;
}

export interface RetrievePartnerListReq {
  org_id?: number;
  retrieve_input?: string;
}

export interface RetrievePartnerListRes extends ApiResult {
  row_list?: PartnerRow[];
  partner_list?: PartnerRow[];
}

let cachedOrgId: number | null = null;

/** 当前机构：优先会话，其次壳子写入的本地缓存 */
export async function resolveOrgId(): Promise<number> {
  if (cachedOrgId != null) return cachedOrgId;
  try {
    const info = await getSessionInfo();
    const orgId = Number(info?.org_id);
    if (Number.isFinite(orgId) && orgId > 0) {
      cachedOrgId = orgId;
      return orgId;
    }
  } catch {
    // 会话取不到时再看本地缓存
  }
  const stored = Number(localStorage.getItem("SITE_AUTH_CA_ORG_ID"));
  cachedOrgId = Number.isFinite(stored) && stored > 0 ? stored : 0;
  return cachedOrgId;
}

/** 检索合作单位 */
export const retrievePartnerListAPI = (params: RetrievePartnerListReq) =>
  request.post<RetrievePartnerListRes>("org/RetrievePartnerList", params);
