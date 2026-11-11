import { message } from "antd";

export function notifyApi(
  res: { code?: number; message?: string; hint?: string } | null | undefined,
  successText?: string,
) {
  if (!res || res.code !== 0) {
    message.error(
      [res?.message, res?.hint].filter(Boolean).join("") || "操作失败",
    );
    return false;
  }
  if (successText) {
    message.success(successText);
  }
  return true;
}
