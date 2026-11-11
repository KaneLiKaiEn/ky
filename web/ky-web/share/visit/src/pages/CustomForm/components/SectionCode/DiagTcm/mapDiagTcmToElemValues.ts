import type { ElemValue } from "@/pages/CustomForm/components/DataElem/types";
import type { DiagTcmApiType, DiagTcmRow } from "@/types/diag";
import { getUnicodeNum } from "../Diag/unicodeNum";

/** 中医诊断类型 → elem_id */
export const DIAG_TCM_TYPE_ELEM_ID: Record<DiagTcmApiType, number> = {
  ACTIVE: -200,
  CLINIC: -201,
  INIT: -211,
  ADMISSION: -212,
  DISCHARGE: -213,
};

const DIAG_TCM_TYPE_ELEM_NAME: Record<DiagTcmApiType, string> = {
  ACTIVE: "当前中医诊断",
  CLINIC: "门诊中医诊断",
  INIT: "初步中医诊断",
  ADMISSION: "入院中医诊断",
  DISCHARGE: "出院中医诊断",
};

const resolveDiagTcmDesc = (diag: DiagTcmRow) => {
  const bing = (diag.bing_name ?? "").trim();
  const zheng = (diag.zheng_name ?? "").trim();
  if (bing && zheng) return `${bing} ${zheng}`;
  return bing || zheng;
};

const isDiagTcmRowEmpty = (diag: DiagTcmRow) => !resolveDiagTcmDesc(diag);

/**
 * 多条：①描述1 ②描述2 …（单空格分隔）
 * 仅 1 条：省略序号，直接描述
 */
const formatDiagTcmDescText = (diagRows: DiagTcmRow[]) => {
  const texts = diagRows.map(resolveDiagTcmDesc).filter(Boolean);
  if (!texts.length) return "";
  if (texts.length === 1) return texts[0];
  return texts.map((text, index) => `${getUnicodeNum(index)}${text}`).join(" ");
};

export const resolveDiagTcmElemName = (
  diagType: DiagTcmApiType,
  sectionTitle?: string,
): string => {
  const title = sectionTitle?.trim();
  if (title) return title;
  return DIAG_TCM_TYPE_ELEM_NAME[diagType] ?? "中医诊断";
};

const resolveDiagTcmType = (
  row: DiagTcmRow,
  fallbackTypes: DiagTcmApiType[],
): DiagTcmApiType => {
  const raw = row.diag_type as DiagTcmApiType | undefined;
  if (raw && raw in DIAG_TCM_TYPE_ELEM_ID) return raw;
  return fallbackTypes[0] ?? "ACTIVE";
};

/**
 * 中医诊断 → elem_list（按类型拆分）：
 * { elem_id: -211, elem_name: "初步中医诊断", value_text: "①感冒 风寒证 ②咳嗽 痰湿证" }
 * 仅一条时 value_text 不加序号
 */
export const mapDiagTcmRowsToElemValues = (
  section_id: number,
  diagRows: DiagTcmRow[],
  diagTypes: DiagTcmApiType[] = [],
  sectionTitle?: string,
): ElemValue[] => {
  const rows = diagRows.filter((row) => !isDiagTcmRowEmpty(row));
  if (!rows.length) return [];

  const grouped = new Map<DiagTcmApiType, DiagTcmRow[]>();
  for (const row of rows) {
    const type = resolveDiagTcmType(row, diagTypes);
    const list = grouped.get(type) ?? [];
    list.push(row);
    grouped.set(type, list);
  }

  const orderedTypes = [
    ...diagTypes.filter((t) => grouped.has(t)),
    ...[...grouped.keys()].filter((t) => !diagTypes.includes(t)),
  ];

  const result: ElemValue[] = [];
  for (const type of orderedTypes) {
    const value_text = formatDiagTcmDescText(grouped.get(type) ?? []);
    if (!value_text) continue;
    result.push({
      section_id,
      elem_id: DIAG_TCM_TYPE_ELEM_ID[type],
      elem_name: resolveDiagTcmElemName(
        type,
        orderedTypes.length === 1 ? sectionTitle : undefined,
      ),
      value_text,
    });
  }
  return result;
};
