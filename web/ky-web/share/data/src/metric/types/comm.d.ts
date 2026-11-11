/** 共用响应结构。proto 整数及浮点字段按项目约定直接声明为 number。 */
export interface ApiResult {
  code: number;
  message?: string;
  hint?: string;
}

/** 已读取行允许保留服务端扩展字段；请求本身不使用任意字段索引。 */
export interface ProtoRow {
  [field: string]: unknown;
}
