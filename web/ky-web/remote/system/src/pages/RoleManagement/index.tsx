import { useEffect, useState, type CSSProperties } from "react";
import {
  Alert,
  App,
  Avatar,
  Button,
  Empty,
  Select,
  Space,
  Tabs,
  Tag,
  Typography,
  theme,
} from "antd";
import { ReloadOutlined, TeamOutlined } from "@ant-design/icons";
import { getSessionId } from "comm/session";
import {
  deleteRole,
  getRoleList,
  getRoleProperty,
} from "@/api/org";
import type { RoleRow } from "@/types/org";
import { notifyRolesChanged } from "@/pages/RoleManagement/roleEvents";
import PropertyForm from "./components/PropertyForm";
import MembersPanel from "./components/MembersPanel";
import { LoadFeedback, SaveError, RefreshFeedback } from "@/components/Feedback";
import { useResource } from "@/hooks/useResource";
import { useOrgOptions } from "@/hooks/useOrgOptions";
import { useRoleNavigation } from "./hooks/useRoleNavigation";
import { parseId, sameSelection } from "./navigation";
import { assertResult, errorText, resultRows } from "@/utils/result";
import type { RoleTab } from "./types";
import "./style.scss";

type SavedRole = RoleRow & { role_id: number };

export default function RoleManagement() {
  const { message, modal } = App.useApp();
  const { token } = theme.useToken();
  const nav = useRoleNavigation();
  const { orgId, roleId, tab } = nav.selection;
  const [savedRole, setSavedRole] = useState<SavedRole>();
  const [editorRevision, setEditorRevision] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();
  const bootstrap = useOrgOptions();
  const { sessionId } = bootstrap;

  useEffect(() => {
    if (!bootstrap.data) return;
    const current = nav.selectionRef.current;
    if (bootstrap.data.orgs.some((row) => row.org_id === current.orgId)) return;
    const nextOrgId =
      bootstrap.data.orgs.find(
        (row) => row.org_id === bootstrap.data!.sessionOrgId,
      )?.org_id ??
      bootstrap.data.orgs[0]?.org_id ??
      null;
    if (nextOrgId !== current.orgId)
      nav.commit({ orgId: nextOrgId, roleId: null, tab: "property" }, true);
  }, [bootstrap.data, orgId, nav.commit, nav.selectionRef]);

  const validOrg = Boolean(
    orgId && bootstrap.data?.orgs.some((row) => row.org_id === orgId),
  );
  const roles = useResource(
    validOrg ? `roles:${sessionId}:${orgId}` : null,
    async () => {
      const response = assertResult(
        await getRoleList({ org_id: orgId!, column_list: "*" }),
      );
      const rows = resultRows(response.role_list).map((row) => ({
        ...row,
        role_id: parseId(row.role_id),
        org_id: parseId(row.org_id) ?? orgId!,
      }));
      if (rows.some((row) => !row.role_id || row.org_id !== orgId))
        throw new Error("接口返回了无效角色或其他机构的角色，请重试");
      const seen = new Set<number>();
      return rows.filter((row) => {
        if (seen.has(row.role_id!)) return false;
        seen.add(row.role_id!);
        return true;
      }) as SavedRole[];
    },
  );
  useEffect(() => {
    const current = nav.selectionRef.current;
    if (
      !validOrg ||
      !roles.data ||
      current.orgId !== orgId ||
      current.roleId !== null
    )
      return;
    const id = roles.data[0]?.role_id;
    if (id) nav.commit({ orgId, roleId: id, tab: "property" }, true);
  }, [roles.data, orgId, validOrg, nav.commit, nav.selectionRef]);

  const detail = useResource(
    validOrg && roleId ? `role:${sessionId}:${orgId}:${roleId}` : null,
    async () => {
      const response = assertResult(
        await getRoleProperty({ role_id: roleId!, column_list: "*" }),
      );
      const row = response.role_property;
      if (!row || parseId(row.role_id) !== roleId)
        throw new Error("角色不存在或接口未返回有效角色属性，请重新选择");
      if (row.org_id != null && parseId(row.org_id) !== orgId)
        throw new Error("该角色不属于当前机构，请重新选择");
      return { ...row, role_id: roleId!, org_id: orgId! };
    },
  );
  useEffect(() => {
    // Only a newly loaded snapshot supersedes an optimistic successful save.
    if (detail.data)
      setSavedRole((previous) =>
        previous?.role_id === detail.data!.role_id &&
        previous.org_id === detail.data!.org_id
          ? undefined
          : previous,
      );
  }, [detail.data]);
  useEffect(() => setDeleteError(undefined), [orgId, roleId]);
  useEffect(() => setSavedRole(undefined), [sessionId]);

  const optimisticRole =
    savedRole?.role_id === roleId && savedRole.org_id === orgId
      ? savedRole
      : undefined;
  const role: SavedRole | undefined =
    roleId === 0
      ? { role_id: 0, org_id: orgId ?? undefined }
      : (optimisticRole ?? detail.data);
  const saved = (row: SavedRole) => {
    if (!nav.mounted.current) return;
    nav.onDirtyChange(false);
    setSavedRole(row);
    roles.mutate((rows = []) =>
      rows.some((item) => item.role_id === row.role_id)
        ? rows.map((item) =>
            item.role_id === row.role_id ? { ...item, ...row } : item,
          )
        : [...rows, row],
    );
    if (roleId === row.role_id)
      detail.mutate(() => ({ ...row, org_id: orgId! }));
    nav.commit(
      { orgId: row.org_id!, roleId: row.role_id, tab: "property" },
      true,
    );
    setEditorRevision((value) => value + 1);
    roles.reload();
  };

  const refresh = async () => {
    if (nav.isBusy()) return;
    const selection = { ...nav.selectionRef.current };
    if (
      !(await nav.allowDiscard()) ||
      !nav.mounted.current ||
      nav.isBusy() ||
      !sameSelection(selection, nav.selectionRef.current)
    )
      return;
    nav.onDirtyChange(false);
    setEditorRevision((value) => value + 1);
    // Existing editor content is replaced only after the discard guard passed.
    setSavedRole(undefined);
    if (validOrg) {
      roles.reload();
      if (selection.roleId) detail.reload();
    } else bootstrap.reload();
  };

  const handleDelete = async () => {
    if (!roleId || !role || nav.isBusy()) return;
    const id = roleId;
    const org = orgId!;
    const requestSessionId = getSessionId();
    const accepted = await modal.confirm({
      title: "删除当前角色？",
      content: `确定删除“${role.role_name || id}”？该角色的成员关联也将被移除，当前未保存的修改将丢弃。`,
      okText: "删除角色",
      cancelText: "取消",
      okButtonProps: { danger: true },
    });
    if (
      !accepted ||
      !nav.mounted.current ||
      nav.isBusy() ||
      getSessionId() !== requestSessionId ||
      nav.selectionRef.current.orgId !== org ||
      nav.selectionRef.current.roleId !== id
    )
      return;
    nav.setPageBusy(true);
    setDeleting(true);
    setDeleteError(undefined);
    try {
      assertResult(await deleteRole({ role_id: id }));
      if (getSessionId() !== requestSessionId) return;
      notifyRolesChanged(org, id);
      if (!nav.mounted.current) return;
      nav.onDirtyChange(false);
      setSavedRole(undefined);
      const remaining = (roles.data ?? []).filter((row) => row.role_id !== id);
      roles.mutate(() => remaining);
      nav.commit(
        { orgId: org, roleId: remaining[0]?.role_id ?? null, tab: "property" },
        true,
      );
      message.success("角色已删除");
      roles.reload();
    } catch (error) {
      if (nav.mounted.current && getSessionId() === requestSessionId)
        setDeleteError(errorText(error));
    } finally {
      if (nav.mounted.current) {
        setDeleting(false);
        nav.setPageBusy(false);
      }
    }
  };

  const options = (roles.data ?? []).map((row) => ({
    value: row.role_id,
    label: row.role_name || `角色 ${row.role_id}`,
    searchText: [
      row.role_name,
      row.role_no,
      row.role_code,
      row.kb_code,
      row.role_id,
    ]
      .join(" ")
      .toLocaleLowerCase(),
  }));
  if (roleId && !options.some((option) => option.value === roleId))
    options.unshift({
      value: roleId,
      label: role?.role_name || `角色 ${roleId}`,
      searchText: `${role?.role_name ?? ""} ${roleId}`.toLocaleLowerCase(),
    });
  const editorProps = {
    orgId: orgId!,
    role: role!,
    onDirtyChange: nav.onDirtyChange,
    onBusyChange: nav.onBusyChange,
    disabled: bootstrap.loading || Boolean(bootstrap.error) || (roleId !== 0 && (detail.loading || Boolean(detail.error))),
  };

  return (
    <section
      className="role-page"
      style={
        {
          "--role-bg": token.colorBgContainer,
          "--role-border": token.colorBorderSecondary,
          "--role-fill": token.colorFillAlter,
          "--role-primary": token.colorPrimary,
        } as CSSProperties
      }
    >
      <div className="role-page__toolbar">
        <div className="role-page__field">
          <label htmlFor="role-org-picker">机构</label>
          <Select
            id="role-org-picker"
            showSearch
            optionFilterProp="label"
            placeholder="请选择机构"
            value={validOrg ? orgId : undefined}
            options={(bootstrap.data?.orgs ?? []).map((row) => ({
              value: row.org_id!,
              label: row.org_name || `机构 ${row.org_id}`,
            }))}
            loading={bootstrap.loading}
            disabled={nav.busy || bootstrap.loading}
            onChange={(id) =>
              void nav.transition({ orgId: id, roleId: null, tab: "property" })
            }
          />
        </div>
        <div className="role-page__field role-page__field--role">
          <label htmlFor="role-picker">角色</label>
          <Select
            id="role-picker"
            showSearch
            placeholder={
              !validOrg
                ? "请先选择机构"
                : roleId === 0
                  ? "新增角色（未保存）"
                  : "搜索并选择角色"
            }
            value={roleId || undefined}
            options={options}
            filterOption={(input, option) =>
              (option?.searchText ?? "").includes(
                input.trim().toLocaleLowerCase(),
              )
            }
            loading={roles.loading}
            disabled={!validOrg || nav.busy || (roles.loading && !roles.data)}
            onChange={(id) =>
              void nav.transition({ orgId, roleId: id, tab: "property" })
            }
            notFoundContent={
              roles.loading
                ? "正在加载角色"
                : roles.error
                  ? "角色加载失败，请重试"
                  : "暂无角色"
            }
          />
        </div>
        <Space className="role-page__actions" wrap>
          <Button
            icon={<ReloadOutlined />}
            disabled={
              nav.busy || bootstrap.loading || roles.loading || detail.loading
            }
            onClick={() => void refresh()}
          >
            刷新
          </Button>
          <Button
            type="primary"
            disabled={!validOrg || nav.busy || roleId === 0}
            onClick={() =>
              void nav.transition({ orgId, roleId: 0, tab: "property" })
            }
          >
            新增角色
          </Button>
          <Button
            danger
            loading={deleting}
            disabled={!roleId || !role || nav.busy || detail.loading || Boolean(detail.error)}
            onClick={() => void handleDelete()}
          >
            删除角色
          </Button>
        </Space>
      </div>
      <div className="role-page__content">
        <SaveError prefix="role-page" error={deleteError} />
        {bootstrap.data && <RefreshFeedback prefix="role-page" {...bootstrap} retry={bootstrap.reload} />}
        {roles.error && (
          <Alert
            className="role-page__error"
            type="warning"
            showIcon
            title="角色列表刷新失败"
            description={roles.error}
            action={
              <Button onClick={roles.reload} loading={roles.loading}>
                重试
              </Button>
            }
          />
        )}
        {!bootstrap.data && (bootstrap.loading || bootstrap.error) ? (
          <LoadFeedback prefix="role-page" {...bootstrap} retry={bootstrap.reload} />
        ) : !validOrg ? (
          <Empty description="暂无可用机构" />
        ) : roleId === null ? (
          roles.loading ? (
            <LoadFeedback prefix="role-page" {...roles} retry={roles.reload} />
          ) : (
            <Empty
              description={
                roles.error
                  ? "角色列表暂不可用，请重试"
                  : "暂无角色，可点击顶部按钮新增角色"
              }
            />
          )
        ) : !role ? (
          <LoadFeedback prefix="role-page" {...detail} retry={detail.reload} />
        ) : (
          <>
            {roleId !== 0 && <RefreshFeedback prefix="role-page" {...detail} retry={detail.reload} />}
            <div className="role-page__summary">
              <Avatar size={44} icon={<TeamOutlined />} />
              <div>
                <Space wrap>
                  <Typography.Title level={5}>
                    {roleId === 0 ? "新增角色" : role.role_name || "未命名角色"}
                  </Typography.Title>
                  <Tag>{roleId === 0 ? "待创建" : `ID ${roleId}`}</Tag>
                </Space>
                <Typography.Paragraph type="secondary">
                  {
                    bootstrap.data?.orgs.find((row) => row.org_id === orgId)
                      ?.org_name
                  }
                </Typography.Paragraph>
              </div>
            </div>
            <Tabs
              activeKey={tab}
              items={[
                { key: "property", label: "角色属性", disabled: nav.busy },
                {
                  key: "members",
                  label: "角色成员",
                  disabled: !roleId || nav.busy,
                },
              ]}
              onChange={(key) =>
                void nav.transition({ orgId, roleId, tab: key as RoleTab })
              }
            />
            <div
              inert={editorProps.disabled}
              aria-busy={detail.loading}
              key={`${sessionId}:${orgId}:${roleId}:${tab}:${editorRevision}`}
            >
              {tab === "members" && roleId ? (
                <MembersPanel {...editorProps} />
              ) : (
                <PropertyForm {...editorProps} onSaved={saved} />
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
