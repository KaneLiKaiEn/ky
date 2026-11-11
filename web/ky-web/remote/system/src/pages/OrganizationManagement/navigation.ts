export const TAB_KEYS = ["property", "branch", "payment", "reader"] as const;
export type OrganizationTab = (typeof TAB_KEYS)[number];

export interface OrganizationSelection {
  orgId: number | null;
  branchId: number | null;
  tab: OrganizationTab;
}

const parseId = (value: string | null): number | null => {
  if (!value || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
};

export function readSelection(params: URLSearchParams): OrganizationSelection {
  const orgId = parseId(params.get("orgId"));
  const requestedTab = params.get("tab");
  return {
    orgId,
    tab:
      orgId === 0 || !TAB_KEYS.includes(requestedTab as OrganizationTab)
        ? "property"
        : (requestedTab as OrganizationTab),
    branchId: orgId === 0 ? null : parseId(params.get("branchId")),
  };
}

export function selectionParams(
  params: URLSearchParams,
  selection: OrganizationSelection,
) {
  const next = new URLSearchParams(params);
  if (selection.orgId === null) next.delete("orgId");
  else next.set("orgId", String(selection.orgId));
  next.set("tab", selection.tab);
  if (selection.branchId === null) next.delete("branchId");
  else next.set("branchId", String(selection.branchId));
  return next;
}
