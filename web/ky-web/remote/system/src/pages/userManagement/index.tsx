import { getSessionId } from "comm/session";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  App,
  Avatar,
  Button,
  Empty,
  Select,
  Space,
  Switch,
  Tabs,
  Tag,
  Typography,
  theme,
} from "antd";
import { UserOutlined } from "@ant-design/icons";
import { deleteUser, getUserProperty } from "@/api/user";
import type { UserRow } from "@/types/user";
import { createReferences } from "./references";
import { newUserDefaults } from "./dto";
import { parseId } from "./navigation";
import { assertResult, errorText } from "@/utils/result";
import { useResource } from "@/hooks/useResource";
import { useOrgOptions } from "@/hooks/useOrgOptions";
import { useUserNavigation } from "./hooks/useUserNavigation";
import type { UserTab } from "./types";
import UserPicker from "./components/UserPicker";
import PropertyForm from "./components/PropertyForm";
import RolePanel from "./components/RolePanel";
import DepartmentPanel from "./components/DepartmentPanel";
import PasswordPanel from "./components/PasswordPanel";
import AvatarPanel from "./components/AvatarPanel";
import { LoadFeedback, SaveError, RefreshFeedback } from "@/components/Feedback";
import "./style.scss";

export default function UserManagement() {
  const { modal, message } = App.useApp();
  const { token } = theme.useToken();
  const nav = useUserNavigation();
  const { orgId, userId, tab } = nav.selection;
  const [includeInvalid, setIncludeInvalid] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();
  const [savedUser, setSavedUser] = useState<UserRow>();
  const [editorRevision, setEditorRevision] = useState(0);
  const bootstrap = useOrgOptions();
  const { sessionId } = bootstrap;
  useEffect(() => {
    if (!bootstrap.data) return;
    const current = nav.selectionRef.current;
    if (bootstrap.data.orgs.some((org) => org.org_id === current.orgId)) return;
    const nextId =
      bootstrap.data.orgs.find(
        (org) => org.org_id === bootstrap.data!.sessionOrgId,
      )?.org_id ??
      bootstrap.data.orgs[0]?.org_id ??
      null;
    nav.commit({ orgId: nextId, userId: null, tab: "property" }, true);
  }, [bootstrap.data, orgId, nav.commit, nav.selectionRef]);
  useEffect(() => {
    setSavedUser(undefined);
    setDeleteError(undefined);
  }, [orgId, userId, sessionId]);
  const validOrg = Boolean(
    orgId && bootstrap.data?.orgs.some((org) => org.org_id === orgId),
  );
  const reference = useMemo(() => createReferences(orgId ?? 0), [orgId, sessionId]);
  const defaults = useMemo(() => newUserDefaults(orgId ?? 0), [orgId]);
  const detail = useResource(
    validOrg && userId ? `user:${sessionId}:${orgId}:${userId}` : null,
    async () => {
      const res = assertResult(
        await getUserProperty({ user_id: userId!, column_list: "*" }),
      );
      const row = res.user_property;
      if (!row || parseId(row.user_id) !== userId)
        throw new Error("用户不存在或接口未返回有效用户属性");
      if (row.org_id != null && parseId(row.org_id) !== orgId)
        throw new Error("该用户不属于当前机构，请重新选择");
      return {
        ...row,
        user_id: userId!,
        org_id: orgId!,
        dept_id: parseId(row.dept_id) ?? undefined,
        employee_id: parseId(row.employee_id) ?? undefined,
        student_id: parseId(row.student_id) ?? undefined,
      };
    },
  );
  const user =
    userId === 0
      ? defaults
      : savedUser?.user_id === userId && savedUser.org_id === orgId
        ? savedUser
        : detail.data;
  const saved = (row: UserRow) => {
    nav.onDirtyChange(false);
    setSavedUser(row);
    setEditorRevision((value) => value + 1);
    nav.commit(
      { orgId: row.org_id!, userId: row.user_id!, tab: "property" },
      true,
    );
  };
  const handleDelete = async () => {
    if (!userId || !user || nav.isBusy()) return;
    const id = userId;
    const org = orgId;
    const requestSessionId = getSessionId();
    const accepted = await modal.confirm({
      title: "删除当前用户？",
      content: `确定删除“${user.user_name || user.user_no || id}”？当前未保存的修改也将丢弃。`,
      okText: "删除用户",
      cancelText: "取消",
      okButtonProps: { danger: true },
    });
    if (
      !accepted ||
      !nav.mounted.current ||
      getSessionId() !== requestSessionId ||
      nav.isBusy() ||
      nav.selectionRef.current.userId !== id ||
      nav.selectionRef.current.orgId !== org
    )
      return;
    nav.setPageBusy(true);
    setDeleting(true);
    setDeleteError(undefined);
    try {
      assertResult(await deleteUser({ user_id: id }));
      if (!nav.mounted.current || getSessionId() !== requestSessionId) return;
      nav.onDirtyChange(false);
      setSavedUser(undefined);
      nav.commit({ orgId: org, userId: null, tab: "property" }, true);
      setEditorRevision((value) => value + 1);
      message.success("用户已删除");
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
  const common = {
    orgId: orgId!,
    user: user!,
    onDirtyChange: nav.onDirtyChange,
    onBusyChange: nav.onBusyChange,
    disabled: bootstrap.loading || Boolean(bootstrap.error) || (userId !== 0 && (detail.loading || Boolean(detail.error))),
  };
  const panel = () => {
    if (!user) return null;
    switch (tab) {
      case "role":
        return <RolePanel {...common} reference={reference} />;
      case "dept":
        return <DepartmentPanel {...common} reference={reference} />;
      case "password":
        return <PasswordPanel {...common} />;
      case "avatar":
        return <AvatarPanel {...common} />;
      default:
        return (
          <PropertyForm {...common} reference={reference} onSaved={saved} />
        );
    }
  };
  return (
    <section
      className="user-page"
      style={
        {
          "--user-bg": token.colorBgContainer,
          "--user-border": token.colorBorderSecondary,
          "--user-muted-bg": token.colorFillAlter,
        } as CSSProperties
      }
    >
      <div className="user-page__toolbar">
        <div className="user-page__field">
          <label htmlFor="user-org-picker">机构</label>
          <Select
            id="user-org-picker"
            showSearch
            optionFilterProp="label"
            placeholder="请选择机构"
            value={orgId ?? undefined}
            options={bootstrap.data?.orgs.map((org) => ({
              value: org.org_id!,
              label: org.org_name || String(org.org_id),
            }))}
            loading={bootstrap.loading}
            disabled={nav.busy}
            onChange={(id) =>
              void nav.transition({ orgId: id, userId: null, tab: "property" })
            }
          />
        </div>
        <div className="user-page__field user-page__field--user">
          <label htmlFor="user-picker">用户</label>
          {validOrg ? (
            <UserPicker
              key={`${sessionId}:${orgId}:${editorRevision}`}
              orgId={orgId!}
              userId={userId}
              user={user}
              includeInvalid={includeInvalid}
              disabled={nav.busy}
              onChange={(id) =>
                void nav.transition({ orgId, userId: id, tab: "property" })
              }
            />
          ) : (
            <Select id="user-picker" disabled placeholder="请先选择机构" />
          )}
        </div>
        <div className="user-page__invalid">
          <Switch
            id="user-include-invalid"
            checked={includeInvalid}
            disabled={nav.busy}
            onChange={setIncludeInvalid}
          />
          <label htmlFor="user-include-invalid">包含无效用户</label>
        </div>
        <Space className="user-page__actions">
          <Button
            type="primary"
            disabled={!validOrg || nav.busy}
            onClick={() => {
              if (userId === 0) return;
              void nav.transition({ orgId, userId: 0, tab: "property" });
            }}
          >
            新增用户
          </Button>
          <Button
            danger
            loading={deleting}
            disabled={!userId || !user || nav.busy || detail.loading || Boolean(detail.error)}
            onClick={handleDelete}
          >
            删除用户
          </Button>
        </Space>
      </div>
      <div className="user-page__content">
        <SaveError prefix="user-page" error={deleteError} />
        {bootstrap.data && <RefreshFeedback prefix="user-page" {...bootstrap} retry={bootstrap.reload} />}
        {!bootstrap.data && (bootstrap.loading || bootstrap.error) ? (
          <LoadFeedback prefix="user-page" {...bootstrap} retry={bootstrap.reload} />
        ) : !validOrg ? (
          <Empty description="暂无可用机构" />
        ) : userId === null ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="请选择用户，或新增一个用户"
          />
        ) : !user ? (
          <LoadFeedback prefix="user-page" {...detail} retry={detail.reload} />
        ) : (
          <>
            {userId !== 0 && <RefreshFeedback prefix="user-page" {...detail} retry={detail.reload} />}
            <div className="user-page__summary">
              <Avatar size={44} icon={<UserOutlined aria-hidden />} />
              <div>
                <Space wrap>
                  <Typography.Title level={5}>
                    {userId === 0 ? "新增用户" : user.user_name || "未命名用户"}
                  </Typography.Title>
                  <Tag>
                    {userId === 0 ? "待创建" : user.user_no || `ID ${userId}`}
                  </Tag>
                </Space>
                <Typography.Paragraph type="secondary">
                  {
                    bootstrap.data?.orgs.find((org) => org.org_id === orgId)
                      ?.org_name
                  }
                  {user.dept_name ? ` · ${user.dept_name}` : ""}
                </Typography.Paragraph>
              </div>
            </div>
            <Tabs
              activeKey={tab}
              onChange={(key) =>
                void nav.transition({ orgId, userId, tab: key as UserTab })
              }
              items={[
                { key: "property", label: "属性", disabled: nav.busy },
                { key: "role", label: "角色", disabled: !userId || nav.busy },
                {
                  key: "dept",
                  label: "科室授权",
                  disabled: !userId || nav.busy,
                },
                {
                  key: "password",
                  label: "密码",
                  disabled: !userId || nav.busy,
                },
                { key: "avatar", label: "头像", disabled: !userId || nav.busy },
              ]}
            />
            <div inert={common.disabled} aria-busy={detail.loading} key={`${sessionId}:${orgId}:${userId}:${tab}:${editorRevision}`}>
              {panel()}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
