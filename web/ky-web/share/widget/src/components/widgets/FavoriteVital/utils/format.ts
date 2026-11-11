import dayjs from "dayjs";

export const formatObserveTime = (value?: string): string => {
  if (!value) return "-";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm") : value;
};

export const isAbnormalValue = (
  observeValue?: string,
  valueMin?: string,
  valueMax?: string,
): boolean => {
  const value = Number(observeValue);
  if (!Number.isFinite(value)) return false;
  const min = Number(valueMin);
  const max = Number(valueMax);
  if (Number.isFinite(min) && value < min) return true;
  if (Number.isFinite(max) && value > max) return true;
  return false;
};

export const getVitalSignRowKey = (item: {
  observe_id?: number;
  elem_id?: number;
  elem_name?: string;
}) =>
  String(
    item.observe_id ??
      item.elem_id ??
      item.elem_name ??
      "vital-unknown",
  );
