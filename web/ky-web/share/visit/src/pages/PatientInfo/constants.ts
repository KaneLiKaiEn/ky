/** 地址国籍默认值（GB/T 2659-2000：中国）如果 code 与字典不匹配，则手动修改即可 */
export const DEFAULT_COUNTRY = {
  code: "156",
  name: "中国",
} as const;

/** 字典编码（对应 dict2 的 dict_code） */
export const DICT = {
  /** 国籍 */
  COUNTRY: "GB/T 2659-2000",
  /** 地址类别 */
  ADDRESS_TYPE: "CV02.01.205",
  /** 身份识别类别 */
  IDNO_SYSTEM: "CV02.01.101",
  /** 患者/保险类型 */
  INSURANCE_TYPE: "insurance.type",
  /** 民族 */
  RACE: "GB/T 3304",
  /** 文化程度 */
  EDU: "GB/T 4658-2006",
  /** 职业 */
  WORK: "GB/T 6565-2009",
  /** 语种 */
  LANG: "GB/T 4880.1-2005",
  /** 婚姻状况 */
  MARITAL: "GB/T 2261.2-2003",
  /** 家庭关系（联系人亲属关系） */
  KINSHIP: "GB/T 4761-2008",
} as const;

/** 常见地址类型名称（与字典 item_name 匹配） */
export const ADDRESS_TYPE_NAME = {
  NATIVE: "籍贯",
  HUKOU: "户籍地址",
  HUKOU_RESIDENCE: "户籍住址",
  BIRTH: "出生地址",
  CURRENT: "现住址",
  CONTACT: "联系地址",
  FAMILY: "家庭常住住址",
  TEMPORARY: "暂住地址",
} as const;

/** 地址类型别名（字典/历史数据命名不一致时互相匹配） */
export const ADDRESS_TYPE_ALIASES: Record<string, readonly string[]> = {
  [ADDRESS_TYPE_NAME.CURRENT]: [
    ADDRESS_TYPE_NAME.CURRENT,
    ADDRESS_TYPE_NAME.CONTACT,
    "现住址",
    "联系地址",
  ],
  [ADDRESS_TYPE_NAME.CONTACT]: [
    ADDRESS_TYPE_NAME.CONTACT,
    ADDRESS_TYPE_NAME.CURRENT,
    "联系地址",
    "现住址",
  ],
  [ADDRESS_TYPE_NAME.HUKOU_RESIDENCE]: [
    ADDRESS_TYPE_NAME.HUKOU_RESIDENCE,
    ADDRESS_TYPE_NAME.HUKOU,
    "户籍住址",
    "户籍地址",
  ],
  [ADDRESS_TYPE_NAME.HUKOU]: [
    ADDRESS_TYPE_NAME.HUKOU,
    ADDRESS_TYPE_NAME.HUKOU_RESIDENCE,
    "户籍地址",
    "户籍住址",
  ],
};

export const SYNC_ADDRESS_LABEL = "同步地址";
export const SYNC_ADDRESS_TIP =
  "保存基本信息时，将现住址同步到地址信息中已勾选的地址";

/** 左侧已编辑的地址类型，地址信息 Tab 中不再重复展示 */
export const LEFT_ADDRESS_TYPES = [
  ADDRESS_TYPE_NAME.NATIVE,
  ADDRESS_TYPE_NAME.CURRENT,
  "现住址",
  "籍贯",
] as const;

/** 放在扩展信息中编辑的地址，地址信息 Tab 中不再重复展示 */
export const EXTENDED_ADDRESS_TYPES = [
  ADDRESS_TYPE_NAME.HUKOU_RESIDENCE,
  ADDRESS_TYPE_NAME.HUKOU,
  ADDRESS_TYPE_NAME.BIRTH,
  "户籍住址",
  "户籍地址",
  "出生地址",
] as const;

/** 地址信息 Tab 排除：左侧基本信息 + 扩展信息已编辑的类型 */
export const ADDRESS_TAB_EXCLUDED_TYPES = [
  ...LEFT_ADDRESS_TYPES,
  ...EXTENDED_ADDRESS_TYPES,
] as const;

/** 地址信息 Tab 默认类型（字典加载失败时的兜底） */
export const DEFAULT_ADDRESS_TAB_TYPES = [
  "户籍住址",
  "工作场所地址",
  "家庭常住住址",
  "通讯地址",
  "暂住地址",
  "出生地址",
  "产后修养地址",
  "变迁地址",
  "其他地址",
] as const;

export const GENDER_OPTIONS = [
  { label: "男", value: "男" },
  { label: "女", value: "女" },
  { label: "未知", value: "未知" },
] as const;

export const BLOOD_ABO_OPTIONS = [
  { label: "A", value: "A" },
  { label: "B", value: "B" },
  { label: "AB", value: "AB" },
  { label: "O", value: "O" },
  { label: "未知", value: "未知" },
] as const;

export const BLOOD_RH_OPTIONS = [
  { label: "阴性", value: "阴性" },
  { label: "阳性", value: "阳性" },
  { label: "未知", value: "未知" },
] as const;

/** 生产方式 */
export const BIRTH_TYPE_OPTIONS = [
  { label: "顺产", value: "顺产" },
  { label: "剖宫产", value: "剖宫产" },
  { label: "未知", value: "未知" },
] as const;

export const FORM_LABEL_WIDTH = 72;
