/** 接口 data[0]：费用金额，键名由后端定义 */
export type BillCategoryValueRow = Record<string, number | null | undefined>;

/** 接口 data[1]：额外比例项，键名由后端定义，与 data[0] 无需对应 */
export type BillCategoryExtraRatioRow = Record<string, number | null | undefined>;

/** 接口 data 结构：[金额对象, 额外比例对象] */
export type BillCategoryApiData = [
  BillCategoryValueRow?,
  BillCategoryExtraRatioRow?,
];
