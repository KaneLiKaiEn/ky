/** 构建医嘱 SSE 地址；session 无效时返回 null */
export function buildSseOrderUrl(sessionId: string | null): string | null {
  if (!sessionId) return null;
  return `${window.location.origin}/sse/order/${sessionId}`;
}
