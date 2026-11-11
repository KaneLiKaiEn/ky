export { registerHistoryNavigationGuard } from "./historyGuard";
export type { HistoryNavigationGuard } from "./historyGuard";
declare const ACTIVE_ID_KEYS: readonly ["active_patient_id", "active_visit_id", "active_baby_id", "active_emr_id", "active_ops_id", "active_anes_id"];
type ActiveIdKey = (typeof ACTIVE_ID_KEYS)[number];
export declare const SESSION_ID_CHANGE_EVENT = "session:id";
export type SessionIdChangePayload = {
    action: "set" | "clear";
    sessionId: string | null;
};
/** sessionStorage 中用于存放登录令牌（AgileBoot JWT）的 key */
export declare const TOKEN_STORAGE_KEY = "session_id";
/** 读取当前登录令牌；未登录时返回 null */
export declare const getSessionId: () => string | null;
/** 写入登录令牌（登录成功后调用） */
export declare const setSessionId: (id: string) => void;
/** 清除会话 ID（登出或会话失效时调用） */
export declare const clearSessionId: () => void;
/** 订阅 session_id 变更；返回取消订阅函数 */
export declare const onSessionIdChange: (callback: (payload: SessionIdChangePayload) => void) => (() => void);
/** 设置当前活动id  */
export declare const setActiveId: ({ key, value, }: {
    key: ActiveIdKey;
    value: string;
}) => void;
/** 清除活动 id；无参时清除全部 active_* */
export declare const clearActiveId: (key?: ActiveIdKey) => void;
/** 读取当前非空的活动 id */
export declare const getActiveIds: () => Partial<Record<ActiveIdKey, string>>;
/** 通过 /getLoginUserInfo 获取当前登录用户（CurrentLoginUserDTO） */
export declare const getSessionInfo: () => Promise<Record<string, unknown>>;
