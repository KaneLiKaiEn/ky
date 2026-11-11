import dayjs from "dayjs";
import type { VisitDateRange } from "./types";

/** 出院列表默认查当天（与弹窗 RangePicker 初始值一致） */
export function getDefaultDischargeDateRange(): VisitDateRange {
  const today = dayjs().format("YYYY-MM-DD");
  return [today, today];
}
