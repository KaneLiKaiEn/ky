import dayjs from "dayjs";
import type { VisitIpRow, VisitRow } from "./type";

const DATE_FMT = "YYYY-MM-DD";

/** 按天展开日期范围；缺省时按最近 30 天（含今天） */
export function listDatesInclusive(start?: string, end?: string): string[] {
  const parsedEnd = end ? dayjs(end) : dayjs();
  const endDate = parsedEnd.isValid()
    ? parsedEnd.startOf("day")
    : dayjs().startOf("day");
  const parsedStart = start ? dayjs(start) : undefined;
  const startDate = parsedStart?.isValid()
    ? parsedStart.startOf("day")
    : endDate.subtract(29, "day");
  if (startDate.isAfter(endDate)) return [];

  const dates: string[] = [];
  for (let d = startDate; !d.isAfter(endDate); d = d.add(1, "day")) {
    dates.push(d.format(DATE_FMT));
  }
  return dates;
}

const includesKeyword = (value: unknown, keyword: string) =>
  String(value ?? "")
    .toLowerCase()
    .includes(keyword);

/** 在院列表前端过滤：床号（ip_list）或姓名（visit_info） */
export function filterVisitListByKeyword(
  visitList: VisitRow[],
  ipList: VisitIpRow[],
  keyword: string,
): VisitRow[] {
  const q = keyword.trim().toLowerCase();
  if (!q) return visitList;

  const ipByVisitId = new Map<number, VisitIpRow>();
  for (const ip of ipList) {
    if (ip.visit_id != null) ipByVisitId.set(ip.visit_id, ip);
  }

  return visitList.filter((visit) => {
    const ip =
      visit.visit_id != null ? ipByVisitId.get(visit.visit_id) : undefined;
    return (
      includesKeyword(ip?.bed_no, q) || includesKeyword(visit.visit_info, q)
    );
  });
}

/** 受控展示项前端过滤：床号 / 姓名 */
export function filterVisitItemsByKeyword<
  T extends { bed_no?: string; patient_name?: string },
>(items: T[], keyword: string): T[] {
  const q = keyword.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (item) =>
      includesKeyword(item.bed_no, q) || includesKeyword(item.patient_name, q),
  );
}
