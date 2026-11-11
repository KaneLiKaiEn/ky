import type { Dict2ItemRow } from "@/types/sys";
import type { EmrWorkType } from "../EmrWorkspace";
import { sortByBedNo } from "./sortBedNo";
import type { ListMode, VisitIpRow, VisitRow } from "./type";

// 按表达式排序，这边定义好，然后在字典配置里用 js 表达式来配置排序方式
export function sortByExpression<T>(data: T[], expression: string): T[] {
  if (!expression?.trim()) {
    return [...data];
  }

  const compare = new Function(
    "a",
    "b",
    `"use strict"; return (${expression});`,
  ) as (a: T, b: T) => number;

  return [...data].sort((a, b) => {
    const result = Number(compare(a, b));
    return Number.isFinite(result) ? result : 0;
  });
}

/** 按 ip_list 排序后的 visit_id 顺序重排 visit_list */
function reorderVisitListByIpOrder<T extends { visit_id?: number }>(
  visitList: T[],
  sortedIpList: VisitIpRow[],
): T[] {
  const orderByVisitId = new Map<number, number>();
  sortedIpList.forEach((ip, index) => {
    if (ip.visit_id != null && !orderByVisitId.has(ip.visit_id)) {
      orderByVisitId.set(ip.visit_id, index);
    }
  });
  return [...visitList].sort((a, b) => {
    const ia = a.visit_id != null ? orderByVisitId.get(a.visit_id) : undefined;
    const ib = b.visit_id != null ? orderByVisitId.get(b.visit_id) : undefined;
    if (ia == null && ib == null) return 0;
    if (ia == null) return 1;
    if (ib == null) return -1;
    return ia - ib;
  });
}


/** 在院 / 出院 / 转科各自对应的排序字典 dict_code */
export function getInPatientListSortDictCode(mode: ListMode): string {
  if (mode === "in") return "inpatient.list.sort";
  if (mode === "out") return "discharge.list.sort";
  return "transfer.list.sort";
}

export function sortDict2Items(rowList: Dict2ItemRow[]): Dict2ItemRow[] {
  return [...rowList].sort((a, b) =>
    String(a.sort_no ?? "").localeCompare(String(b.sort_no ?? ""), "zh", {
      numeric: true,
    }),
  );
}

// 获取排序项的值
export function getSortItemSelectValue(item: Dict2ItemRow): string {
  const id = item.row_id;
  return id != null ? String(id) : (item.item_code ?? "");
}

function hasSortItemTag(itemTag: string | undefined, tag: string): boolean {
  return Boolean(itemTag?.includes(`[${tag}]`));
}

// 获取默认排序项
export function pickDefaultSortItem(
  items: Dict2ItemRow[],
  workType: EmrWorkType,
): Dict2ItemRow | undefined {
  if (!items.length) return undefined;
  const defaultTag = workType === "NURSE" ? "NURSE_DEFAULT" : "DOCTOR_DEFAULT";
  return (
    items.find((item) => hasSortItemTag(item.item_tag, defaultTag)) ?? items[0]
  );
}

// 用 ip_list 的床号排序
export const sortVisitListByBed = (
  visitList: VisitRow[],
  ipList: VisitIpRow[],
) => {
  const bedByVisitId = new Map<number, unknown>();
  for (const ip of ipList) {
    if (ip.visit_id != null) bedByVisitId.set(ip.visit_id, ip.bed_no);
  }
  return sortByBedNo(visitList, (visit) =>
    visit.visit_id != null ? bedByVisitId.get(visit.visit_id) : undefined,
  );
};

// 应用在院、出院 患者列表排序
export function applyInPatientListSort<T extends { visit_id?: number }>(
  visitList: T[],
  options: {
    sortOptions: Dict2ItemRow[];
    sortExpression: string;
    ipList?: VisitIpRow[];
  },
): T[] {
  const { sortOptions, sortExpression, ipList } = options;
  if (!sortOptions.length || !sortExpression.trim()) {
    if (ipList?.length) {
      return sortVisitListByBed(visitList as VisitRow[], ipList) as T[];
    }
    return sortByBedNo(visitList as Parameters<typeof sortByBedNo>[0]) as T[];
  }
  if (!ipList?.length) {
    return sortByBedNo(visitList as Parameters<typeof sortByBedNo>[0]) as T[];
  }
  const sortedIpList = sortByExpression(ipList, sortExpression);
  return reorderVisitListByIpOrder(visitList, sortedIpList);
}

/** 受控 list 无 ip_list 时，用展示项上的 visit_id / bed_no 构造用于排序的 ip 行 */
export function buildIpListFromVisitItems(
  items: { visit_id: number; bed_no?: string }[],
): VisitIpRow[] {
  return items.map(({ visit_id, bed_no }) => ({ visit_id, bed_no }));
}
