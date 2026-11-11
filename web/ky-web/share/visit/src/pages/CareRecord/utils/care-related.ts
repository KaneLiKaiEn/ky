export interface ElemProps {
  elem_id: number;
  elem_name: string;
  elem_code: string;
  observe_value: string;
}

export interface CareRecordRow {
  row_key: string;
  care_id: number;
  care_time: string;
  care_status: string;
  health_level: string;
  care_content: string;
  care_tag: string;
  user_name: string;
  link_name?: string;
  link_value?: number | string;
  link_tag?: string;
  sense_id?: number;
  sense_observe_value?: string;
  tube_id?: number;
  tube_observe_value?: string;
  left_pupil_id?: number;
  left_pupil_observe_value?: string;
  right_pupil_id?: number;
  right_pupil_observe_value?: string;
  left_reflex_id?: number;
  left_reflex_observe_value?: string;
  right_reflex_id?: number;
  right_reflex_observe_value?: string;
  temp_id?: number;
  temp_observe_value?: string;
  plus_id?: number;
  plus_observe_value?: string;
  heart_id?: number;
  heart_observe_value?: string;
  breath_id?: number;
  breath_observe_value?: string;
  sbp_id?: number;
  sbp_observe_value?: string;
  dbp_id?: number;
  dbp_observe_value?: string;
  spo2_id?: number;
  spo2_observe_value?: string;
  oxygen_id?: number;
  has_oxygen?: boolean;
  oxygen_start?: string;
  oxygen_method?: string;
  i_id?: number[];
  i_text?: string[];
  o_id?: number[];
  o_text?: string[];
  io_entries?: { io_id: number; io_status: string }[];
}

export const initElemProps: ElemProps = {
  elem_id: 0,
  elem_name: "",
  elem_code: "",
  observe_value: "",
};

export const FALLBACK_SENSE_LIST = [
  { item_name: "不能唤醒" },
  { item_name: "可唤醒" },
  { item_name: "清醒" },
];

export const TUBE_CARE_OPTIONS = [{ item_name: "有" }, { item_name: "无" }];

export const LIGHT_REFLEX_OPTIONS = [
  { item_name: "灵敏" },
  { item_name: "迟钝" },
  { item_name: "不灵敏" },
  { item_name: "无光感" },
];

const OBSERVE_FIELD_MAP: Record<string, { id: keyof CareRecordRow; value: keyof CareRecordRow }> =
  {
    神志: { id: "sense_id", value: "sense_observe_value" },
    管道护理: { id: "tube_id", value: "tube_observe_value" },
    左瞳孔大小: { id: "left_pupil_id", value: "left_pupil_observe_value" },
    右瞳孔大小: { id: "right_pupil_id", value: "right_pupil_observe_value" },
    左对光反射: { id: "left_reflex_id", value: "left_reflex_observe_value" },
    右对光反射: { id: "right_reflex_id", value: "right_reflex_observe_value" },
    体温: { id: "temp_id", value: "temp_observe_value" },
    脉搏: { id: "plus_id", value: "plus_observe_value" },
    心率: { id: "heart_id", value: "heart_observe_value" },
    收缩压: { id: "sbp_id", value: "sbp_observe_value" },
    舒张压: { id: "dbp_id", value: "dbp_observe_value" },
    SpO2: { id: "spo2_id", value: "spo2_observe_value" },
    呼吸: { id: "breath_id", value: "breath_observe_value" },
  };

export function formatOxygenMethod(item: {
  oxygen_method?: string;
  oxygen_tidal?: number | string;
  oxygen_concentration?: number | string;
  oxygen_br?: number | string;
  oxygen_rate?: number | string;
}) {
  if (!item?.oxygen_method) return "";
  return `${item.oxygen_method}${
    item.oxygen_tidal ? ` VTE：${item.oxygen_tidal}ml` : ""
  }${item.oxygen_concentration ? ` FIO2：${item.oxygen_concentration}%` : ""}${
    item.oxygen_br ? ` F：${item.oxygen_br}n/min` : ""
  }${item.oxygen_rate ? ` ${item.oxygen_rate}L/min` : ""}`;
}

function formatIoQuantity(item: { io_quantity?: string; item_unit?: string }) {
  const quantity = item.io_quantity;
  if (quantity == null || quantity === "") return "";
  const num = parseFloat(quantity);
  const amount = Number.isNaN(num) ? quantity : num.toFixed(2);
  return `${amount}${item.item_unit || ""}`;
}

function joinIoText(parts: (string | undefined | null)[]) {
  return parts
    .map((part) => (part == null ? "" : String(part).trim()))
    .filter(Boolean)
    .join(" ");
}

function formatIntakeText(item: any) {
  return joinIoText([
    item.item_name,
    formatIoQuantity(item),
    item.io_method ? `途径:${item.io_method}` : "",
    item.item_note ? `备注:${item.item_note}` : "",
  ]);
}

function formatOutputText(item: any) {
  return joinIoText([
    item.item_name,
    formatIoQuantity(item),
    item.item_color ? `颜色:${item.item_color}` : "",
    item.item_trait ? `性状:${item.item_trait}` : "",
    item.item_note ? `备注:${item.item_note}` : "",
  ]);
}

function timeKey(time?: string) {
  return String(time || "")
    .trim()
    .slice(0, 16);
}

function emptyRow(time: string): CareRecordRow {
  const key = timeKey(time);
  return {
    row_key: `t-${key}`,
    care_id: 0,
    care_time: time,
    care_status: "",
    health_level: "",
    care_content: "",
    care_tag: "",
    user_name: "",
  };
}

/** 按护理时间合并体征、入出量、给氧方式；仅有入出量或吸氧时也单独成行 */
export function mergeCareRelatedLists(
  observeList: any[] = [],
  ioList: any[] = [],
  oxygenList: any[] = [],
  careList: any[] = [],
): CareRecordRow[] {
  const mergedMap = new Map<string, CareRecordRow>();

  const ensureRow = (time?: string) => {
    const key = timeKey(time);
    if (!key) return undefined;
    let row = mergedMap.get(key);
    if (!row) {
      row = emptyRow(String(time));
      mergedMap.set(key, row);
    }
    return row;
  };

  [...careList]
    .sort(
      (a, b) =>
        new Date(a.care_time).getTime() - new Date(b.care_time).getTime(),
    )
    .forEach((item) => {
      const key = timeKey(item.care_time);
      if (!key) return;
      mergedMap.set(key, {
        row_key: `care-${item.care_id}`,
        care_id: item.care_id,
        care_time: item.care_time,
        care_status: item.care_status,
        health_level: item.health_level,
        care_content: item.care_content,
        care_tag: item.care_tag,
        user_name: item.user_name,
        link_name: item.link_name,
        link_value: item.link_value,
        link_tag: item.link_tag,
      });
    });

  ioList.forEach((item) => {
    const row = ensureRow(item.io_time);
    if (!row) return;
    if (!row.user_name && item.user_name) {
      row.user_name = item.user_name;
    }
    const io_id = Number(item.io_id);
    if (io_id) {
      if (!row.io_entries) row.io_entries = [];
      if (!row.io_entries.some((entry) => entry.io_id === io_id)) {
        row.io_entries.push({
          io_id,
          io_status: item.io_status || "NEW",
        });
      }
    }
    if (item.io_type === "I") {
      const text = formatIntakeText(item);
      if (!row.i_id) {
        row.i_id = [item.io_id];
        row.i_text = [text];
      } else {
        row.i_id.push(item.io_id);
        row.i_text!.push(text);
      }
    } else {
      const text = formatOutputText(item);
      if (!row.o_id) {
        row.o_id = [item.io_id];
        row.o_text = [text];
      } else {
        row.o_id.push(item.io_id);
        row.o_text!.push(text);
      }
    }
  });

  oxygenList.forEach((item) => {
    const row = ensureRow(item.start_time);
    if (!row) return;
    if (!row.user_name && item.user_name) {
      row.user_name = item.user_name;
    }
    row.oxygen_id = item.oxygen_id;
    row.has_oxygen = true;
    row.oxygen_start = item.start_time;
    row.oxygen_method = formatOxygenMethod(item);
  });

  observeList.forEach((item) => {
    const mapping = OBSERVE_FIELD_MAP[item.elem_name];
    if (!mapping) return;
    const row = mergedMap.get(timeKey(item.observe_time));
    if (!row) return;
    (row as any)[mapping.id] = item.observe_id;
    (row as any)[mapping.value] = item.observe_value;
  });

  return Array.from(mergedMap.values()).sort(
    (a, b) =>
      new Date(a.care_time).getTime() - new Date(b.care_time).getTime(),
  );
}

export function dictOptions(list: { item_name?: string }[] = []) {
  return list
    .filter((item) => item?.item_name)
    .map((item) => ({ value: item.item_name as string, label: item.item_name }));
}

export function isSelectableRow(record: CareRecordRow) {
  return Boolean(record.care_id) || Boolean(record.io_entries?.length);
}

/** 护理记录用 care_status；纯入出量行用入出量状态 */
export function getRowDisplayStatus(record: CareRecordRow) {
  if (record.care_id) return record.care_status || "";
  const statuses = (record.io_entries || []).map(
    (item) => item.io_status || "NEW",
  );
  if (!statuses.length) return "";
  if (statuses.every((status) => status === "COMMIT")) return "COMMIT";
  return "NEW";
}
