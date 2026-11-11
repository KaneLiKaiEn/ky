const WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const CHECK_CODES = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"];

/** 18 位身份证校验，规则与旧 patient/src/utils/custom/idcard.js 一致 */
export const verifyChineseIdCard = (no?: string) => {
  if (!no || no.length !== 18) return false;
  let sum = 0;
  for (let i = 0; i < 17; i += 1) {
    const digit = Number(no.charAt(i));
    if (Number.isNaN(digit)) return false;
    sum += digit * WEIGHTS[i];
  }
  return no.charAt(17).toUpperCase() === CHECK_CODES[sum % 11];
};

export interface ChineseIdCardInfo {
  /** 男 / 女 */
  gender: "男" | "女";
  /** YYYY-MM-DD */
  birthDate: string;
  /** 旧页从日期对象取出的时分，日期不含时间时为 00:00 */
  birthTime: string;
}

/**
 * 校验通过后拆出性别和出生日期。
 * 性别取第 17 位：奇数男、偶数女。出生时间固定 00:00，与旧页回填一致。
 */
export const parseChineseIdCard = (no?: string): ChineseIdCardInfo | null => {
  if (!verifyChineseIdCard(no) || !no) return null;
  const birth = no.slice(6, 14);
  const year = birth.slice(0, 4);
  const month = birth.slice(4, 6);
  const day = birth.slice(6, 8);
  const birthDate = `${year}-${month}-${day}`;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    parsed.getFullYear() !== Number(year) ||
    parsed.getMonth() !== Number(month) - 1 ||
    parsed.getDate() !== Number(day)
  ) {
    return null;
  }
  const genderCode = Number(no.slice(16, 17));
  return {
    gender: genderCode % 2 === 1 ? "男" : "女",
    birthDate,
    birthTime: "00:00",
  };
};
