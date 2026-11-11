import type { BillStatus, BillItemType } from "@/types/linkBill";

/** 收费项目类型选项 */
export const itemTypeOptions: { id: string; name: string; value: BillItemType }[] = [
  { id: "1", name: "药品", value: "DRUG" },
  { id: "2", name: "收费项目", value: "CHARGE" },
  { id: "3", name: "材料", value: "MATERIAL" },
];

/** 类型转中文 */
export function itemTypeToChinese(itemType: string): string {
  switch (itemType) {
    case "CHARGE":
      return "收费项目";
    case "MATERIAL":
      return "材料";
    case "DRUG":
      return "药品";
    default:
      return "未知";
  }
}

/**
 * 精度计算（旧项目使用 decimal.js，新框架未引入该依赖，
 * 这里用 Number 运算近似替代；涉及金额/退费时如精度敏感需重新评估）。
 */
export function calcAdd(num1: number, num2: number): number {
  return Number(num1 || 0) + Number(num2 || 0);
}

export function calcSub(num1: number, num2: number): number {
  return Number(num1 || 0) - Number(num2 || 0);
}

export function calcMul(num1: number, num2: number): number {
  return Number(num1 || 0) * Number(num2 || 0);
}

export function calcDiv(num1: number, num2: number): number {
  if (Number(num2) === 0) throw new Error("Division by zero is not allowed");
  return Number(num1 || 0) / Number(num2);
}

/** 获取当前时间（精确到分），返回 yyyy-MM-dd HH:mm */
export function getCurrentDateTime(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
    now.getHours(),
  )}:${pad(now.getMinutes())}`;
}

/** 将 link_data 标准化为数字数组 */
export function normalizeLinkData(raw: unknown): number[] {
  if (Array.isArray(raw)) {
    return raw.map((v) => Number(v));
  }

  if (typeof raw === "string") {
    const s = raw.trim();
    if (s.startsWith("[") && s.endsWith("]")) {
      try {
        const parsed = JSON.parse(s);
        return Array.isArray(parsed) ? parsed.map((v) => Number(v)) : [];
      } catch {
        return [];
      }
    }
    if (/^\d+$/.test(s)) {
      return [Number(s)];
    }
  }

  if (typeof raw === "number") {
    return [raw];
  }

  return [];
}

/** 计算计费状态：全部已提交为 APPROVE，否则 CHARGE */
export function getBillStatus(rowList: any[]): BillStatus {
  return rowList.length > 0 && rowList.every((item) => Boolean(item?.charge_time))
    ? "APPROVE"
    : "CHARGE";
}

/** 从 create_note 形如 `[xxx:名字]` 中提取名字 */
export function extractName(input: string): string | null {
  const match = input?.match(/:(.*?)\]/);
  return match ? match[1] : null;
}

/** 格式化残余量 */
export function formatRemainQuantity(item: any): string {
  const remainQuantity = parseFloat(item.remain_quantity);

  if (
    !item.remain_quantity ||
    !item.dosage_unit ||
    Number.isNaN(remainQuantity) ||
    remainQuantity === 0
  ) {
    return "-";
  }

  return `${item.remain_quantity}${item.dosage_unit}`;
}
