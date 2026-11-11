export const AGE_UNIT_OPTIONS = [
  { label: "岁", value: "岁" },
  { label: "月", value: "月" },
  { label: "周", value: "周" },
  { label: "天", value: "天" },
];

export const GENDER_OPTIONS = [
  { label: "男", value: "男" },
  { label: "女", value: "女" },
];

export const AUTO_INCLUDE_TAG = "AUTO";

export const DIAG_TYPE_OPTIONS = [
  { label: "诊断", value: "诊断" },
  { label: "主诊断", value: "主诊断" },
  { label: "其他诊断", value: "其他诊断" },
];

export const MATCH_OPTIONS = [
  { label: "包含", value: "INCLUDE" },
  { label: "不包含", value: "EXCLUDE" },
];

export const OPS_TYPE_OPTIONS = [
  { label: "择期", value: "择期" },
  { label: "急诊", value: "急诊" },
  { label: "日间", value: "日间" },
];

export const ANES_TYPE_OPTIONS = [
  { label: "全身麻醉", value: "全身麻醉" },
  { label: "局部麻醉", value: "局部麻醉" },
];

export const POST_BASE_OPTIONS = [
  { value: "POST", label: "上报" },
  { value: "UNDO", label: "取消上报" },
  { value: "STATUS", label: "查询状态" },
  { value: "QUERY", label: "查询列表" },
];

export const TIME_REF_OPTIONS = [
  { label: "出院", value: "DISCHARGE" },
  { label: "手术", value: "OPS" },
  { label: "问诊", value: "INQUIRY" },
];

export const TIME_UNIT_OPTIONS = [
  { label: "天", value: "DAY" },
  { label: "周", value: "WEEK" },
  { label: "月", value: "MONTH" },
  { label: "年", value: "YEAR" },
];

export const DISEASE_TYPE_CLINICAL_PATH = "临床路径";

export const STEP_DATE_REF_OPTIONS = [
  { label: "入院时间", value: "ADMISSION" },
  { label: "入径时间", value: "ENTER" },
  { label: "手术时间", value: "OPS" },
  { label: "出院时间", value: "DISCHARGE" },
];

/** 路径动作三栏：按 work_type 分配 */
export const STEP_WORK_TYPE_GROUPS = [
  { label: "医疗", value: "DOCTOR" },
  { label: "护理", value: "NURSE" },
  { label: "患者", value: "PATIENT" },
];

export type StepWorkType = (typeof STEP_WORK_TYPE_GROUPS)[number]["value"];

export const ACTION_TYPE_DICT_NAME = "action.type";

export type ActionTypeOption = { label: string; value: string };

/** 各 work_type 下的 action_type 分类选项（由字典 action.type 按 item_tag 分组） */
export type ActionTypeOptionsMap = Record<StepWorkType, ActionTypeOption[]>;

export const EMPTY_ACTION_TYPE_OPTIONS: ActionTypeOptionsMap = {
  DOCTOR: [],
  NURSE: [],
  PATIENT: [],
};

export const ACTION_OPTIONAL_TAG = "可选";

export const ACTION_TAG_OPTIONS = [
  { label: "可选", value: ACTION_OPTIONAL_TAG },
];
