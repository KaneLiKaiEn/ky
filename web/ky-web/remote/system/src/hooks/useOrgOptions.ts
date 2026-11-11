import { useEffect, useState } from "react";
import { getSessionId, onSessionIdChange } from "comm/session";
import { getSessionInfo } from "@/api/auth";
import { getOrgList } from "@/api/org";
import { assertResult, resultRows } from "../utils/result";
import { parseId } from "../utils/selection";
import { useResource } from "./useResource";

/** Share loading and session isolation; each page owns its selection policy. */
export function useOrgOptions() {
  const [sessionId, setSessionId] = useState(getSessionId);
  useEffect(() => {
    const unsubscribe = onSessionIdChange((payload) => setSessionId(payload.sessionId));
    setSessionId(getSessionId());
    return unsubscribe;
  }, []);
  const resource = useResource(`organizations:${sessionId}`, async () => {
    const [response, sessionResponse] = await Promise.all([
      getOrgList({ column_list: "*" }).then(assertResult),
      getSessionInfo({ session_id: sessionId ?? undefined, column_list: "*" })
        .then(assertResult)
        .catch(() => undefined),
    ]);
    const orgs = resultRows(response.org_list).flatMap((row) => {
      const id = parseId(row.org_id);
      return id === null ? [] : [{ ...row, org_id: id }];
    });
    const session = sessionResponse?.session_info ?? sessionResponse?.access_info;
    return { orgs, session, sessionOrgId: parseId(session?.org_id) };
  });
  return { ...resource, sessionId };
}
