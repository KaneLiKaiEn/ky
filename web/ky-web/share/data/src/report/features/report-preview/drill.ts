import type { ArgValueRow } from "../../types/source.d.ts";
import { id } from "comm/utils";
import {
  linkValues,
  navigationArguments,
  type DataRow,
  type Link,
  type Values,
} from "./model";

export interface PreviewTarget {
  type: "REPORT" | "BOARD";
  id: number;
  title?: string;
  depth?: number;
  argList: { arg_code: string; arg_type: string; arg_value: string }[];
}
export interface DrillTab extends PreviewTarget {
  key: string;
  depth: number;
}

export function normalizeTarget(target: PreviewTarget): DrillTab {
  if (!["REPORT", "BOARD"].includes(target.type))
    throw new Error("不支持的钻取类型");
  const targetId = id(target.id);
  if (!targetId) throw new Error("链接 ID 无效");
  const depth = target.depth ?? 1;
  if (!Number.isInteger(depth) || depth < 1 || depth > 5)
    throw new Error("明细已达到最大嵌套层数");
  const argList = navigationArguments(target.argList, {}, {}).sort((a, b) =>
    a.arg_code.localeCompare(b.arg_code),
  );
  return {
    ...target,
    id: targetId,
    depth,
    argList,
    title:
      target.title ||
      `${target.type === "BOARD" ? "看板" : "报表"} ${targetId}`,
    key: JSON.stringify([target.type, targetId, argList]),
  };
}

export function linkedTarget(
  link: Link,
  row: DataRow,
  values: Values,
  queried: readonly ArgValueRow[],
  inherited: readonly ArgValueRow[] = [],
  depth = 0,
): PreviewTarget {
  if (link.ln && !["REPORT", "TABLE", "BOARD"].includes(link.ln))
    throw new Error(`暂不支持链接类型 ${link.ln}`);
  return normalizeTarget({
    type: link.ln === "BOARD" ? "BOARD" : "REPORT",
    id: id(link.lv) || 0,
    title: link.lo,
    depth: depth + 1,
    argList: navigationArguments(
      [...inherited, ...queried],
      values,
      linkValues(link.la, row, values),
    ),
  });
}

export function addDrillTab(tabs: DrillTab[], target: DrillTab): DrillTab[] {
  const existing = tabs.find((tab) => tab.key === target.key);
  if (!existing) return [...tabs, target];
  if (existing.depth >= target.depth) return tabs;
  return tabs.map((tab) =>
    tab === existing ? { ...tab, depth: target.depth } : tab,
  );
}
