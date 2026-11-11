export const DEPARTMENT_TABS = ["property", "link", "clinic"] as const;
export type DepartmentTab = (typeof DEPARTMENT_TABS)[number];
export interface Selection {
  orgId: number | null;
  deptType: string | null;
  deptId: number | null;
  tab: DepartmentTab;
}

