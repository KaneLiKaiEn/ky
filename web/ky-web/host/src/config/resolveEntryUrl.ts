/** 将相对路径解析为当前页面的绝对 URL，已是绝对地址则原样返回 */
export const resolveEntryUrl = (entry: string): string => {
  if (!entry) return entry;
  if (/^https?:\/\//i.test(entry)) return entry;
  return new URL(entry, window.location.origin).href;
};
