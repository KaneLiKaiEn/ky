import type { BranchRow, DeptRow, NewDeptReq } from "@/types/org";
import { parseId } from "@/utils/selection";
import { parseTags, serializeTags } from "./model";

export interface PropertyValues {
  dept_name: string;
  dept_name_abbr: string;
  dept_no: string;
  branch_id?: number;
  parent_id: number;
  dept_tag: string[];
  dept_name_legend: string;
  dept_telno: string;
  dept_location: string;
  sort_no: string;
}

const text = (value: unknown) => (value == null ? "" : String(value));

export const propertyValues = (row: DeptRow): PropertyValues => ({
  dept_name: text(row.dept_name),
  dept_name_abbr: text(row.dept_name_abbr),
  dept_no: text(row.dept_no),
  branch_id: parseId(row.branch_id) ?? undefined,
  parent_id: parseId(row.parent_id, true) ?? 0,
  dept_tag: parseTags(row.dept_tag),
  dept_name_legend: text(row.dept_name_legend),
  dept_telno: text(row.dept_telno),
  dept_location: text(row.dept_location),
  sort_no: text(row.sort_no),
});

/** Also terminates safely if the server has returned a cyclic hierarchy. */
export function descendantIds(rows: DeptRow[], departmentId: unknown) {
  const id = parseId(departmentId);
  const excluded = new Set<number>();
  if (!id) return excluded;
  const children = new Map<number, number[]>();
  for (const row of rows) {
    const childId = parseId(row.dept_id);
    const parentId = parseId(row.parent_id, true);
    if (!childId || parentId === null) continue;
    const siblings = children.get(parentId) ?? [];
    siblings.push(childId);
    children.set(parentId, siblings);
  }
  const pending = [id];
  while (pending.length) {
    const current = pending.pop()!;
    if (excluded.has(current)) continue;
    excluded.add(current);
    pending.push(...(children.get(current) ?? []));
  }
  return excluded;
}

const comparableValues = (values: Partial<PropertyValues>) => ({
  dept_name: text(values.dept_name),
  dept_name_abbr: text(values.dept_name_abbr),
  dept_no: text(values.dept_no),
  branch_id: parseId(values.branch_id) ?? 0,
  parent_id: parseId(values.parent_id, true) ?? 0,
  dept_tag: [...(values.dept_tag ?? [])].sort(),
  dept_name_legend: text(values.dept_name_legend),
  dept_telno: text(values.dept_telno),
  dept_location: text(values.dept_location),
  sort_no: text(values.sort_no),
});

export const propertyChanged = (
  values: Partial<PropertyValues>,
  original: PropertyValues,
) =>
  JSON.stringify(comparableValues(values)) !==
  JSON.stringify(comparableValues(original));

/** Merge edited fields while retaining protocol fields not exposed by this form. */
export function propertyDto(
  original: DeptRow,
  values: PropertyValues,
  orgId: number,
  departments: DeptRow[],
  branches: BranchRow[],
): NewDeptReq {
  const departmentId = parseId(original.dept_id, true);
  const organizationId = parseId(orgId);
  const parentId = parseId(values.parent_id, true);
  const branchId =
    values.branch_id == null ? 0 : parseId(values.branch_id, true);
  if (departmentId === null || !organizationId)
    throw new Error("科室或机构信息无效，请重新选择后再保存");
  if (parentId === null) throw new Error("请选择有效的父级科室");
  if (descendantIds(departments, departmentId).has(parentId))
    throw new Error("父级科室不能是当前科室或其下级科室");
  if (branchId === null) throw new Error("请选择有效的院区");
  if (!original.dept_type?.trim())
    throw new Error("未获取到科室类型，请重新选择科室类型");
  const name = values.dept_name.trim();
  if (!name) throw new Error("请填写科室名称");
  const parent = departments.find((row) => parseId(row.dept_id) === parentId);
  const branch = branches.find((row) => parseId(row.branch_id) === branchId);
  const parentName =
    parentId === 0
      ? ""
      : (parent?.dept_name ??
        (parseId(original.parent_id) === parentId ? original.parent_name : ""));
  const branchName =
    branchId === 0
      ? ""
      : (branch?.branch_name ??
        (parseId(original.branch_id) === branchId ? original.branch_name : ""));

  return {
    ...original,
    ...values,
    dept_id: departmentId,
    org_id: organizationId,
    dept_type: original.dept_type,
    dept_name: name,
    parent_id: parentId,
    parent_name: parentName ?? "",
    branch_id: branchId,
    branch_name: branchName ?? "",
    dept_tag: serializeTags(values.dept_tag),
  };
}
