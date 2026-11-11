import type { BillCategoryApiData } from "../constants";

export interface BillCategoryChartItem {
  name: string;
  value: number;
}

export interface BillCategoryFieldItem {
  key: string;
  value: number | null;
}

const parseFieldValue = (
  raw: number | null | undefined,
): number | null => {
  if (raw == null) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

const parseFieldItems = (
  row: Record<string, number | null | undefined> | undefined,
): BillCategoryFieldItem[] => {
  if (!row) return [];
  return Object.entries(row).map(([key, raw]) => ({
    key,
    value: parseFieldValue(raw),
  }));
};

/** 解析 data[0]，保留后端返回的全部键（含 null） */
export const parseBillCategoryFields = (
  data: BillCategoryApiData | undefined,
): BillCategoryFieldItem[] => parseFieldItems(data?.[0]);

/** 解析 data[1]，保留后端返回的全部键（含 null） */
export const parseExtraRatioFields = (
  data: BillCategoryApiData | undefined,
): BillCategoryFieldItem[] => parseFieldItems(data?.[1]);

/** 从 data[0] 提取可绘制饼图的有效金额 */
export const toChartData = (
  feeFields: BillCategoryFieldItem[],
): BillCategoryChartItem[] =>
  feeFields.flatMap((field) => {
    if (field.value == null || field.value <= 0) return [];
    return [{ name: field.key, value: field.value }];
  });

export const hasBillCategoryStructure = (
  data: BillCategoryApiData | undefined,
): boolean => {
  const feeFields = parseBillCategoryFields(data);
  const ratioFields = parseExtraRatioFields(data);
  return feeFields.length > 0 || ratioFields.length > 0;
};

/** 规范化 dataset 返回的 data 字段 */
export const normalizeBillCategoryApiData = (
  data: unknown,
): BillCategoryApiData | undefined => {
  if (!Array.isArray(data)) return undefined;
  return data as BillCategoryApiData;
};

export {
  formatBillAmount,
  formatNullableBillAmount,
  formatNullablePercent,
  formatPercent,
} from "./format";
