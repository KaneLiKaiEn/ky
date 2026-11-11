import type { PrepayType } from "@/types/account";

export const PREPAY_TYPE_OPTIONS: { value: PrepayType; label: string }[] = [
  { value: "O", label: "门诊" },
  { value: "I", label: "住院" },
  { value: "S", label: "膳食" },
];

export const PREPAY_TYPE_LABEL: Record<string, string> = {
  O: "门诊",
  I: "住院",
  S: "膳食",
  "*": "统一",
};

export const QUICK_AMOUNTS = [10, 20, 30, 50, 100, 200, 500, 1000];
