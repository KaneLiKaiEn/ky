/** 金额格式化为两位小数字符串 */
export function formatAmount(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  if (Number.isNaN(n)) return "0.00";
  return n.toFixed(2);
}

export function parseAmount(value: string | number | null | undefined): number {
  if (value == null || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isNaN(n) ? 0 : n;
}

/** 向下取整到整数元 */
export function floorToYuan(value: string | number | null | undefined): string {
  return formatAmount(Math.floor(parseAmount(value)));
}

export function combineAmountParts(integerPart: string, decimalPart: string) {
  const intStr = integerPart.replace(/\D/g, "") || "0";
  const decStr = (decimalPart.replace(/\D/g, "") || "0").slice(0, 2);
  return formatAmount(`${intStr}.${decStr.padEnd(2, "0")}`);
}

export function splitAmountParts(amount: string | number) {
  const formatted = formatAmount(amount);
  const [integerPart = "0", decimalPart = "00"] = formatted.split(".");
  return { integerPart, decimalPart };
}

const CN_DIGITS = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"];
const CN_UNITS = ["", "拾", "佰", "仟"];
const CN_BIG_UNITS = ["", "万", "亿"];

/** 0–9999 转中文大写（不含大单位） */
function sectionToChinese(section: number): string {
  let str = "";
  let needZero = false;
  for (let i = 0; i < 4; i++) {
    const digit = Math.floor(section / 10 ** (3 - i)) % 10;
    if (digit === 0) {
      needZero = str.length > 0;
      continue;
    }
    if (needZero) {
      str += CN_DIGITS[0];
      needZero = false;
    }
    str += CN_DIGITS[digit] + CN_UNITS[3 - i];
  }
  return str;
}

/** 非负整数元转中文大写 */
function integerYuanToChinese(num: number): string {
  if (num === 0) return CN_DIGITS[0];

  const sections: number[] = [];
  let n = num;
  while (n > 0) {
    sections.unshift(n % 10000);
    n = Math.floor(n / 10000);
  }

  let result = "";
  const topBigIndex = sections.length - 1;
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]!;
    const bigUnit = CN_BIG_UNITS[topBigIndex - i] ?? "";
    if (section === 0) {
      const hasMore = sections.slice(i + 1).some((s) => s !== 0);
      if (hasMore && result && !result.endsWith(CN_DIGITS[0]!)) {
        result += CN_DIGITS[0];
      }
      continue;
    }
    if (result && section < 1000 && !result.endsWith(CN_DIGITS[0]!)) {
      result += CN_DIGITS[0];
    }
    result += sectionToChinese(section) + bigUnit;
  }
  return result;
}

/**
 * 金额转人民币中文大写。
 * 例：100 → 壹佰元整；100.5 → 壹佰元伍角；100.05 → 壹佰元零伍分；0.55 → 伍角伍分
 */
export function amountToChineseUpper(
  value: string | number | null | undefined,
): string {
  const abs = Math.abs(parseAmount(value));
  const [yuanStr = "0", fenStr = "00"] = formatAmount(abs).split(".");
  const yuan = Number(yuanStr);
  const jiao = Number(fenStr[0] ?? "0");
  const fen = Number(fenStr[1] ?? "0");

  if (yuan === 0 && jiao === 0 && fen === 0) {
    return "零元整";
  }

  let result = "";
  if (yuan > 0) {
    result += `${integerYuanToChinese(yuan)}元`;
  }

  if (jiao === 0 && fen === 0) {
    return `${result}整`;
  }

  if (jiao > 0) {
    result += `${CN_DIGITS[jiao]}角`;
  } else if (yuan > 0 && fen > 0) {
    result += CN_DIGITS[0];
  }

  if (fen > 0) {
    result += `${CN_DIGITS[fen]}分`;
  }

  return result;
}
