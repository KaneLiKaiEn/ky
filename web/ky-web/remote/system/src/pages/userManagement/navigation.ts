import { USER_TABS, type UserSelection, type UserTab } from "./types";

import { parseId } from "@/utils/selection";
export { parseId } from "@/utils/selection";

export function readSelection(params: URLSearchParams): UserSelection {
  const orgId = parseId(params.get("orgId"));
  const userId = orgId ? parseId(params.get("userId"), true) : null;
  const tab = params.get("tab") as UserTab;
  return {
    orgId,
    userId,
    tab: userId && USER_TABS.includes(tab) ? tab : "property",
  };
}

export function selectionParams(
  params: URLSearchParams,
  selection: UserSelection,
) {
  const next = new URLSearchParams(params);
  for (const key of ["orgId", "userId"] as const) {
    if (selection[key] === null) next.delete(key);
    else next.set(key, String(selection[key]));
  }
  next.set("tab", selection.tab);
  return next;
}

export const sameSelection = (a: UserSelection, b: UserSelection) =>
  a.orgId === b.orgId && a.userId === b.userId && a.tab === b.tab;
