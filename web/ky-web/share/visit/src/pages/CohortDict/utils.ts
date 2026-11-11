export const createRowKey = () =>
  `new_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export function uniqueBy<T>(
  arr: T[],
  getKey: (item: T) => string | number | undefined,
): T[] {
  const seen = new Set<string | number>();
  const result: T[] = [];
  for (const item of arr) {
    const key = getKey(item);
    if (key == null || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

/** `[男][女]` → `["男", "女"]` */
export function parseBracketTags(value?: string | null): string[] {
  if (!value) return [];
  const matches = value.match(/\[([^\]]+)\]/g);
  return matches ? matches.map((match) => match.slice(1, -1)) : [];
}

/** `["男", "女"]` → `[男][女]` */
export function toBracketTags(values?: string[] | null): string {
  if (!values?.length) return "";
  return values.map((item) => `[${item}]`).join("");
}

export function hasBracketTag(value: string | undefined, tag: string): boolean {
  return Boolean(value?.includes(`[${tag}]`));
}

export function formatGenderLabel(value?: string): string {
  const tags = parseBracketTags(value);
  return tags.length ? tags.join("、") : (value ?? "");
}

export function formatRange(
  min?: string | number | null,
  max?: string | number | null,
  unit?: string,
): string {
  const left = min == null || min === "" ? "" : String(min);
  const right = max == null || max === "" ? "" : String(max);
  if (!left && !right) return "";
  return `${left}～${right}${unit ?? ""}`;
}

export function omitRowKey<T extends { rowKey: string }>(
  row: T,
): Omit<T, "rowKey"> {
  const { rowKey: _rowKey, ...rest } = row;
  return rest;
}
