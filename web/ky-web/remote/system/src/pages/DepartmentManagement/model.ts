import type { DeptRow } from "@/types/org";
import { parseId } from "@/utils/selection";

export const DEPARTMENT_UPDATED_EVENT = "department:updated";

export const parseTags = (value?: string | null): string[] =>
  [...(value ?? "").matchAll(/\[([^\]]+)\]/g)].map((match) => match[1]);

export const serializeTags = (values: string[] = []) =>
  [...new Set(values.map((value) => value.trim()).filter(Boolean))]
    .map((value) => `[${value}]`)
    .join("");

/** Flat Select options retain hierarchy context without recursive tree rendering. */
export function departmentOptions(rows: DeptRow[]) {
  const byId = new Map(rows.map((row) => [row.dept_id, row]));
  return rows
    .filter((row) => parseId(row.dept_id))
    .map((row) => {
      const path = [row.dept_name || String(row.dept_id)];
      const visited = new Set([row.dept_id]);
      let parentId = row.parent_id;
      while (parentId && byId.has(parentId) && !visited.has(parentId)) {
        visited.add(parentId);
        const parent = byId.get(parentId)!;
        path.unshift(parent.dept_name || String(parentId));
        parentId = parent.parent_id;
      }
      const label = path.join(" / ");
      return {
        value: row.dept_id!,
        label,
        searchText: [
          label,
          row.dept_no,
          row.dept_code,
          row.kb_code,
          row.dept_id,
        ]
          .join(" ")
          .toLocaleLowerCase(),
      };
    });
}

export const newDepartmentDefaults = (
  orgId: number,
  deptType: string,
): DeptRow => ({
  dept_id: 0,
  org_id: orgId,
  dept_type: deptType,
  parent_id: 0,
  parent_name: "",
  branch_id: 0,
  branch_name: "",
});
