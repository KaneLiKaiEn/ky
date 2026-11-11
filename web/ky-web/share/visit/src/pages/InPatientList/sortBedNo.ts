/** 床号中的数字，如 1、加1、+4、n1、N5、0001、10023 */
const BED_NO_NUM_RE = /\d+/;

/** 用正则取出床号里的数值；没有数字时返回 null */
export function parseBedNoNum(bedNo: unknown): number | null {
  const match = String(bedNo ?? "").match(BED_NO_NUM_RE);
  if (!match) return null;
  const n = Number.parseInt(match[0], 10);
  return Number.isFinite(n) ? n : null;
}

/** 按床号数值升序；没有数字的排在后面，数值相同再按原文字符串 */
export function compareBedNo(a: unknown, b: unknown): number {
  const na = parseBedNoNum(a);
  const nb = parseBedNoNum(b);
  if (na == null && nb == null) {
    return String(a ?? "").localeCompare(String(b ?? ""), "zh-CN");
  }
  if (na == null) return 1;
  if (nb == null) return -1;
  if (na !== nb) return na - nb;
  return String(a ?? "").localeCompare(String(b ?? ""), "zh-CN");
}

export function sortByBedNo<T>(
  list: T[],
  getBedNo: (item: T) => unknown = (item) =>
    (item as { bed_no?: unknown })?.bed_no,
): T[] {
  return [...list].sort((a, b) => compareBedNo(getBedNo(a), getBedNo(b)));
}
