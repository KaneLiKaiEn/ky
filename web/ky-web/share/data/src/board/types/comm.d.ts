/** 与 talk 协议保持一致；整数字段使用 number。 */
export interface ApiResult {
  code: number;
  message?: string;
  hint?: string;
}
export interface ProtoRow {
  [field: string]: unknown;
}
