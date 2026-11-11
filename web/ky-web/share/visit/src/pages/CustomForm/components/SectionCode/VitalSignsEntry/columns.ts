export const OBSERVE_TAG = "[体温单]";
export const DEFAULT_TEMP_METHOD = "腋温";
export const RECORD_MINUTE_FORMAT = "YYYY-MM-DD HH:mm";

export const TEMP_TYPE_OPTIONS = [
  { value: "腋温", label: "腋温" },
  { value: "口温", label: "口温" },
  { value: "肛温", label: "肛温" },
];

export interface VitalColumn {
  elem_name: string;
  item_unit?: string;
  item_tag?: string;
}

export const FIXED_VITAL_COLUMNS: VitalColumn[] = [
  { elem_name: "体温", item_unit: "℃" },
  { elem_name: "脉搏", item_unit: "次/分" },
  { elem_name: "呼吸", item_unit: "次/分" },
  { elem_name: "血压", item_unit: "mmHg" },
];

export const isNumericVital = (elemName: string) =>
  elemName === "体温" || elemName === "脉搏" || elemName === "呼吸";
