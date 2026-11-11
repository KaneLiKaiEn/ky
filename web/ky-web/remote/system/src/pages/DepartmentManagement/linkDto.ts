import type { DeptLinkRow } from "@/types/org";
import { parseId } from "@/utils/selection";

export const MAX_LINKS = 15;

/** Snapshot metadata remains separate from the two editable selection fields. */
export interface LinkDraft {
  original?: DeptLinkRow;
  link_type?: string;
  link_id?: number;
  link_name?: string;
}

export function copyLinks(rows: LinkDraft[]): LinkDraft[] {
  return rows.map((row) => ({
    ...row,
    original: row.original ? { ...row.original } : undefined,
  }));
}

export function linkFingerprint(rows: LinkDraft[] = []): string {
  return JSON.stringify(
    rows.map((row) => [
      row.link_type ?? "",
      parseId(row.link_id),
      row.link_name ?? "",
    ]),
  );
}

export function validateLinks(rows: LinkDraft[] = []): string | undefined {
  if (rows.length > MAX_LINKS)
    return `最多配置 ${MAX_LINKS} 个对照科室，请移除多余记录`;
  const selected = new Set<string>();
  for (const row of rows) {
    const type = row.link_type?.trim();
    const id = parseId(row.link_id);
    if (!type || !id) continue;
    const key = `${type}:${id}`;
    if (selected.has(key)) return "同一科室类型下不能重复添加同一对照科室";
    selected.add(key);
  }
  return undefined;
}

const metadataFields = [
  "link_tag",
  "link_note",
  "sort_no",
  "valid_status",
  "valid_start",
  "valid_end",
  "input_time",
  "input_session",
  "input_note",
] as const;

/** DeptLinkData whitelist excludes form helper fields and extra display columns. */
export function linkPayload(
  deptId: number,
  deptName: string,
  rows: LinkDraft[],
): DeptLinkRow[] {
  const error = validateLinks(rows);
  if (error) throw new Error(error);
  return rows.map((row) => {
    const type = row.link_type?.trim();
    const id = parseId(row.link_id);
    const name = row.link_name?.trim();
    if (!type || !id || !name)
      throw new Error("请选择完整的科室类型和对照科室");
    const original = row.original ?? {};
    const rowId = parseId(original.row_id);
    return {
      ...(rowId ? { row_id: rowId } : {}),
      ...Object.fromEntries(
        metadataFields
          .filter((field) => original[field] != null)
          .map((field) => [field, original[field]]),
      ),
      dept_id: deptId,
      dept_name: deptName,
      link_type: type,
      link_id: id,
      link_name: name,
    };
  });
}
