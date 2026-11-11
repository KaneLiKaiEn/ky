import { getDeptList, getRoleList } from "@/api/org";
import { retrieveDict2ItemList } from "@/api/sys";
import { assertResult, resultRows } from "@/utils/result";
import { parseId } from "./navigation";
import type { DeptRow } from "@/types/org";

/** Cache belongs to one institution; failed requests are evicted for retry. */
export function createReferences(orgId: number) {
  const cache = new Map<string, Promise<unknown>>();
  function cached<T>(key: string, fetch: () => Promise<T>): Promise<T> {
    if (!cache.has(key)) {
      const request = fetch().catch((error) => {
        cache.delete(key);
        throw error;
      });
      cache.set(key, request);
    }
    return cache.get(key) as Promise<T>;
  }
  return {
    dictionary: (name: string) =>
      cached(`dict:${name}`, async () => {
        const res = assertResult(
          await retrieveDict2ItemList({
            org_id: orgId,
            dict_code: name,
            retrieve_input: "*",
            retrieve_limit: 0,
            column_list: "*",
          }),
        );
        return resultRows(res.row_list);
      }),
    departments: (type: string) =>
      cached(`dept:${type}`, async () => {
        if (!type) throw new Error("请先选择科室类型");
        const res = assertResult(
          await getDeptList({
            org_id: orgId,
            parent_id: 0,
            dept_type: type,
            include_descendant: true,
            column_list: "*",
          }),
        );
        return resultRows(res.dept_list).map((row) => ({
          ...row,
          dept_id: parseId(row.dept_id) ?? undefined,
          parent_id: parseId(row.parent_id) ?? undefined,
        }));
      }),
    roles: () =>
      cached("roles", async () => {
        const res = assertResult(
          await getRoleList({ org_id: orgId, column_list: "*" }),
        );
        return resultRows(res.role_list).map((row) => ({
          ...row,
          role_id: parseId(row.role_id) ?? undefined,
        }));
      }),
  };
}

export type References = ReturnType<typeof createReferences>;

export interface DeptNode {
  value: number;
  title: string;
  children?: DeptNode[];
}

export function departmentTree(rows: DeptRow[]): DeptNode[] {
  const nodes = new Map<number, DeptNode>();
  for (const row of rows)
    if (row.dept_id)
      nodes.set(row.dept_id, {
        value: row.dept_id,
        title: row.dept_name || String(row.dept_id),
      });
  const roots: DeptNode[] = [];
  for (const row of rows) {
    const node = row.dept_id ? nodes.get(row.dept_id) : undefined;
    if (!node) continue;
    const ancestors = new Set([row.dept_id]);
    let parentId = row.parent_id;
    let cycle = false;
    while (parentId && nodes.has(parentId)) {
      if (ancestors.has(parentId)) {
        cycle = true;
        break;
      }
      ancestors.add(parentId);
      parentId = rows.find((item) => item.dept_id === parentId)?.parent_id;
    }
    const parent =
      !cycle && row.parent_id ? nodes.get(row.parent_id) : undefined;
    if (parent) (parent.children ??= []).push(node);
    else roots.push(node);
  }
  return roots;
}
