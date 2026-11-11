import type {
  NewUserReq,
  UserDeptData,
  UserDeptRow,
  UserRoleData,
  UserRoleRow,
  UserRow,
} from "@/types/user";

export const MAX_AUTH = 15;
export const PHOTO_LIMIT = 20 * 1024 * 1024;
export const WORK_TYPES = [
  { label: "医疗", value: "DOCTOR" },
  { label: "护理", value: "NURSE" },
  { label: "药学", value: "MEDICINE" },
  { label: "医技", value: "TECHNOLOGY" },
  { label: "其他", value: "OTHER" },
];

export const newUserDefaults = (orgId: number): UserRow => ({
  user_id: 0,
  org_id: orgId,
  user_gender: "未知",
  work_type: "OTHER",
  valid_start: "2000-01-01",
  valid_end: "2099-12-31",
});

export const parseTags = (value?: string) =>
  [...(value ?? "").matchAll(/\[([^\]]+)\]/g)].map((match) => match[1]);

export const serializeTags = (values: string[] = []) =>
  [...new Set(values)].map((value) => `[${value}]`).join("");

export function generateUserNo(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

const editableStrings = [
  "user_no",
  "user_name",
  "user_gender",
  "user_dob",
  "user_idno",
  "user_telno",
  "work_title",
  "work_date",
  "work_level",
  "work_type",
  "skill_level",
  "user_code",
  "valid_start",
  "valid_end",
  "sort_no",
  "dept_name",
] as const;

/** Whitelist form fields, preserve snapshot fields, and send explicit clears. */
export function propertyDto(
  snapshot: UserRow,
  values: UserRow,
  tags: string[],
): UserRow {
  const result: UserRow = { ...snapshot };
  for (const key of editableStrings) result[key] = values[key] ?? "";
  for (const key of ["dept_id", "employee_id", "student_id"] as const)
    result[key] = values[key] ?? 0;
  result.user_tag = serializeTags(tags);
  return result;
}

export const newUserDto = (property: UserRow): NewUserReq => ({
  ...property,
  user_id: 0,
});

export function roleDto(
  user: UserRow,
  ids: number[],
  originals: UserRoleRow[],
  names: Map<number, string>,
): UserRoleData[] {
  if (new Set(ids).size !== ids.length) throw new Error("不能重复分配同一角色");
  return ids.map((id) => {
    const original = originals.find((row) => Number(row.role_id) === id);
    const name = names.get(id) ?? original?.role_name;
    if (!id || !name) throw new Error("请选择有效角色");
    return {
      ...original,
      user_id: user.user_id!,
      user_name: user.user_name ?? "",
      role_id: id,
      role_name: name,
    };
  });
}

export function deptDto(userId: number, rows: UserDeptRow[]): UserDeptData[] {
  const keys = new Set<string>();
  return rows.map((row) => {
    if (!row.org_id || !row.dept_id || !row.dept_name || !row.dept_type)
      throw new Error("请选择完整的科室类型和科室");
    const key = `${row.org_id}:${row.dept_type}:${row.dept_id}`;
    if (keys.has(key)) throw new Error("不能重复授权同一科室");
    keys.add(key);
    return {
      ...row,
      user_id: userId,
      org_id: row.org_id,
      dept_id: row.dept_id,
      dept_name: row.dept_name,
      dept_type: row.dept_type,
    };
  });
}

export function photoBase64(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value;
  if (
    Array.isArray(value) &&
    value.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255)
  ) {
    let binary = "";
    for (let i = 0; i < value.length; i += 8192)
      binary += String.fromCharCode(...value.slice(i, i + 8192));
    return btoa(binary);
  }
  throw new Error("头像数据格式无效，请重试");
}

export function photoFormat(name: string, type: string): string | null {
  const ext = name.split(".").pop()?.toLowerCase();
  const formats: Record<string, string[]> = {
    jpg: ["image/jpeg"],
    jpeg: ["image/jpeg"],
    png: ["image/png"],
    gif: ["image/gif"],
    webp: ["image/webp"],
  };
  return ext && formats[ext]?.includes(type)
    ? ext === "jpeg"
      ? "jpg"
      : ext
    : null;
}
