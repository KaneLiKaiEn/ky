import type { RoleRow } from "@/types/org";

export type RoleTab = "property" | "members";

export interface RoleSelection {
  orgId: number | null;
  roleId: number | null;
  tab: RoleTab;
}

export interface RoleEditorProps {
  orgId: number;
  role: RoleRow & { role_id: number };
  disabled?: boolean;
  onDirtyChange: (dirty: boolean) => void;
  onBusyChange: (busy: boolean) => void;
}
