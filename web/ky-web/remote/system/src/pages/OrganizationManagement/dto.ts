import type { OrgRow, BranchRow, NewOrgReq, NewBranchReq } from "../../types/org";
import type { OrgDealerRow, DealerOrgData } from "../../types/pay";
import type { OrgReaderRow, ReaderOrgData } from "../../types/card";
import { normalizeAddress } from "./components/address.ts";

const orgFields = [
  "org_name",
  "org_name_abbr",
  "org_system",
  "org_name_legend",
  "org_name_alias",
  "org_name_full",
  "org_telno",
] as const;
const branchFields = [
  "branch_name",
  "branch_name_abbr",
  "branch_name_legend",
  "branch_name_alias",
  "branch_no",
  "branch_code",
  "branch_telno",
] as const;

function editableStrings<T extends object>(
  values: T,
  fields: readonly (keyof T)[],
) {
  return Object.fromEntries(
    fields.map((key) => [key, String(values[key] ?? "")]),
  ) as Partial<T>;
}

export function buildOrgPayload(
  values: OrgRow,
  original: OrgRow,
  orgId: number,
): OrgRow {
  const address = normalizeAddress("org", values, original);
  const payload: OrgRow = {
    ...original,
    ...address,
    ...editableStrings(values, orgFields),
    org_id: orgId,
    org_name: String(values.org_name ?? "").trim(),
    org_level: Number(values.org_level ?? 0),
    org_grade: Number(values.org_grade ?? 0),
  };
  // UI-only Cascader values are never sent to the protobuf gateway.
  delete (payload as Record<string, unknown>).org_address_path;
  return payload;
}

export function buildBranchPayload(
  values: BranchRow,
  original: BranchRow,
  orgId: number,
  branchId: number,
): BranchRow {
  const payload: BranchRow = {
    ...original,
    ...normalizeAddress("branch", values, original),
    ...editableStrings(values, branchFields),
    org_id: orgId,
    branch_id: branchId,
    branch_name: String(values.branch_name ?? "").trim(),
  };
  delete (payload as Record<string, unknown>).branch_address_path;
  return payload;
}

/** talk 的新增消息不包含实体 ID，不能直接提交详情／草稿对象。 */
export function toNewOrgRequest(payload: OrgRow): NewOrgReq {
  const { org_id: _orgId, ...request } = payload;
  return request;
}

export function toNewBranchRequest(payload: BranchRow): NewBranchReq {
  const { branch_id: _branchId, ...request } = payload;
  return request;
}

const configurationMetadataFields = [
  "valid_status",
  "valid_start",
  "valid_end",
  "input_time",
  "input_session",
  "input_note",
] as const;

/** 仅保留 talk 的配置 Data 消息字段，不透传显示名称或表单辅助字段。 */
function configurationMetadata(row: OrgDealerRow | OrgReaderRow) {
  return {
    ...(row.row_id != null ? { row_id: Number(row.row_id) } : {}),
    ...Object.fromEntries(
      configurationMetadataFields
        .filter((key) => row[key] != null)
        .map((key) => [key, String(row[key])]),
    ),
  };
}

export function buildDealerList(
  orgId: number,
  orgName: string,
  rows: OrgDealerRow[],
): DealerOrgData[] {
  return rows.map((row) => ({
    ...configurationMetadata(row),
    org_id: orgId,
    org_name: orgName,
    pay_type: String(row.pay_type ?? ""),
    account_id: Number(row.account_id ?? 0),
    account_type: String(row.account_type ?? ""),
    account_name: String(row.account_name ?? ""),
    account_no: String(row.account_no ?? ""),
    account_tag: String(row.account_tag ?? ""),
    account_note: String(row.account_note ?? ""),
    sort_no: String(row.sort_no ?? ""),
  }));
}

export function buildReaderList(
  orgId: number,
  orgName: string,
  rows: OrgReaderRow[],
): ReaderOrgData[] {
  return rows.map((row) => ({
    ...configurationMetadata(row),
    org_id: orgId,
    org_name: orgName,
    reader_type: String(row.reader_type ?? ""),
    reader_tag: String(row.reader_tag ?? ""),
    deposit_amount: String(row.deposit_amount ?? ""),
    sort_no: String(row.sort_no ?? ""),
  }));
}
