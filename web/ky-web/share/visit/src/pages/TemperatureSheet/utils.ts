import dayjs, { type Dayjs } from "dayjs";

export const DAYS_PER_PAGE = 7;
export const TIME_SLOT_HOURS = [2, 6, 10, 14, 18, 22];
export const CHART_ZOOM_MIN = 0.5;
export const CHART_ZOOM_MAX = 4;
export const CHART_ZOOM_STEP = 0.1;
export const CHART_STACK_GAP_PX = 12;
/** 体温单 A4 纸自然宽度（px），左右分栏时图表面板默认宽度 */
export const CHART_A4_WIDTH_PX = 636;

/** 入院日 0 点 */
export const getAdmissionStart = (admissionTime: string): Dayjs =>
  dayjs(admissionTime || undefined).startOf("day");

/**
 * 体温单展示截止日：有出院时间则用出院日，否则用今天。
 * 超过该日的日期不展示、不进入分页。
 */
export const getSheetEnd = (endTime?: string): Dayjs => {
  if (endTime?.trim()) {
    const end = dayjs(endTime).startOf("day");
    if (end.isValid()) return end;
  }
  return dayjs().startOf("day");
};

/** 第 page 周起始日（0 = 入院第一周） */
export const getWeekStart = (admissionTime: string, page: number): Dayjs =>
  getAdmissionStart(admissionTime).add(page * DAYS_PER_PAGE, "day");

/** 入院至截止日（含）的总天数 */
export const getTotalDays = (admissionTime: string, endTime?: string): number => {
  const admission = getAdmissionStart(admissionTime);
  const end = getSheetEnd(endTime);
  return Math.max(1, end.diff(admission, "day") + 1);
};

/** 根据入院～截止日计算总周数（每页 7 天；有出院日时末页可不足 7 天） */
export const getTotalPages = (admissionTime: string, endTime?: string): number =>
  Math.max(1, Math.ceil(getTotalDays(admissionTime, endTime) / DAYS_PER_PAGE));

/**
 * 某页实际展示天数。
 * 有出院日时末页截断到出院日；无出院日时仍满 7 天（与原逻辑一致）。
 */
export const getPageDaysCount = (
  admissionTime: string,
  page: number,
  endTime?: string,
): number => {
  if (!endTime?.trim()) return DAYS_PER_PAGE;
  const start = getWeekStart(admissionTime, page);
  const end = getSheetEnd(endTime);
  return Math.max(0, Math.min(DAYS_PER_PAGE, end.diff(start, "day") + 1));
};

/** 当天所在周次（0 起）；若已出院则定位到含出院日的末页 */
export const getTodayWeekPage = (
  admissionTime: string,
  endTime?: string,
): number => {
  const admission = getAdmissionStart(admissionTime);
  const end = getSheetEnd(endTime);
  const today = dayjs().startOf("day");
  const ref = today.isAfter(end) ? end : today;
  const days = ref.diff(admission, "day");
  const page = Math.floor(Math.max(0, days) / DAYS_PER_PAGE);
  return Math.min(page, getTotalPages(admissionTime, endTime) - 1);
};

/** 页码展示项（含省略号），displayPage 从 1 起 */
export const getPageItems = (
  displayPage: number,
  total: number,
): (number | "ellipsis")[] => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const items: (number | "ellipsis")[] = [1];
  if (displayPage <= 4) {
    for (let i = 2; i <= 5; i++) items.push(i);
    items.push("ellipsis", total);
  } else if (displayPage >= total - 3) {
    items.push("ellipsis");
    for (let i = total - 4; i <= total; i++) items.push(i);
  } else {
    items.push(
      "ellipsis",
      displayPage - 1,
      displayPage,
      displayPage + 1,
      "ellipsis",
      total,
    );
  }
  return items;
};

/** protobuf bytes（JSON 多为 base64）→ SVG 文本 */
export const decodeChartBytes = (raw: string | number[]): string => {
  if (Array.isArray(raw)) {
    return new TextDecoder("utf-8").decode(Uint8Array.from(raw));
  }
  const text = raw.trim();
  if (text.startsWith("<") || text.startsWith("<?xml")) {
    return raw;
  }
  try {
    const binary = atob(text);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return raw;
  }
};
