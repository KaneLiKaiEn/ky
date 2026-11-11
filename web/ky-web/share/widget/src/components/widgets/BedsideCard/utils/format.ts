import { pinyin } from "pinyin-pro";

/** 原文 / 全拼 / 首字母匹配 */
export function checkStringMatch(inputValue: string, label?: string) {
  const text = label || "";
  const inputLower = inputValue.toLowerCase().trim();

  if (text.toLowerCase().includes(inputLower)) {
    return true;
  }

  const fullPinyin = pinyin(text, {
    toneType: "none",
    nonZh: "removed",
  })
    .toLowerCase()
    .replace(/\s/g, "");
  if (fullPinyin.includes(inputLower.replace(/\s/g, ""))) {
    return true;
  }

  const firstLetters = pinyin(text, {
    pattern: "first",
    toneType: "none",
    nonZh: "removed",
  })
    .toLowerCase()
    .replace(/\s/g, "");
  if (firstLetters.includes(inputLower.replace(/\s/g, ""))) {
    return true;
  }

  return false;
}
