import { getBranchList, getDeptLinkList, getDeptList, getDeptProperty } from "@/api/org";
import { retrieveDict2ItemList } from "@/api/sys";
import { assertResultWithHint as assertResult, resultRows } from "@/utils/result";
import { parseId } from "@/utils/selection";
import type { LinkDraft } from "./linkDto";

/** One cache per institution and refresh generation; errors never poison retries. */
export function createReferences(orgId: number) {
  const cache = new Map<string, Promise<unknown>>();
  function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
    if (!cache.has(key))
      cache.set(
        key,
        load().catch((error) => {
          cache.delete(key);
          throw error;
        }),
      );
    return cache.get(key) as Promise<T>;
  }
  return {
    dictionary: (name: string) =>
      cached(`dict:${name}`, async () => {
        const result = assertResult(
          await retrieveDict2ItemList({
            org_id: orgId,
            dict_code: name,
            retrieve_input: "*",
            retrieve_limit: 0,
            column_list: "*",
          }),
        );
        return resultRows(result.row_list);
      }),
    branches: () =>
      cached("branches", async () => {
        const result = assertResult(
          await getBranchList({
            org_id: orgId,
            include_invalid: false,
            column_list: "*",
          }),
        );
        return resultRows(result.branch_list)
          .map((row) => ({
            ...row,
            branch_id: parseId(row.branch_id) ?? undefined,
          }))
          .filter((row) => row.branch_id);
      }),
    departments: (type: string) =>
      cached(`departments:${type}`, async () => {
        if (!orgId || !type) throw new Error("请先选择机构和科室类型");
        const result = assertResult(
          await getDeptList({
            org_id: orgId,
            parent_id: 0,
            dept_type: type,
            include_descendant: true,
            column_list: "*",
          }),
        );
        return resultRows(result.dept_list)
          .map((row) => {
            if (row.org_id != null && parseId(row.org_id) !== orgId)
              throw new Error("科室列表包含其他机构的数据，请重试");
            if (row.dept_type && row.dept_type !== type)
              throw new Error("科室列表与当前科室类型不一致，请重试");
            return {
              ...row,
              dept_id: parseId(row.dept_id) ?? undefined,
              org_id: orgId,
              dept_type: type,
              parent_id: parseId(row.parent_id, true) ?? 0,
              branch_id: parseId(row.branch_id, true) ?? 0,
            };
          })
          .filter((row) => row.dept_id);
      }),
    property: (id: number) =>
      cached(`property:${id}`, async () => {
        const result = assertResult(
          await getDeptProperty({ dept_id: id, column_list: "*" }),
        );
        const row = result.dept_property;
        if (!row || parseId(row.dept_id) !== id)
          throw new Error("科室不存在或接口未返回有效科室属性");
        if (row.org_id != null && parseId(row.org_id) !== orgId)
          throw new Error("科室不属于当前机构，请重新选择");
        return {
          ...row,
          dept_id: id,
          org_id: orgId,
          parent_id: parseId(row.parent_id, true) ?? 0,
          branch_id: parseId(row.branch_id, true) ?? 0,
        };
      }),
  };
}

export type DepartmentReferences = ReturnType<typeof createReferences>;

export async function loadLinks(
  deptId: number,
  reference: DepartmentReferences,
): Promise<LinkDraft[]> {
  const response = assertResult(
    await getDeptLinkList({
      dept_id: deptId,
      link_type: "*",
      column_list: "*",
    }),
  );
  // Invalid/incomplete rows stay visible for repair; never filter stored rows out.
  return Promise.all(
    resultRows(response.link_list).map(async (original) => {
      const id = parseId(original.link_id) ?? undefined;
      let type = original.link_type;
      let name = original.link_name;
      if (id && (!type || !name)) {
        const target = await reference.property(id);
        type ||= target.dept_type;
        name ||= target.dept_name;
      }
      return {
        original: { ...original },
        link_type: type,
        link_id: id,
        link_name: name,
      };
    }),
  );
}

