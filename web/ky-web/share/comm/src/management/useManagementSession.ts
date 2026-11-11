import { useEffect, useState } from "react";
import { request } from "../request";
import { getSessionId, onSessionIdChange } from "../session";
import { useResource, type Resource } from "../resource";
import { id } from "../utils/value";

export interface ManagementSession {
  sessionId: string;
  orgId: number;
  userId: number;
  userName: string;
  orgName: string;
  userTag?: string;
}

interface SessionInfoRow {
  org_id?: number;
  user_id?: number;
  user_name?: string;
  org_name?: string;
  user_tag?: string;
}

interface SessionInfoResponse {
  session_info?: SessionInfoRow;
  access_info?: SessionInfoRow;
}

export function useManagementSession(
  requireUser = false,
): Resource<ManagementSession> {
  const [sessionId, setSessionId] = useState(getSessionId);
  useEffect(
    () => onSessionIdChange((payload) => setSessionId(payload.sessionId)),
    [],
  );
  return useResource(
    `management-session:${sessionId}:${requireUser}`,
    async () => {
      if (!sessionId) throw new Error("请先登录");
      const result = await request.post<SessionInfoResponse>(
        "auth/GetSessionInfo",
        {
          session_id: sessionId,
        },
      );
      const row = result.session_info ?? result.access_info;
      const orgId = id(row?.org_id),
        userId = id(row?.user_id);
      if (!orgId) throw new Error("未取得登录机构，请重新登录或重试");
      if (requireUser && !userId)
        throw new Error("未取得登录用户，请重新登录或重试");
      return {
        sessionId,
        orgId,
        userId: userId ?? 0,
        userName:
          typeof row?.user_name === "string" ? row.user_name : "当前用户",
        orgName: row?.org_name || `机构 ${orgId}`,
        ...(typeof row?.user_tag === "string" ? { userTag: row.user_tag } : {}),
      };
    },
  );
}
