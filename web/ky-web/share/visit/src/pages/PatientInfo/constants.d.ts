/** 地址国籍默认值（GB/T 2659-2000：中国）如果 code 与字典不匹配，则手动修改即可 */
export declare const DEFAULT_COUNTRY: {
    readonly code: "156";
    readonly name: "中国";
};
/** 字典名称（与 sys API 注释对齐） */
export declare const DICT: {
    /** 国籍 */
    readonly COUNTRY: "GB/T 2659-2000";
    /** 地址类别 */
    readonly ADDRESS_TYPE: "CV02.01.205";
    /** 身份识别类别 */
    readonly IDNO_SYSTEM: "CV02.01.101";
    /** 患者/保险类型 */
    readonly INSURANCE_TYPE: "insurance.type";
    /** 民族 */
    readonly RACE: "GB/T 3304";
    /** 文化程度 */
    readonly EDU: "GB/T 4658-2006";
    /** 职业 */
    readonly WORK: "GB/T 6565-2009";
    /** 语种 */
    readonly LANG: "GB/T 4880.1-2005";
    /** 婚姻状况 */
    readonly MARITAL: "GB/T 2261.2-2003";
    /** 家庭关系（联系人亲属关系） */
    readonly KINSHIP: "GB/T 4761-2008";
};
/** 常见地址类型名称（与字典 item_name 匹配） */
export declare const ADDRESS_TYPE_NAME: {
    readonly NATIVE: "籍贯";
    readonly HUKOU: "户籍地址";
    readonly HUKOU_RESIDENCE: "户籍住址";
    readonly CURRENT: "现住址";
    readonly CONTACT: "联系地址";
    readonly FAMILY: "家庭常住住址";
    readonly TEMPORARY: "暂住地址";
};
/** 地址类型别名（字典/历史数据命名不一致时互相匹配） */
export declare const ADDRESS_TYPE_ALIASES: Record<string, readonly string[]>;
export declare const SYNC_ADDRESS_LABEL = "\u540C\u6B65\u5730\u5740";
export declare const SYNC_ADDRESS_TIP = "\u4FDD\u5B58\u57FA\u672C\u4FE1\u606F\u65F6\uFF0C\u5C06\u73B0\u4F4F\u5740\u540C\u6B65\u5230\u5730\u5740\u4FE1\u606F\u4E2D\u5DF2\u52FE\u9009\u7684\u5730\u5740";
/** 左侧已编辑的地址类型，地址信息 Tab 中不再重复展示 */
export declare const LEFT_ADDRESS_TYPES: readonly ["籍贯", "现住址", "现住址", "籍贯"];
/** 地址信息 Tab 默认类型（字典加载失败时的兜底） */
export declare const DEFAULT_ADDRESS_TAB_TYPES: readonly ["户籍住址", "工作场所地址", "家庭常住住址", "通讯地址", "暂住地址", "出生地址", "产后修养地址", "变迁地址", "其他地址"];
export declare const GENDER_OPTIONS: readonly [{
    readonly label: "男";
    readonly value: "男";
}, {
    readonly label: "女";
    readonly value: "女";
}, {
    readonly label: "未知";
    readonly value: "未知";
}];
export declare const BLOOD_ABO_OPTIONS: readonly [{
    readonly label: "A";
    readonly value: "A";
}, {
    readonly label: "B";
    readonly value: "B";
}, {
    readonly label: "AB";
    readonly value: "AB";
}, {
    readonly label: "O";
    readonly value: "O";
}, {
    readonly label: "未知";
    readonly value: "未知";
}];
export declare const BLOOD_RH_OPTIONS: readonly [{
    readonly label: "阴性";
    readonly value: "阴性";
}, {
    readonly label: "阳性";
    readonly value: "阳性";
}, {
    readonly label: "未知";
    readonly value: "未知";
}];
/** 生产方式 */
export declare const BIRTH_TYPE_OPTIONS: readonly [{
    readonly label: "顺产";
    readonly value: "顺产";
}, {
    readonly label: "剖宫产";
    readonly value: "剖宫产";
}, {
    readonly label: "未知";
    readonly value: "未知";
}];
export declare const FORM_LABEL_WIDTH = 72;
