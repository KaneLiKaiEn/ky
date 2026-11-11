import { useEffect, useRef, useState } from "react";
import { Button, Select, Spin } from "antd";
import { retrieveUserList } from "@/api/user";
import type { UserRow } from "@/types/user";
import { useResource } from "@/hooks/useResource";
import { assertResult, resultRows } from "@/utils/result";
import { parseId } from "../navigation";

export default function UserPicker({
  orgId,
  userId,
  user,
  includeInvalid,
  disabled,
  onChange,
}: {
  orgId: number;
  userId: number | null;
  user?: UserRow;
  includeInvalid: boolean;
  disabled: boolean;
  onChange: (id: number | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const users = useResource(
    `users:${orgId}:${includeInvalid}:${query}`,
    async () => {
      const res = assertResult(
        await retrieveUserList({
          org_id: orgId,
          retrieve_input: query || "*",
          retrieve_limit: 100,
          include_invalid: includeInvalid,
          column_list: "*",
        }),
      );
      return resultRows(res.user_list)
        .map((row) => ({
          ...row,
          user_id: parseId(row.user_id) ?? undefined,
          org_id: parseId(row.org_id) ?? undefined,
        }))
        .filter((row) => row.user_id && (!row.org_id || row.org_id === orgId));
    },
  );
  const label = (row: UserRow) =>
    `${row.user_name || "未命名"}（${row.user_no || row.user_id}）`;
  const options = (users.data ?? []).map((row) => ({
    value: row.user_id!,
    label: label(row),
  }));
  if (userId && !options.some((option) => option.value === userId))
    options.unshift({
      value: userId,
      label: user ? label(user) : `用户 ${userId}`,
    });
  else if (user && userId) {
    const option = options.find((row) => row.value === userId);
    if (option) option.label = label(user);
  }
  return (
    <Select
      id="user-picker"
      className="user-page__user-select"
      allowClear
      showSearch
      filterOption={false}
      placeholder={userId === 0 ? "正在新增用户" : "搜索用户姓名或工号"}
      options={options}
      value={userId || undefined}
      searchValue={search}
      loading={users.loading}
      disabled={disabled}
      onSearch={(text) => {
        setSearch(text);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setQuery(text), 300);
      }}
      onChange={(id) => {
        clearTimeout(timer.current);
        setSearch("");
        setQuery("");
        onChange(id ?? null);
      }}
      notFoundContent={
        users.loading ? (
          <Spin size="small" />
        ) : users.error ? (
          <Button type="link" onClick={users.reload}>
            加载失败，点击重试
          </Button>
        ) : (
          "暂无匹配用户"
        )
      }
      popupRender={(menu) => (
        <>
          {menu}
          {users.error && options.length > 0 && (
            <Button type="link" onClick={users.reload}>
              用户检索失败，重试
            </Button>
          )}
        </>
      )}
    />
  );
}
