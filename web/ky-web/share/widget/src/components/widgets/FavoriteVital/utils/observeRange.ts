import dayjs from "dayjs";

export const calcObserveRange = (
  duration?: number,
  unit?: string,
  now = dayjs(),
): { observeStart: string; observeEnd: string } | null => {
  const observeEnd = now.format("YYYY-MM-DD HH:mm:ss");
  const amount = duration ?? 0;

  if (unit === "DAY") {
    return {
      observeStart: now.subtract(amount, "day").format("YYYY-MM-DD HH:mm:ss"),
      observeEnd,
    };
  }
  if (unit === "HOUR") {
    return {
      observeStart: now.subtract(amount, "hour").format("YYYY-MM-DD HH:mm:ss"),
      observeEnd,
    };
  }
  return null;
};
