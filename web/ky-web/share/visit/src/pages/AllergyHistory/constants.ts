export const ALLERGY_TYPE_DICT_NAME = "allergy.type";

/** 有过敏史时 Tag 的预设色，对应 antd Tag color */
export const HAS_ALLERGY_COLOR = "volcano";

/** 无过敏史时 Tag 的预设色，对应 antd Tag color */
export const NO_ALLERGY_COLOR = "warning";

export const OTHER_ITEM = {
  item_id: 0,
  item_name: "其他",
} as const;

/** 勾选「未发现」时提交给接口的 allergy_level */
export const ALLERGY_LEVEL_NOT_FOUND = -1;

export const ALLERGY_LEVEL_OPTIONS = [
  { label: "未指定", value: 0 },
  { label: "轻度", value: 1 },
  { label: "中度", value: 2 },
  { label: "严重", value: 3 },
];

export const ALLERGY_REACTION_OPTIONS = [
  { label: "无", value: "无" },
  { label: "皮疹", value: "皮疹" },
  { label: "荨麻疹", value: "荨麻疹" },
  { label: "轻度发热", value: "轻度发热" },
  { label: "皮疹扩散", value: "皮疹扩散" },
  { label: "水肿", value: "水肿" },
  { label: "呼吸困难", value: "呼吸困难" },
  { label: "心跳加快", value: "心跳加快" },
  { label: "休克", value: "休克" },
];
