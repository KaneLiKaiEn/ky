import { parseId } from "@/utils/selection";
import { DEPARTMENT_TABS, type DepartmentTab, type Selection } from "./types";

export function readSelection(params: URLSearchParams): Selection {
  const deptId = parseId(params.get("deptId"), true);
  const tab = params.get("tab") as DepartmentTab;
  return {
    orgId: parseId(params.get("orgId")),
    deptType: params.get("deptType")?.trim() || null,
    deptId,
    tab: deptId && DEPARTMENT_TABS.includes(tab) ? tab : "property",
  };
}

export function selectionParams(params: URLSearchParams, selection: Selection) {
  const next = new URLSearchParams(params);
  for (const key of ["orgId", "deptType", "deptId"] as const) {
    if (selection[key] === null) next.delete(key);
    else next.set(key, String(selection[key]));
  }
  next.set("tab", selection.tab);
  return next;
}

export const sameSelection = (a: Selection, b: Selection) =>
  a.orgId === b.orgId &&
  a.deptType === b.deptType &&
  a.deptId === b.deptId &&
  a.tab === b.tab;

