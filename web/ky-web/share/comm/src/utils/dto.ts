import { text } from "./value";
export function decodeTags(value: unknown): string[] {
  const values = Array.isArray(value)
    ? value.flatMap((tag) => {
        const raw = text(tag).trim();
        return /^(?:\[[^\[\]]*\]\s*)+$/.test(raw)
          ? [...raw.matchAll(/\[([^\]]*)\]/g)].map((match) => match[1])
          : [raw];
      })
    : [...text(value).matchAll(/\[([^\]]*)\]/g)].map((match) => match[1]);
  return [...new Set(values.map((tag) => tag.trim()).filter(Boolean))];
}

export function encodeTags(value: unknown): string {
  return decodeTags(value)
    .map((tag) => `[${tag}]`)
    .join("");
}

export function dateString(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }
  if (
    typeof value === "object" &&
    "format" in value &&
    typeof value.format === "function"
  ) {
    return text(value.format("YYYY-MM-DD"));
  }
  return text(value);
}

function cleanValue(value: unknown): unknown {
  if (
    value instanceof Date ||
    (value && typeof value === "object" && "$isDayjsObject" in value)
  )
    return dateString(value);
  if (Array.isArray(value)) return value.map(cleanValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(
        ([key]) =>
          key !== "key" &&
          key !== "children" &&
          !key.startsWith("__") &&
          !key.endsWith("_options"),
      )
      .map(([key, nested]) => [
        key,
        key === "sort_no" && typeof nested === "number"
          ? String(nested)
          : cleanValue(nested),
      ]),
  );
}

/** Remove presentation metadata while retaining IDs and unknown server fields. */
export function cleanRow<T extends object>(row: T): T {
  return cleanValue(row) as T;
}

export function withBaseline<T extends object>(
  baseline: T,
  changes: Partial<T>,
): T {
  return cleanRow({ ...baseline, ...changes });
}

/** Submit only fields declared by the selected wire protocol. */
export function pickRow<T extends object>(
  row: T,
  fields: readonly string[],
): T {
  const clean = cleanRow(row) as Record<string, unknown>;
  return Object.fromEntries(
    fields
      .filter((key) => clean[key] !== undefined)
      .map((key) => [key, clean[key]]),
  ) as T;
}
