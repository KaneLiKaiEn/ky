import { getSessionId } from "comm/session";
import { useEffect, useState } from "react";
import { App, Button, Select, Typography } from "antd";
import { getUserRoleList, saveUserRoleList } from "@/api/user";
import type { EditorProps } from "../types";
import type { References } from "../references";
import { useResource } from "@/hooks/useResource";
import { useEditor } from "@/hooks/useEditor";
import { assertResult, resultRows } from "@/utils/result";
import { MAX_AUTH, roleDto } from "../dto";
import { parseId } from "../navigation";
import { LoadFeedback, SaveError, RefreshFeedback } from "@/components/Feedback";

export default function RolePanel(
  props: EditorProps & { reference: References },
) {
  const { user, orgId, reference } = props;
  const { message, modal } = App.useApp();
  const editor = useEditor(props);
  const [selected, setSelected] = useState<number[]>([]);
  const resource = useResource(`roles:${orgId}:${user.user_id}`, async () => {
    const [res, roles] = await Promise.all([
      getUserRoleList({ user_id: user.user_id, column_list: "*" }).then(
        assertResult,
      ),
      reference.roles(),
    ]);
    const rows = resultRows(res.role_list).map((row) => ({
      ...row,
      role_id: parseId(row.role_id) ?? undefined,
    }));
    if (rows.some((row) => !row.role_id))
      throw new Error("已有角色授权缺少有效 ID，暂不能编辑");
    return { rows, roles };
  });
  useEffect(() => {
    if (resource.data)
      setSelected(resource.data.rows.map((row) => row.role_id!));
  }, [resource.data]);
  const resourceBlocked = resource.loading || Boolean(resource.error);
  if (!resource.data)
    return <LoadFeedback prefix="user-page" {...resource} retry={resource.reload} />;
  const names = new Map(
    resource.data.roles
      .filter((row) => row.role_id)
      .map((row) => [row.role_id!, row.role_name || String(row.role_id)]),
  );
  for (const row of resource.data.rows)
    if (!names.has(row.role_id!))
      names.set(row.role_id!, row.role_name || String(row.role_id));
  const save = () =>
    editor.run(async () => {
      const requestSessionId = getSessionId();
      if (props.disabled || resourceBlocked) return;
      if (
        !selected.length &&
        resource.data!.rows.length &&
        !(await modal.confirm({
          title: "清空全部角色授权？",
          content: "保存后，该用户的所有角色授权将被移除。",
          okText: "清空并保存",
          cancelText: "继续编辑",
          okButtonProps: { danger: true },
        }))
      )
        return;
      if (!editor.mounted.current || getSessionId() !== requestSessionId) return;
      const rows = roleDto(user, selected, resource.data!.rows, names);
      assertResult(
        await saveUserRoleList({
          user_id: user.user_id,
          delete_row: 0,
          role_list: rows,
        }),
      );
      if (!editor.mounted.current || getSessionId() !== requestSessionId) return;
      editor.dirty(false);
      message.success("角色授权已保存");
      resource.reload();
    });
  return (
    <div className="user-panel">
      <RefreshFeedback prefix="user-page" {...resource} retry={resource.reload} />
      <SaveError prefix="user-page" error={editor.error} />
      <div className="user-panel__intro">
        <Typography.Title level={5}>分配角色</Typography.Title>
        <Typography.Text type="secondary">
          选择用户可使用的角色，最多 {MAX_AUTH} 项。
        </Typography.Text>
      </div>
      <label htmlFor="user-role-select" className="user-panel__label">
        授权角色
      </label>
      <Select
        id="user-role-select"
        className="user-panel__select"
        mode="multiple"
        showSearch
        optionFilterProp="label"
        placeholder="搜索并选择角色"
        options={[...names].map(([value, label]) => ({ value, label }))}
        value={selected}
        disabled={props.disabled || resourceBlocked || editor.saving}
        maxCount={MAX_AUTH}
        onChange={(ids) => {
          setSelected(ids);
          editor.dirty(true);
        }}
      />
      <Typography.Text type="secondary">
        已选择 {selected.length} 项
      </Typography.Text>
      <div className="user-form__actions">
        <Button
          type="primary"
          loading={editor.saving}
          disabled={props.disabled || resourceBlocked}
          onClick={save}
        >
          保存角色
        </Button>
      </div>
    </div>
  );
}
