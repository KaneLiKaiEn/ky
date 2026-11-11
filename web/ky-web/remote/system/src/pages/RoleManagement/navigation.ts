import type { RoleSelection } from "./types";

import { parseId } from "@/utils/selection";
export { parseId } from "@/utils/selection";

export function readSelection(params: URLSearchParams): RoleSelection {
  const orgId = parseId(params.get("orgId"));
  const roleId = orgId ? parseId(params.get("roleId"), true) : null;
  return {
    orgId,
    roleId,
    tab: roleId && params.get("tab") === "members" ? "members" : "property",
  };
}

export function selectionParams(
  params: URLSearchParams,
  selection: RoleSelection,
) {
  const next = new URLSearchParams(params);
  for (const key of ["orgId", "roleId"] as const) {
    if (selection[key] === null) next.delete(key);
    else next.set(key, String(selection[key]));
  }
  next.set("tab", selection.tab);
  return next;
}

export const sameSelection = (a: RoleSelection, b: RoleSelection) =>
  a.orgId === b.orgId && a.roleId === b.roleId && a.tab === b.tab;
