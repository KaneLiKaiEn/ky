import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  App,
  Button,
  Empty,
  Select,
  Space,
  Spin,
  Table,
  Typography,
} from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  HolderOutlined,
} from "@ant-design/icons";
import { getSessionId } from "comm/session";
import {
  getRoleUserList,
  retrieveUserList,
  saveRoleUserList,
} from "@/api/user";
import { notifyRolesChanged } from "@/pages/RoleManagement/roleEvents";
import type { RoleEditorProps } from "../types";
import { useResource } from "@/hooks/useResource";
import { useEditor } from "@/hooks/useEditor";
import { assertResult, errorText, resultRows } from "@/utils/result";
import { parseId } from "../navigation";
import {
  appendMembers,
  memberDtos,
  memberSignature,
  moveMember,
  normalizeMembers,
  type RoleMember,
} from "../members";
import { LoadFeedback, SaveError, RefreshFeedback } from "@/components/Feedback";

interface MemberState {
  key: string;
  baseline: RoleMember[];
  draft: RoleMember[];
}

export default function MembersPanel(props: RoleEditorProps) {
  const { orgId, role } = props;
  const { message, modal } = App.useApp();
  const editor = useEditor(props);
  const viewSessionId = useRef(getSessionId()).current;
  const key = `members:${orgId}:${role.role_id}`;
  const currentKey = useRef<string | null>(key);
  currentKey.current = key;
  useEffect(() => {
    currentKey.current = key;
    return () => {
      if (currentKey.current === key) currentKey.current = null;
    };
  }, [key]);

  const assertSession = useCallback(
    (sessionId: string | null) => {
      if (sessionId !== viewSessionId || getSessionId() !== sessionId)
        throw new Error("登录会话已变化，请刷新页面后重新编辑角色成员");
    },
    [viewSessionId],
  );
  const sessionChangedWarning = () => {
    message.warning("登录会话已变化，成员操作可能已完成，请刷新页面核实结果");
  };
  const loadMembers = useCallback(
    async (sessionId = getSessionId()) => {
      assertSession(sessionId);
      const response = await getRoleUserList({
        role_id: role.role_id,
        column_list: "*",
      });
      assertSession(sessionId);
      const result = assertResult(response);
      return normalizeMembers(resultRows(result.user_list));
    },
    [role.role_id, assertSession],
  );
  const resource = useResource(key, loadMembers);
  const [state, setState] = useState<MemberState>();
  const [refreshError, setRefreshError] = useState<string>();
  const [draggingId, setDraggingId] = useState<number>();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    clearTimeout(timer.current);
    setSearch("");
    setQuery("");
    setSelectedIds([]);
    setRefreshError(undefined);
    setDraggingId(undefined);
  }, [key]);
  useEffect(() => {
    if (resource.data) {
      setState({ key, baseline: resource.data, draft: resource.data });
      editor.dirty(false);
    }
  }, [resource.data, key, editor.dirty]);

  const draft = state?.key === key ? state.draft : (resource.data ?? []);
  const baseline = state?.key === key ? state.baseline : (resource.data ?? []);
  const dirty = memberSignature(draft) !== memberSignature(baseline);
  useEffect(() => editor.dirty(dirty), [dirty, editor.dirty]);

  const matches = useResource(
    resource.data ? `member-search:${key}:${query}` : null,
    async () => {
      const requestedSessionId = getSessionId();
      assertSession(requestedSessionId);
      const response = await retrieveUserList({
        org_id: orgId,
        retrieve_input: query.trim() || "*",
        retrieve_limit: 100,
        column_list: "user_id,org_id,user_name,user_no,user_code,dept_name",
      });
      assertSession(requestedSessionId);
      const result = assertResult(response);
      return normalizeMembers(
        resultRows(result.user_list).filter(
          (user) => user.org_id == null || parseId(user.org_id) === orgId,
        ),
        false,
      ).slice(0, 100);
    },
  );
  const pendingSearch = search !== query;
  const searchRows = pendingSearch ? [] : (matches.data ?? []);
  const selectedSet = new Set(draft.map((member) => member.user_id));
  const available = searchRows.filter(
    (member) => !selectedSet.has(member.user_id),
  );
  const searchBusy = matches.loading || pendingSearch;

  const changeDraft = (next: RoleMember[]) => {
    editor.dirty(memberSignature(next) !== memberSignature(baseline));
    setState({ key, baseline, draft: next });
    editor.setError(undefined);
  };

  /** A successful write is final even when its read-back fails. */
  const refreshSaved = async (requestedSessionId = getSessionId()) => {
    const requestedKey = key;
    try {
      assertSession(requestedSessionId);
      const members = await loadMembers(requestedSessionId);
      if (
        currentKey.current !== requestedKey ||
        getSessionId() !== requestedSessionId
      )
        return;
      setState((current) => {
        if (!current || current.key !== requestedKey) return current;
        const hasEdits =
          memberSignature(current.draft) !== memberSignature(current.baseline);
        return {
          key: requestedKey,
          baseline: members,
          draft: hasEdits ? current.draft : members,
        };
      });
      setRefreshError(undefined);
    } catch (error) {
      if (
        getSessionId() !== requestedSessionId ||
        requestedSessionId !== viewSessionId
      ) {
        sessionChangedWarning();
        return;
      }
      if (currentKey.current === requestedKey)
        setRefreshError(errorText(error));
    }
  };

  const save = () =>
    editor.run(async () => {
      if (!dirty || props.disabled || resourceBlocked || refreshError) return;
      const requestedSessionId = getSessionId();
      const requestedKey = key;
      assertSession(requestedSessionId);
      if (
        !draft.length &&
        baseline.length &&
        !(await modal.confirm({
          title: "清空全部角色成员？",
          content: "保存后，该角色的全部成员将被移除。",
          okText: "清空并保存",
          cancelText: "继续编辑",
          okButtonProps: { danger: true },
        }))
      )
        return;
      if (currentKey.current !== requestedKey) return;
      assertSession(requestedSessionId);
      const saved = [...draft];
      const userList = memberDtos(saved, role.role_id, role.role_name || "");
      assertSession(requestedSessionId);
      try {
        const response = await saveRoleUserList({
          role_id: role.role_id,
          delete_row: 0,
          user_list: userList,
        });
        if (getSessionId() !== requestedSessionId) {
          sessionChangedWarning();
          return;
        }
        assertResult(response);
      } catch (error) {
        if (getSessionId() !== requestedSessionId) {
          sessionChangedWarning();
          return;
        }
        throw error;
      }
      notifyRolesChanged(orgId, role.role_id);
      if (
        currentKey.current !== requestedKey ||
        getSessionId() !== requestedSessionId
      )
        return;
      setState({ key: requestedKey, baseline: saved, draft: saved });
      editor.dirty(false);
      message.success("角色成员已保存");
      await refreshSaved(requestedSessionId);
    });

  const resourceBlocked = resource.loading || Boolean(resource.error);
  if (!resource.data)
    return <LoadFeedback prefix="role-page" {...resource} retry={resource.reload} />;

  return (
    <div className="role-members">
      <RefreshFeedback prefix="role-page" {...resource} retry={resource.reload} />
      <SaveError prefix="role-page" error={editor.error} />
      {refreshError && (
        <Alert
          className="role-page__error"
          type="warning"
          showIcon
          title="成员已保存，刷新失败"
          description={refreshError}
          action={
            <Button
              disabled={props.disabled || resourceBlocked || editor.saving}
              onClick={() => void editor.run(refreshSaved)}
            >
              重试刷新
            </Button>
          }
        />
      )}
      <div className="role-members__intro">
        <Typography.Title level={5}>角色成员</Typography.Title>
        <Typography.Text type="secondary">
          搜索当前机构用户并加入角色，每次最多显示 100 项。调整顺序后统一保存。
        </Typography.Text>
      </div>
      <div className="role-members__toolbar">
        <Select<number[]>
          className="role-members__search"
          aria-label="搜索并选择机构用户"
          mode="multiple"
          showSearch
          filterOption={false}
          placeholder="搜索用户姓名、工号或代码"
          value={selectedIds}
          searchValue={search}
          disabled={props.disabled || resourceBlocked || editor.saving}
          loading={searchBusy}
          maxTagCount="responsive"
          options={available.map((member) => ({
            value: member.user_id,
            label: `${member.user_name}（${member.user_no || member.user_code || member.user_id}）`,
          }))}
          onSearch={(value) => {
            setSearch(value);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => {
              setQuery(value);
              setSelectedIds([]);
            }, 300);
          }}
          onChange={setSelectedIds}
          autoClearSearchValue={false}
          notFoundContent={
            searchBusy ? (
              <Spin size="small" />
            ) : matches.error ? (
              <Button type="link" onClick={matches.reload}>
                搜索失败，重试
              </Button>
            ) : (
              "暂无可添加用户"
            )
          }
        />
        <Button
          disabled={props.disabled || resourceBlocked || editor.saving || !selectedIds.length || searchBusy}
          onClick={() => {
            const ids = new Set(selectedIds);
            changeDraft(
              appendMembers(
                draft,
                available.filter((member) => ids.has(member.user_id)),
              ),
            );
            setSelectedIds([]);
          }}
        >
          加入所选用户
        </Button>
        <Button
          disabled={props.disabled || resourceBlocked || editor.saving || !available.length || searchBusy}
          onClick={() => {
            changeDraft(appendMembers(draft, available));
            setSelectedIds([]);
          }}
        >
          加入当前结果（{available.length}）
        </Button>
      </div>
      {matches.error && (
        <Alert
          type="warning"
          showIcon
          title="用户搜索失败"
          description={matches.error}
          action={
            <Button disabled={props.disabled || resourceBlocked || editor.saving} onClick={matches.reload}>
              重试
            </Button>
          }
        />
      )}
      <div className="role-members__summary">
        <Typography.Text>
          已添加 {draft.length} 位成员{dirty ? " · 有未保存修改" : ""}
        </Typography.Text>
        <Button
          danger
          disabled={props.disabled || resourceBlocked || editor.saving || !draft.length}
          onClick={() => {
            changeDraft([]);
            setSelectedIds([]);
          }}
        >
          清空成员
        </Button>
      </div>
      <Table<RoleMember>
        className="role-members__table"
        rowKey="user_id"
        size="small"
        pagination={false}
        scroll={{ x: 700 }}
        dataSource={draft}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无角色成员"
            />
          ),
        }}
        onRow={(member, index) => ({
          onDragOver: (event) => {
            if (!editor.saving && draggingId && draggingId !== member.user_id)
              event.preventDefault();
          },
          onDrop: (event) => {
            event.preventDefault();
            if (editor.saving || !draggingId || index == null) return;
            changeDraft(moveMember(draft, draggingId, index));
            setDraggingId(undefined);
          },
          className:
            draggingId === member.user_id
              ? "role-members__row-dragging"
              : undefined,
        })}
        columns={[
          {
            title: "排序",
            key: "order",
            width: 76,
            render: (_, member, index) => (
              <span className="role-members__order">
                <Button
                  type="text"
                  size="small"
                  className="role-members__drag"
                  aria-label={`拖动排序 ${member.user_name}`}
                  icon={<HolderOutlined />}
                  disabled={props.disabled || resourceBlocked || editor.saving}
                  draggable={!editor.saving}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData(
                      "text/plain",
                      String(member.user_id),
                    );
                    setDraggingId(member.user_id);
                  }}
                  onDragEnd={() => setDraggingId(undefined)}
                />
                {index + 1}
              </span>
            ),
          },
          {
            title: "姓名",
            dataIndex: "user_name",
            key: "user_name",
            ellipsis: true,
          },
          {
            title: "工号 / 代码",
            key: "user_no",
            ellipsis: true,
            render: (_, member) => member.user_no || member.user_code || "—",
          },
          {
            title: "科室",
            dataIndex: "dept_name",
            key: "dept_name",
            ellipsis: true,
            render: (value: string | undefined) => value || "—",
          },
          {
            title: "操作",
            key: "actions",
            width: 172,
            render: (_, member, index) => (
              <Space size={4}>
                <Button
                  type="text"
                  size="small"
                  icon={<ArrowUpOutlined />}
                  title="上移"
                  aria-label={`上移 ${member.user_name}`}
                  disabled={props.disabled || resourceBlocked || editor.saving || index === 0}
                  onClick={() =>
                    changeDraft(moveMember(draft, member.user_id, index - 1))
                  }
                />
                <Button
                  type="text"
                  size="small"
                  icon={<ArrowDownOutlined />}
                  title="下移"
                  aria-label={`下移 ${member.user_name}`}
                  disabled={props.disabled || resourceBlocked || editor.saving || index === draft.length - 1}
                  onClick={() =>
                    changeDraft(moveMember(draft, member.user_id, index + 1))
                  }
                />
                <Button
                  type="text"
                  size="small"
                  danger
                  disabled={props.disabled || resourceBlocked || editor.saving}
                  onClick={() =>
                    changeDraft(
                      draft.filter((row) => row.user_id !== member.user_id),
                    )
                  }
                >
                  移除
                </Button>
              </Space>
            ),
          },
        ]}
      />
      <div className="role-form__actions">
        <Button
          type="primary"
          loading={editor.saving}
          disabled={props.disabled || resourceBlocked || Boolean(refreshError) || !dirty}
          onClick={() => void save()}
        >
          保存成员
        </Button>
      </div>
    </div>
  );
}
