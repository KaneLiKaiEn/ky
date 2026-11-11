import { getSessionId } from "comm/session";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
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
import { ApartmentOutlined, ReloadOutlined } from "@ant-design/icons";
import { eventBus } from "comm/eventBus";
import { deleteDept, getDeptProperty } from "@/api/org";
import type { DeptRow } from "@/types/org";
import { createReferences } from "./references";
import {
  DEPARTMENT_UPDATED_EVENT,
  departmentOptions,
  newDepartmentDefaults,
} from "./model";
import { useDepartmentNavigation } from "./hooks/useDepartmentNavigation";
import { useResource } from "@/hooks/useResource";
import { useOrgOptions } from "@/hooks/useOrgOptions";
import { assertResultWithHint as assertResult, errorText, resultRows } from "@/utils/result";
import { parseId } from "@/utils/selection";
import { sameSelection } from "./navigation";
import type { DepartmentTab } from "./types";
import PropertyForm from "./components/PropertyForm";
import LinkPanel from "./components/LinkPanel";
import ClinicPanel from "./components/ClinicPanel";
import { LoadFeedback, SaveError, RefreshFeedback } from "./components/Feedback";
import "./style.scss";

export default function DepartmentManagement() {
  const { modal, message } = App.useApp();
  const { token } = theme.useToken();
  const nav = useDepartmentNavigation();
  const { orgId, deptType, deptId, tab } = nav.selection;
  const [revision, setRevision] = useState(0);
  const [editorRevision, setEditorRevision] = useState(0);
  const [deleteError, setDeleteError] = useState<string>();
  const [deleting, setDeleting] = useState(false);
  const confirmingDelete = useRef(false);
  const organizations = useOrgOptions();
  const session = organizations.data?.session;
  const sessionDept = useResource(
    organizations.data
      ? `session-department:${organizations.sessionId}:${session?.org_id}:${session?.dept_id}:${session?.dept_type}`
      : null,
    async () => {
      const id = parseId(session?.dept_id);
      if (session?.dept_type)
        return { department: {
          dept_id: id ?? undefined,
          org_id: parseId(session.org_id) ?? undefined,
          dept_type: session.dept_type,
        } as DeptRow | undefined };
      const department = id
        ? await getDeptProperty({ dept_id: id, column_list: "*" })
            .then(assertResult)
            .then((res) => parseId(res.dept_property?.dept_id) === id ? res.dept_property : undefined)
            .catch(() => undefined)
        : undefined;
      return { department };
    },
  );
  const bootstrapData = useMemo(() =>
    organizations.data && sessionDept.data
      ? { ...organizations.data, sessionDept: sessionDept.data.department }
      : undefined,
    [organizations.data, sessionDept.data],
  );
  const bootstrap = {
    data: bootstrapData,
    loading: organizations.loading || sessionDept.loading,
    error: organizations.error,
    reload: () => { organizations.reload(); sessionDept.reload(); },
  };
  const requestedDept = useResource(
    deptId ? `requested-department:${organizations.sessionId}:${deptId}` : null,
    async () => {
      const result = assertResult(
        await getDeptProperty({ dept_id: deptId!, column_list: "*" }),
      );
      if (
        !result.dept_property ||
        parseId(result.dept_property.dept_id) !== deptId
      )
        throw new Error("URL 指定的科室不存在或未返回有效科室属性");
      return result.dept_property;
    },
  );
  useEffect(() => {
    if (!bootstrap.data || bootstrap.loading || bootstrap.error) return;
    const current = nav.selectionRef.current;
    const { orgs, session } = bootstrap.data;
    if (orgs.some((org) => org.org_id === current.orgId)) return;
    if (current.deptId && requestedDept.loading) return;
    const requestedOrg =
      current.deptId === parseId(requestedDept.data?.dept_id)
        ? parseId(requestedDept.data?.org_id)
        : null;
    const preferred = [requestedOrg, parseId(session?.org_id)].find((id) =>
      orgs.some((org) => org.org_id === id),
    );
    const nextOrg = preferred ?? orgs[0]?.org_id ?? null;
    if (current.orgId === nextOrg) return;
    nav.commit(
      {
        ...current,
        orgId: nextOrg,
        deptId:
          current.orgId === null || nextOrg === requestedOrg
            ? current.deptId
            : null,
      },
      true,
    );
  }, [
    bootstrap.data,
    bootstrap.loading,
    bootstrap.error,
    requestedDept.data,
    requestedDept.loading,
    orgId,
    deptId,
    nav.commit,
    nav.selectionRef,
  ]);
  const validOrg = Boolean(
    orgId && bootstrap.data?.orgs.some((org) => org.org_id === orgId),
  );
  const reference = useMemo(
    () => createReferences(orgId ?? 0),
    [orgId, revision, organizations.sessionId],
  );
  const types = useResource(
    validOrg ? `department-types:${organizations.sessionId}:${orgId}` : null,
    () => reference.dictionary("dept.type"),
  );
  const typeOptions = useMemo(() => {
    const names = new Set(
      (types.data ?? [])
        .map((row) => row.item_name)
        .filter((name): name is string => Boolean(name?.trim())),
    );
    // Existing departments must remain reachable even if their dictionary entry was retired.
    for (const row of [requestedDept.data, bootstrap.data?.sessionDept])
      if (parseId(row?.org_id) === orgId && row?.dept_type)
        names.add(row.dept_type);
    return [...names].map((name) => ({ label: name, value: name }));
  }, [types.data, requestedDept.data, bootstrap.data, orgId]);
  useEffect(() => {
    if (!types.data || types.loading || types.error || !validOrg) return;
    const current = nav.selectionRef.current;
    if (
      current.orgId !== orgId ||
      typeOptions.some((option) => option.value === current.deptType)
    )
      return;
    if (current.deptId && requestedDept.loading) return;
    const requested = requestedDept.data;
    const sessionDept = bootstrap.data?.sessionDept;
    const candidates = [
      current.deptId === parseId(requested?.dept_id) &&
      parseId(requested?.org_id) === orgId
        ? requested?.dept_type
        : undefined,
      parseId(sessionDept?.org_id) === orgId
        ? sessionDept?.dept_type
        : undefined,
      parseId(bootstrap.data?.session?.org_id) === orgId
        ? bootstrap.data?.session?.dept_type
        : undefined,
      "管理",
    ];
    const nextType =
      candidates.find((name) =>
        typeOptions.some((option) => option.value === name),
      ) ??
      typeOptions[0]?.value ??
      null;
    if (current.deptType === nextType) return;
    const keepRequested =
      current.deptId === parseId(requested?.dept_id) &&
      parseId(requested?.org_id) === orgId &&
      requested?.dept_type === nextType;
    const keepSelection = current.deptType === null || keepRequested;
    nav.commit(
      {
        ...current,
        deptType: nextType,
        deptId: keepSelection ? current.deptId : null,
        tab: keepSelection ? current.tab : "property",
      },
      true,
    );
  }, [
    types.data,
    types.loading,
    types.error,
    typeOptions,
    validOrg,
    orgId,
    bootstrap.data,
    requestedDept.data,
    requestedDept.loading,
    nav.commit,
    nav.selectionRef,
  ]);
  const validType =
    validOrg &&
    Boolean(
      deptType && typeOptions.some((option) => option.value === deptType),
    );
  const list = useResource<DeptRow[]>(
    validType ? `departments:${organizations.sessionId}:${orgId}:${deptType}` : null,
    () => reference.departments(deptType!),
  );
  useEffect(() => {
    if (!list.data || list.loading || list.error) return;
    const current = nav.selectionRef.current;
    if (
      current.orgId !== orgId ||
      current.deptType !== deptType ||
      current.deptId === 0
    )
      return;
    if (list.data.some((row) => row.dept_id === current.deptId)) return;
    const sessionDeptId = parseId(bootstrap.data?.session?.dept_id);
    const nextId =
      list.data.find((row) => row.dept_id === sessionDeptId)?.dept_id ??
      list.data[0]?.dept_id ??
      null;
    if (nextId === current.deptId && current.tab === "property") return;
    nav.commit({ ...current, deptId: nextId, tab: "property" }, true);
  }, [
    list.data,
    list.loading,
    list.error,
    orgId,
    deptType,
    deptId,
    bootstrap.data,
    nav.commit,
    nav.selectionRef,
  ]);
  const hasDepartment = Boolean(
    deptId && list.data?.some((row) => row.dept_id === deptId),
  );
  const detail = useMemo<{ data?: DeptRow; error?: string }>(() => {
    const row = requestedDept.data;
    if (!hasDepartment || !row) return {};
    if (row.org_id != null && parseId(row.org_id) !== orgId)
      return { error: "科室不属于当前机构，请重新选择" };
    if (row.dept_type && row.dept_type !== deptType)
      return { error: "科室不属于当前科室类型，请重新选择" };
    return {
      data: {
        ...row,
        dept_id: deptId!,
        org_id: orgId!,
        dept_type: deptType!,
        parent_id: parseId(row.parent_id, true) ?? 0,
        branch_id: parseId(row.branch_id, true) ?? 0,
      },
    };
  }, [hasDepartment, requestedDept.data, orgId, deptType, deptId]);
  useEffect(() => {
    setDeleteError(undefined);
  }, [orgId, deptType, deptId]);
  const defaults = useMemo(
    () => newDepartmentDefaults(orgId ?? 0, deptType ?? ""),
    [orgId, deptType],
  );
  const department = deptId === 0 ? defaults : detail.data;
  const options = useMemo(
    () => departmentOptions(list.data ?? []),
    [list.data],
  );
  const saved = (row: DeptRow) => {
    nav.onDirtyChange(false);
    list.mutate((rows = []) => rows.some((item) => item.dept_id === row.dept_id)
      ? rows.map((item) => item.dept_id === row.dept_id ? { ...item, ...row } : item)
      : [...rows, row]);
    requestedDept.mutate(() => row);
    requestedDept.reload();
    types.reload();
    list.reload();
    setRevision((value) => value + 1);
    setEditorRevision((value) => value + 1);
    nav.commit(
      {
        orgId: row.org_id!,
        deptType: row.dept_type!,
        deptId: row.dept_id!,
        tab: "property",
      },
      true,
    );
    notifyUpdated(row.dept_id!);
  };
  const notifyUpdated = (id: number) => {
    try {
      eventBus.emit(DEPARTMENT_UPDATED_EVENT, { deptId: id });
    } catch {
      /* A subscriber refresh cannot turn a successful write into a failure. */
    }
  };
  const refresh = async () => {
    const selection = { ...nav.selectionRef.current };
    if (
      !(await nav.allowDiscard()) ||
      !nav.mounted.current ||
      nav.isBusy() ||
      !sameSelection(selection, nav.selectionRef.current)
    )
      return;
    nav.onDirtyChange(false);
    requestedDept.reload();
    types.reload();
    list.reload();
    setDeleteError(undefined);
    setRevision((value) => value + 1);
    setEditorRevision((value) => value + 1);
    bootstrap.reload();
  };
  const remove = async () => {
    if (!deptId || !department || nav.isBusy() || confirmingDelete.current)
      return;
    const selection = { ...nav.selectionRef.current };
    const requestSessionId = getSessionId();
    confirmingDelete.current = true;
    const accepted = await modal.confirm({
      title: "删除当前科室？",
      content: `确定删除“${department.dept_name || department.dept_no || deptId}”？当前未保存的修改也将丢弃。`,
      okText: "删除科室",
      cancelText: "取消",
      okButtonProps: { danger: true },
    });
    confirmingDelete.current = false;
    if (
      !accepted ||
      !nav.mounted.current ||
      getSessionId() !== requestSessionId ||
      nav.isBusy() ||
      !sameSelection(selection, nav.selectionRef.current)
    )
      return;
    nav.setPageBusy(true);
    setDeleting(true);
    setDeleteError(undefined);
    try {
      assertResult(await deleteDept({ dept_id: deptId }));
      if (!nav.mounted.current || getSessionId() !== requestSessionId) return;
      nav.onDirtyChange(false);
      list.mutate((rows = []) => rows.filter((row) => row.dept_id !== deptId));
      list.reload();
      setRevision((value) => value + 1);
      setEditorRevision((value) => value + 1);
      nav.commit({ ...selection, deptId: null, tab: "property" }, true);
      notifyUpdated(deptId);
      message.success("科室已删除");
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
  const snapshotBlocked = bootstrap.loading || Boolean(bootstrap.error) ||
    types.loading || Boolean(types.error) || list.loading || Boolean(list.error) ||
    (deptId !== 0 && (requestedDept.loading || Boolean(requestedDept.error) || Boolean(detail.error)));
  const content = () => {
    if (!bootstrap.data && (bootstrap.loading || bootstrap.error))
      return <LoadFeedback {...bootstrap} retry={bootstrap.reload} />;
    if (
      deptId &&
      (!validOrg || !deptType) &&
      (requestedDept.loading || requestedDept.error)
    )
      return <LoadFeedback {...requestedDept} retry={requestedDept.reload} />;
    if (!validOrg) return <Empty description="暂无可用机构" />;
    if (!types.data && (types.loading || types.error))
      return <LoadFeedback {...types} retry={types.reload} />;
    if (!validType)
      return <Empty description="暂无可用科室类型，请先维护科室类型字典" />;
    if (!list.data && (list.loading || list.error))
      return <LoadFeedback {...list} retry={list.reload} />;
    if (deptId === null)
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无科室，可点击“新增科室”创建"
        />
      );
    if (!department)
      return (
        <LoadFeedback
          loading={requestedDept.loading}
          error={detail.error || requestedDept.error}
          retry={requestedDept.reload}
        />
      );
    const common = {
      orgId: orgId!,
      department,
      disabled: deleting || snapshotBlocked,
      onDirtyChange: nav.onDirtyChange,
      onBusyChange: nav.onBusyChange,
    };
    return (
      <>
        {deptId !== 0 && <RefreshFeedback {...requestedDept} retry={requestedDept.reload} />}
        <div className="department-page__summary">
          <Avatar size={44} icon={<ApartmentOutlined aria-hidden />} />
          <div>
            <Space wrap>
              <Typography.Title level={5}>
                {deptId === 0
                  ? "新增科室"
                  : department.dept_name || "未命名科室"}
              </Typography.Title>
              <Tag>
                {deptId === 0 ? "待创建" : department.dept_no || `ID ${deptId}`}
              </Tag>
              <Tag>{deptType}</Tag>
            </Space>
            <Typography.Paragraph type="secondary">
              {
                bootstrap.data?.orgs.find((org) => org.org_id === orgId)
                  ?.org_name
              }
              {department.branch_name ? ` · ${department.branch_name}` : ""}
            </Typography.Paragraph>
          </div>
        </div>
        <Tabs
          activeKey={tab}
          onChange={(key) =>
            void nav.transition({
              orgId,
              deptType,
              deptId,
              tab: key as DepartmentTab,
            })
          }
          items={[
            { key: "property", label: "基本属性", disabled: nav.busy },
            { key: "link", label: "科室对照", disabled: !deptId || nav.busy },
            {
              key: "clinic",
              label: "门急诊属性",
              disabled: !deptId || nav.busy,
            },
          ]}
        />
        <div
          inert={deleting || snapshotBlocked}
          aria-busy={deleting || bootstrap.loading || types.loading || list.loading || requestedDept.loading}
          key={`${organizations.sessionId}:${orgId}:${deptType}:${deptId}:${tab}:${editorRevision}`}
        >
          {tab === "link" ? (
            <LinkPanel {...common} reference={reference} />
          ) : tab === "clinic" ? (
            <ClinicPanel
              orgId={orgId!}
              deptId={deptId!}
              deptName={department.dept_name || ""}
              disabled={deleting || snapshotBlocked}
              onDirtyChange={nav.onDirtyChange}
              onBusyChange={nav.onBusyChange}
            />
          ) : (
            <PropertyForm
              {...common}
              departments={list.data ?? []}
              reference={reference}
              onSaved={saved}
            />
          )}
        </div>
      </>
    );
  };
  return (
    <section
      className="department-page"
      style={
        {
          "--department-bg": token.colorBgContainer,
          "--department-border": token.colorBorderSecondary,
          "--department-muted-bg": token.colorFillAlter,
        } as CSSProperties
      }
    >
      <div className="department-page__toolbar">
        <div className="department-page__field">
          <label htmlFor="department-org-picker">机构</label>
          <Select
            id="department-org-picker"
            showSearch
            optionFilterProp="label"
            placeholder="请选择机构"
            value={orgId ?? undefined}
            options={bootstrap.data?.orgs.map((org) => ({
              value: org.org_id!,
              label: org.org_name || String(org.org_id),
            }))}
            loading={bootstrap.loading}
            disabled={nav.busy || bootstrap.loading}
            onChange={(id) =>
              void nav.transition({
                orgId: id,
                deptType,
                deptId: null,
                tab: "property",
              })
            }
          />
        </div>
        <div className="department-page__field department-page__field--type">
          <label htmlFor="department-type-picker">科室类型</label>
          <Select
            id="department-type-picker"
            showSearch
            optionFilterProp="label"
            placeholder="请选择科室类型"
            value={deptType ?? undefined}
            options={typeOptions}
            loading={types.loading}
            disabled={
              !validOrg || nav.busy || bootstrap.loading || types.loading
            }
            onChange={(type) =>
              void nav.transition({
                orgId,
                deptType: type,
                deptId: null,
                tab: "property",
              })
            }
          />
        </div>
        <div className="department-page__field department-page__field--department">
          <label htmlFor="department-picker">科室</label>
          <Select
            id="department-picker"
            showSearch
            placeholder={deptId === 0 ? "正在新增科室" : "请选择科室"}
            value={deptId || undefined}
            options={options}
            loading={list.loading}
            filterOption={(input, option) =>
              Boolean(
                option?.searchText.includes(input.trim().toLocaleLowerCase()),
              )
            }
            disabled={
              !validType || nav.busy || bootstrap.loading || list.loading
            }
            onChange={(id) =>
              void nav.transition({
                orgId,
                deptType,
                deptId: id,
                tab: "property",
              })
            }
          />
        </div>
        <Space className="department-page__actions" wrap>
          <Button
            icon={<ReloadOutlined />}
            disabled={nav.busy || bootstrap.loading}
            onClick={() => void refresh()}
          >
            刷新
          </Button>
          <Button
            type="primary"
            disabled={
              !validType || nav.busy || snapshotBlocked
            }
            onClick={() =>
              void nav.transition({
                orgId,
                deptType,
                deptId: 0,
                tab: "property",
              })
            }
          >
            新增科室
          </Button>
          <Button
            danger
            loading={deleting}
            disabled={
              !deptId ||
              !department ||
              nav.busy ||
              bootstrap.loading ||
              list.loading ||
              snapshotBlocked
            }
            onClick={() => void remove()}
          >
            删除科室
          </Button>
        </Space>
      </div>
      <div className="department-page__content">
        <SaveError error={deleteError} />
        {bootstrap.data && <RefreshFeedback {...bootstrap} retry={bootstrap.reload} />}
        {types.data && <RefreshFeedback {...types} retry={types.reload} />}
        {list.data && <RefreshFeedback {...list} retry={list.reload} />}
        {content()}
      </div>
    </section>
  );
}
