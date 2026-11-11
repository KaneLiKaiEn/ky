import { getSessionId } from "comm/session";
import { getSessionInfoAPI } from "../api";

/** 通过 auth/GetSessionInfo 获取当前会话（含 dept_id / org_id / user_id），按 session_id 缓存 */
let cachedSessionId: string | null = null;
let cached: Record<string, any> | null = null;
let inflight: Promise<Record<string, any> | null> | null = null;

export function clearSessionInfoCache() {
  cached = null;
  cachedSessionId = null;
  inflight = null;
}

export async function fetchSessionInfo(): Promise<Record<string, any> | null> {
  const sessionId = getSessionId();
  if (!sessionId) return null;
  if (cached && cachedSessionId === sessionId) return cached;
  if (inflight && cachedSessionId === sessionId) return inflight;

  cachedSessionId = sessionId;
  inflight = (async () => {
    const res = await getSessionInfoAPI({ session_id: sessionId });
    if (getSessionId() !== sessionId) return null;
    if (res?.code !== 0) {
      cached = null;
      return null;
    }
    cached = res.session_info ?? null;
    return cached;
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}
