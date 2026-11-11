import { getSessionId } from "comm/session";
import { eventBus } from "comm/eventBus";

export const ROLES_CHANGED_EVENT = "system:roles-changed";

export interface RolesChangedPayload {
  orgId: number;
  roleId: number;
  sessionId: string | null;
}

/** Menu refresh failures must never turn a successful role write into a failure. */
export const notifyRolesChanged = (orgId: number, roleId: number): void => {
  try {
    eventBus.emit(ROLES_CHANGED_EVENT, {
      orgId,
      roleId,
      sessionId: getSessionId(),
    } satisfies RolesChangedPayload);
  } catch {
    // Subscribers own their refresh and retry UI.
  }
};
