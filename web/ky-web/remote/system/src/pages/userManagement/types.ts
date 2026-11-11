import type { UserRow } from "@/types/user";

export const USER_TABS = [
  "property",
  "role",
  "dept",
  "password",
  "avatar",
] as const;
export type UserTab = (typeof USER_TABS)[number];

export interface UserSelection {
  orgId: number | null;
  userId: number | null;
  tab: UserTab;
}

export interface EditorProps {
  orgId: number;
  user: UserRow;
  disabled?: boolean;
  onDirtyChange: (dirty: boolean) => void;
  onBusyChange: (busy: boolean) => void;
}

export interface SearchOption {
  value: number;
  label: string;
}
