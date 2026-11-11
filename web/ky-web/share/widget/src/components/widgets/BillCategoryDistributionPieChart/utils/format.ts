export const EMPTY_VALUE_LABEL = "-";

export const formatBillAmount = (value: number): string =>
  value.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const formatPercent = (value: number): string => `${value.toFixed(2)}%`;

export const formatNullableBillAmount = (value: number | null): string =>
  value == null ? EMPTY_VALUE_LABEL : formatBillAmount(value);

export const formatNullablePercent = (value: number | null): string =>
  value == null ? EMPTY_VALUE_LABEL : formatPercent(value);
