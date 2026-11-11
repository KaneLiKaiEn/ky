import type { RolePropertyData } from "@/types/org";

export interface RoleValues {
  role_name: string;
  role_note?: string;
  role_tag?: string[];
  sort_no?: string;
}

export const parseTags = (value?: string): string[] => {
  const tags = [...(value ?? "").matchAll(/\[([^\]]+)\]/g)].map(
    (match) => match[1],
  );
  return tags.length ? tags : (value ?? "").trim().split(/\s+/).filter(Boolean);
};

export function propertyDto(
  orgId: number,
  values: RoleValues,
): RolePropertyData {
  if (!Number.isSafeInteger(orgId) || orgId <= 0)
    throw new Error("请选择有效机构");
  const name = values.role_name?.trim();
  if (!name) throw new Error("请填写角色名称");
  const tags = [
    ...new Set(
      (values.role_tag ?? []).map((tag) => tag.trim()).filter(Boolean),
    ),
  ];
  if (tags.length > 10) throw new Error("角色标签最多 10 个");
  if (tags.some((tag) => /[\[\]]/.test(tag)))
    throw new Error("角色标签不能包含方括号");
  return {
    org_id: orgId,
    role_name: name,
    role_note: values.role_note ?? "",
    role_tag: tags.map((tag) => `[${tag}]`).join(""),
    sort_no: values.sort_no ?? "",
  };
}
