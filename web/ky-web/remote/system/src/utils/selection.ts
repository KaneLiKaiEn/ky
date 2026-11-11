/** Zero is reserved for a new, unsaved entity when explicitly allowed. */
export function parseId(value: unknown, allowZero = false): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (!/^\d+$/.test(String(value))) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && (allowZero ? id >= 0 : id > 0) ? id : null;
}
