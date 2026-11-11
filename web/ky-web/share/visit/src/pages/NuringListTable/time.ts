import dayjs, { type Dayjs } from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import type { ShiftType } from "./types";

dayjs.extend(isBetween);

export function filterTimesByType(
  originalTimes: string[],
  type: ShiftType,
  date: Dayjs,
) {
  const base = date.startOf("day");
  const dayStart = base.hour(8);
  const dayEnd = base.hour(19);
  const nightStart = base.hour(20);
  const nightEnd = base.add(1, "day").hour(7);

  return originalTimes.filter((time) => {
    const current = dayjs(time);
    if (type === "all") {
      return current.isBetween(dayStart, nightEnd, null, "[]");
    }
    if (type === "day") {
      return current.isBetween(dayStart, dayEnd, null, "[]");
    }
    if (type === "night") {
      return current.isBetween(nightStart, nightEnd, null, "[]");
    }
    return true;
  });
}

export const mergeTimeList = (
  originalTimes: string[],
  extraTimes: string[],
): string[] => {
  const set = new Set<string>(originalTimes);
  extraTimes.forEach((time) => {
    const normalized = dayjs(time).second(0).format("YYYY-MM-DD HH:mm:ss");
    set.add(normalized);
  });
  return Array.from(set).sort(
    (a, b) => dayjs(a).valueOf() - dayjs(b).valueOf(),
  );
};

export const generateTimeList = (currentDate: string | Date) => {
  const start = dayjs(currentDate).startOf("day").add(8, "hour");
  return Array.from({ length: 24 }, (_, index) =>
    start.add(index, "hour").format("YYYY-MM-DD HH:mm:ss"),
  );
};

export const mergeDateWithNowTime = (date: Dayjs): Dayjs => {
  const now = dayjs();
  return date.hour(now.hour()).minute(now.minute()).second(now.second());
};

export const getShiftByTime = (dayStartHour = 8, dayEndHour = 20): ShiftType => {
  const currentHour = dayjs().hour();
  if (currentHour >= dayStartHour && currentHour < dayEndHour) {
    return "day";
  }
  return "night";
};

export const getQueryRange = (date: Dayjs) => {
  const now = dayjs().second(0);
  const start = date.hour(7).minute(1).second(0).format("YYYY-MM-DD HH:mm:ss");
  let end = date
    .add(1, "day")
    .hour(7)
    .minute(0)
    .second(0)
    .format("YYYY-MM-DD HH:mm:ss");
  if (now.isBefore(end)) {
    end = now.format("YYYY-MM-DD HH:mm:ss");
  }
  return { start, end };
};
