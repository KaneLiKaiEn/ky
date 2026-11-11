import type { OrgRow } from "@/types/org";

export const isValidRow = (row: { valid_status?: string }) =>
  row.valid_status == null || row.valid_status === "1";

export const filterValidRows = <T extends { valid_status?: string }>(
  rows: T[] | undefined,
): T[] => (rows ?? []).filter(isValidRow);

export const resolveOrgId = (sessionOrgId?: number, orgList: OrgRow[] = []) => {
  if (sessionOrgId && sessionOrgId > 0) return sessionOrgId;
  return orgList.find((item) => item.org_id != null)?.org_id;
};

/** 本地关键字过滤：任一字段包含关键字即命中（忽略大小写） */
export const matchKeyword = (
  keyword: string,
  ...fields: Array<string | undefined>
) => {
  const text = keyword.trim().toLowerCase();
  if (!text) return true;
  return fields.some((field) => field?.toLowerCase().includes(text));
};
