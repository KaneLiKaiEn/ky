import type { ElemValue } from "@/pages/CustomForm/components/DataElem/types";
import type { DiagApiType, DiagRow } from "@/types/diag";
import { getUnicodeNum } from "./unicodeNum";

/** 诊断类型 → elem_id */
export const DIAG_TYPE_ELEM_ID: Record<DiagApiType, number> = {
  ACTIVE: -100,
  CLINIC: -101,
  INIT: -111,
  ADMISSION: -112,
  DISCHARGE: -113,
  PATHOLOGY: -121,
  OPS_BEFORE: -131,
  OPS: -132,
  OPS_AFTER: -133,
  DEAD: -141,
  INJURY: -151,
};

const DIAG_TYPE_ELEM_NAME: Record<DiagApiType, string> = {
  ACTIVE: "当前诊断",
  INIT: "初步诊断",
  ADMISSION: "入院诊断",
  DISCHARGE: "出院诊断",
  CLINIC: "门诊诊断",
  PATHOLOGY: "病理诊断",
  OPS_BEFORE: "术前诊断",
  OPS: "术中诊断",
  OPS_AFTER: "术后诊断",
  INJURY: "损伤中毒外部因素",
  DEAD: "死因",
};

const isDiagRowEmpty = (diag: DiagRow) => !(diag.diag_desc ?? "").trim();

/** 仅取临床诊断 diag_desc */
const resolveDiagDesc = (diag: DiagRow) => (diag.diag_desc ?? "").trim();

/**
 * 多条：①描述1 ②描述2 …（单空格分隔）
 * 仅 1 条：省略序号，直接描述
 */
const formatDiagDescText = (diagRows: DiagRow[]) => {
  const texts = diagRows.map(resolveDiagDesc).filter(Boolean);
  if (!texts.length) return "";
  if (texts.length === 1) return texts[0];
  return texts.map((text, index) => `${getUnicodeNum(index)}${text}`).join(" ");
};

/** elem_name：诊断类型 */
export const resolveDiagElemName = (
  diagType: DiagApiType,
  sectionTitle?: string,
): string => {
  const title = sectionTitle?.trim();
  if (title) return title;
  return DIAG_TYPE_ELEM_NAME[diagType] ?? "诊断";
};

const resolveDiagType = (
  row: DiagRow,
  fallbackTypes: DiagApiType[],
): DiagApiType => {
  const raw = row.diag_type as DiagApiType | undefined;
  if (raw && raw in DIAG_TYPE_ELEM_ID) return raw;
  return fallbackTypes[0] ?? "ACTIVE";
};

/**
 * 诊断 → elem_list（按类型拆分）：
 * { elem_id: -111, elem_name: "初步诊断", value_text: "①头痛 ②高血压" }
 * 仅一条时 value_text 不加序号
 */
export const mapDiagRowsToElemValues = (
  section_id: number,
  diagRows: DiagRow[],
  diagTypes: DiagApiType[] = [],
  sectionTitle?: string,
): ElemValue[] => {
  const rows = diagRows.filter((row) => !isDiagRowEmpty(row));
  if (!rows.length) return [];

  const grouped = new Map<DiagApiType, DiagRow[]>();
  for (const row of rows) {
    const type = resolveDiagType(row, diagTypes);
    const list = grouped.get(type) ?? [];
    list.push(row);
    grouped.set(type, list);
  }

  // 保持 diagTypes 顺序；未在列表中的类型追加在后
  const orderedTypes = [
    ...diagTypes.filter((t) => grouped.has(t)),
    ...[...grouped.keys()].filter((t) => !diagTypes.includes(t)),
  ];

  const result: ElemValue[] = [];
  for (const type of orderedTypes) {
    const value_text = formatDiagDescText(grouped.get(type) ?? []);
    if (!value_text) continue;
    result.push({
      section_id,
      elem_id: DIAG_TYPE_ELEM_ID[type],
      elem_name: resolveDiagElemName(
        type,
        orderedTypes.length === 1 ? sectionTitle : undefined,
      ),
      value_text,
    });
  }
  return result;
};
