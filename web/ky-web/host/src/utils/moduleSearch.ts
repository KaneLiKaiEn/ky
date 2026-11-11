import PinyinMatch from "pinyin-match";

/** 按文本匹配：支持中文、拼音全拼与首字母 */
export const matchByPinyin = (text: string, keyword: string): boolean => {
  const kw = keyword.trim();
  if (!kw) return true;
  return PinyinMatch.match(text, kw) !== false;
};
