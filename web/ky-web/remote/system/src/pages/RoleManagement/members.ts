import { parseId } from "./navigation";

export interface RoleMember {
  user_id: number;
  user_name: string;
  user_no?: string;
  user_code?: string;
  dept_name?: string;
}

interface MemberInput {
  user_id?: unknown;
  user_name?: unknown;
  user_no?: string;
  user_code?: string;
  dept_name?: string;
}

/** Keep server order and original names; malformed saved members must not disappear. */
export function normalizeMembers(
  rows: readonly MemberInput[],
  strict = true,
): RoleMember[] {
  const seen = new Set<number>();
  const members: RoleMember[] = [];
  for (const row of rows) {
    const id = parseId(row.user_id);
    if (!id || typeof row.user_name !== "string" || !row.user_name.trim()) {
      if (strict)
        throw new Error(
          "已有成员缺少有效用户 ID 或姓名，暂不能编辑，请检查成员数据",
        );
      continue;
    }
    if (seen.has(id)) continue;
    seen.add(id);
    members.push({
      user_id: id,
      user_name: row.user_name,
      user_no: row.user_no,
      user_code: row.user_code,
      dept_name: row.dept_name,
    });
  }
  return members;
}

export function appendMembers(
  current: readonly RoleMember[],
  additions: readonly RoleMember[],
): RoleMember[] {
  return normalizeMembers([...current, ...additions]);
}

export function moveMember(
  members: readonly RoleMember[],
  userId: number,
  targetIndex: number,
): RoleMember[] {
  const from = members.findIndex((member) => member.user_id === userId);
  if (
    from < 0 ||
    targetIndex < 0 ||
    targetIndex >= members.length ||
    from === targetIndex
  )
    return [...members];
  const next = [...members];
  const [member] = next.splice(from, 1);
  next.splice(targetIndex, 0, member);
  return next;
}

export function memberSignature(members: readonly RoleMember[]): string {
  return JSON.stringify(
    members.map(({ user_id, user_name }) => [user_id, user_name]),
  );
}

export function memberDtos(
  members: readonly RoleMember[],
  roleId: number,
  roleName: string,
) {
  if (!parseId(roleId)) throw new Error("角色 ID 无效，请重新选择角色");
  if (!roleName.trim()) throw new Error("角色名称为空，请先保存角色属性");
  return normalizeMembers(members).map((member, index) => ({
    user_id: member.user_id,
    role_id: roleId,
    role_name: roleName,
    user_name: member.user_name,
    sort_no: String(index).padStart(3, "0"),
  }));
}
