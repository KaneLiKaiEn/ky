import { text } from "./value";
export const errorText = (error: unknown): string => {
  const message = error instanceof Error ? error.message : text(error);
  return message || "操作失败，请重试";
};
/** Omitted repeated fields from the protobuf gateway represent an empty set. */
export const resultRows = <T>(rows?: T[] | null): T[] => rows ?? [];
