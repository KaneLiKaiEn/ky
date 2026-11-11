export type { PageDTO } from "comm/request";

/** 对应后端 AbstractPageQuery / AbstractQuery 的通用字段 */
export interface PageQuery {
  pageNum?: number;
  pageSize?: number;
  orderColumn?: string;
  orderDirection?: "ascending" | "descending";
  timeRangeColumn?: string;
  /** yyyy-MM-dd */
  beginTime?: string;
  /** yyyy-MM-dd */
  endTime?: string;
}
