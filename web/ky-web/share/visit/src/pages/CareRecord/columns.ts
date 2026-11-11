/** 护理记录表格可配置列（与 MainContent 中 dataColumns 的 key 一致） */
export const CARE_RECORD_TABLE_COLUMNS = [
  "care_time",
  "sense",
  "temp",
  "plus",
  "heart",
  "breath",
  "bp",
  "spo2",
  "oxygen",
  "intake",
  "output",
  "tube",
  "left_pupil",
  "right_pupil",
  "left_reflex",
  "right_reflex",
  "care_content",
  "care_status",
  "user_name",
] as const;

export type CareRecordTableColumnKey =
  (typeof CARE_RECORD_TABLE_COLUMNS)[number];

/** 与表格列 key 对应的体征录入项 */
export const CARE_RECORD_VITAL_COLUMN_KEYS = [
  "sense",
  "temp",
  "plus",
  "heart",
  "breath",
  "bp",
  "spo2",
  "tube",
  "left_pupil",
  "right_pupil",
  "left_reflex",
  "right_reflex",
] as const satisfies readonly CareRecordTableColumnKey[];

export type CareRecordVitalColumnKey =
  (typeof CARE_RECORD_VITAL_COLUMN_KEYS)[number];

/** 未传 visibleColumns 时视为展示全部体征项 */
export function shouldShowVitalField(
  visibleColumns: readonly CareRecordTableColumnKey[] | undefined,
  field: CareRecordVitalColumnKey,
): boolean {
  if (!visibleColumns?.length) return true;
  return visibleColumns.includes(field);
}

export function shouldShowVitalForm(
  visibleColumns?: readonly CareRecordTableColumnKey[],
): boolean {
  if (!visibleColumns?.length) return true;
  return CARE_RECORD_VITAL_COLUMN_KEYS.some((key) =>
    visibleColumns.includes(key),
  );
}

export function shouldShowCareContentForm(
  visibleColumns?: readonly CareRecordTableColumnKey[],
): boolean {
  if (!visibleColumns?.length) return true;
  return visibleColumns.includes("care_content");
}
