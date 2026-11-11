import { eventBus } from "./eventBus";
export { registerHistoryNavigationGuard } from "./historyGuard";
export type { HistoryNavigationGuard } from "./historyGuard";

const TOKEN_KEY = "session_id";

const ACTIVE_ID_KEYS = [
  "active_patient_id",
  "active_visit_id",
  "active_baby_id",
  "active_emr_id",
  "active_ops_id",
  "active_anes_id",
] as const;

type ActiveIdKey = (typeof ACTIVE_ID_KEYS)[number];

export const SESSION_ID_CHANGE_EVENT = "session:id";

export type SessionIdChangePayload = {
  action: "set" | "clear";
  sessionId: string | null;
};

/** sessionStorage 中用于存放登录令牌（AgileBoot JWT）的 key */
export const TOKEN_STORAGE_KEY = TOKEN_KEY;

/** 读取当前登录令牌；未登录时返回 null */
export const getSessionId = (): string | null =>
  sessionStorage.getItem(TOKEN_KEY);

/** 写入登录令牌（登录成功后调用） */
export const setSessionId = (id: string): void => {
  sessionStorage.setItem(TOKEN_KEY, id);
  eventBus.emit(SESSION_ID_CHANGE_EVENT, {
    action: "set",
    sessionId: id,
  } satisfies SessionIdChangePayload);
};

/** 清除会话 ID（登出或会话失效时调用） */
export const clearSessionId = (): void => {
  sessionStorage.removeItem(TOKEN_KEY);
  eventBus.emit(SESSION_ID_CHANGE_EVENT, {
    action: "clear",
    sessionId: null,
  } satisfies SessionIdChangePayload);
};

/** 订阅 session_id 变更；返回取消订阅函数 */
export const onSessionIdChange = (
  callback: (payload: SessionIdChangePayload) => void,
): (() => void) =>
  eventBus.on(SESSION_ID_CHANGE_EVENT, (payload) => {
    callback(payload as SessionIdChangePayload);
  });

/** 设置当前活动id  */
export const setActiveId = ({
  key,
  value,
}: {
  key: ActiveIdKey;
  value: string;
}): void => {
  sessionStorage.setItem(key, value);
};

/** 清除活动 id；无参时清除全部 active_* */
export const clearActiveId = (key?: ActiveIdKey): void => {
  if (key) {
    sessionStorage.removeItem(key);
    return;
  }
  for (const activeKey of ACTIVE_ID_KEYS) {
    sessionStorage.removeItem(activeKey);
  }
};

/** 读取当前非空的活动 id */
export const getActiveIds = (): Partial<Record<ActiveIdKey, string>> => {
  const ids: Partial<Record<ActiveIdKey, string>> = {};
  for (const key of ACTIVE_ID_KEYS) {
    const value = sessionStorage.getItem(key);
    if (value) ids[key] = value;
  }
  return ids;
};

/** 通过 /getLoginUserInfo 获取当前登录用户（CurrentLoginUserDTO） */
export const getSessionInfo = async () => {
  const { request } = await import("./request");
  return request.get<Record<string, unknown>>("/getLoginUserInfo");
};
