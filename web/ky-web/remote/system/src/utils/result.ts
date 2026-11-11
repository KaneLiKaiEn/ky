import type { ApiResult } from "@/types/comm";

const successCodes = new Set([0, 113, 200]);

export function assertResult<T extends ApiResult>(result: T): T {
  if (!result || typeof result !== "object" || !successCodes.has(result.code))
    throw new Error(result?.message || "接口返回结果无效，请重试");
  return result;
}

/** Department responses include an additional explanation supplied by the server. */
export function assertResultWithHint<T extends ApiResult>(result: T): T {
  try {
    return assertResult(result);
  } catch (error) {
    if (result?.hint)
      throw new Error(`${errorText(error)}：${result.hint}`);
    throw error;
  }
}

export function resultRows<T>(rows: T[] | null | undefined): T[] {
  if (rows == null) return [];
  if (!Array.isArray(rows)) throw new Error("接口返回的数据格式无效，请重试");
  return rows;
}

export const errorText = (error: unknown) =>
  error instanceof Error ? error.message : "操作失败，请重试";

export class InvalidOrganizationResponse extends Error {
  constructor() {
    super("接口返回了无效结果，当前修改已保留，请重试");
    this.name = "InvalidOrganizationResponse";
  }
}

/** Status handling belongs to the interceptor; organization writes require an envelope. */
export function assertOrganizationResult<T extends { code: number }>(response: T): T {
  if (!response || typeof response !== "object" || typeof response.code !== "number")
    throw new InvalidOrganizationResponse();
  return response;
}
