/** Positive protocol IDs; explicit zero-valued business sentinels stay at their boundary. */
export function id(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  if (typeof value === "string" && !/^\d+$/.test(value.trim())) return null;
  const result = Number(value);
  return Number.isSafeInteger(result) && result > 0 ? result : null;
}
export const text = (value: unknown): string =>
  value == null ? "" : String(value);
export const sameId = (a: unknown, b: unknown): boolean =>
  id(a) !== null && id(a) === id(b);
