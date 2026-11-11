
/** 就诊类型选项 */
export const PREFAB_VISIT_TYPE_OPTIONS = [
    { label: "门诊", value: "O" },
    { label: "急诊", value: "E" },
    { label: "住院", value: "I" },
  ] as const;
  
  /** 共享范围选项 */
  export const PREFAB_SHARE_OPTIONS = [
    { label: "科室", value: "DEPT" },
    { label: "机构", value: "ORG" },
  ] as const;
  
  /** 性别选项 */
  export const PREFAB_GENDER_OPTIONS = [
    { label: "男", value: "男" },
    { label: "女", value: "女" },
  ] as const;
  
  /** 年龄单位选项 */
  export const PREFAB_AGE_UNIT_OPTIONS = [
    { label: "岁", value: "岁" },
    { label: "月", value: "月" },
    { label: "周", value: "周" },
    { label: "天", value: "天" },
    { label: "小时", value: "小时" },
    { label: "分钟", value: "分钟" },
  ] as const;

/** 将多选值编码为 `[tag1][tag2]` 格式 */
export const encodePrefabTagList = (values?: string[]): string =>
  (values ?? []).map((value) => `[${value}]`).join("");