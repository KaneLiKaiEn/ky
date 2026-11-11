import { useCallback, useEffect, useState } from "react";
import { App } from "antd";
import { getSessionId } from "comm/session";
import { getSessionInfo } from "@/api/auth";
import type { SessionRow } from "@/types/auth";

let cachedSession: SessionRow | null = null;
let inflight: Promise<SessionRow | null> | null = null;

export async function loadSessionInfo(): Promise<SessionRow | null> {
  if (cachedSession) return cachedSession;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const sessionId = getSessionId();
      if (!sessionId) return null;
      const res = await getSessionInfo({ session_id: sessionId });
      cachedSession = res.session_info ?? null;
      return cachedSession;
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/** 获取当前会话（含 org_id / user 信息），带简单缓存 */
export function useSessionInfo() {
  const { message } = App.useApp();
  const [session, setSession] = useState<SessionRow | null>(cachedSession);
  const [loading, setLoading] = useState(!cachedSession);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      cachedSession = null;
      const info = await loadSessionInfo();
      setSession(info);
      return info;
    } catch {
      message.error("获取会话信息失败");
      return null;
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const info = await loadSessionInfo();
      if (!cancelled) {
        setSession(info);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { session, loading, refresh, orgId: session?.org_id };
}
