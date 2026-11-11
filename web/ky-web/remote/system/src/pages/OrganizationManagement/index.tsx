import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Alert,
  App,
  Button,
  Empty,
  Select,
  Space,
  Tabs,
  Typography,
  theme,
} from "antd";
import { deleteOrg } from "@/api/org";
import type { OrgRow } from "@/types/org";
import { InvalidOrganizationResponse } from "@/api/organizationResult";
import OrganizationForm from "./components/OrganizationForm";
import BranchTab from "./components/BranchTab";
import PaymentTab from "./components/PaymentTab";
import ReaderTab from "./components/ReaderTab";
import { useOrganizationList } from "./hooks/useOrganizationList";
import {
  readSelection,
  selectionParams,
  type OrganizationSelection,
  type OrganizationTab,
} from "./navigation";
import "./style.scss";

const equalSelection = (a: OrganizationSelection, b: OrganizationSelection) =>
  a.orgId === b.orgId && a.branchId === b.branchId && a.tab === b.tab;

export default function OrganizationManagement() {
  const { modal, message } = App.useApp();
  const { token } = theme.useToken();
  const [params, setParams] = useSearchParams();
  const setParamsRef = useRef(setParams);
  setParamsRef.current = setParams;
  const [selection, setSelection] = useState(() => readSelection(params));
  const selectionRef = useRef(selection);
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const dirtyRef = useRef(false);
  const busyRef = useRef(false);
  const editorBusyRef = useRef(false);
  const deletionBusyRef = useRef(false);
  const mounted = useRef(false);
  const navigationId = useRef(0);

  const onDirtyChange = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty;
  }, []);
  const onBusyChange = useCallback((value: boolean) => {
    editorBusyRef.current = value;
    busyRef.current = value || deletionBusyRef.current;
    setBusy(busyRef.current);
  }, []);

  const commit = useCallback((next: OrganizationSelection, replace = false) => {
    selectionRef.current = next;
    setSelection(next);
    setParamsRef.current(selectionParams(paramsRef.current, next), { replace });
  }, []);

  const allowDiscard = useCallback(async () => {
    if (busyRef.current) return false;
    if (!dirtyRef.current) return true;
    const accepted = await modal.confirm({
      title: "放弃未保存的修改？",
      content: "当前修改尚未保存，继续切换将丢弃这些修改。",
      okText: "放弃修改",
      cancelText: "继续编辑",
    });
    return Boolean(accepted) && !busyRef.current;
  }, [modal]);

  const transition = useCallback(
    async (next: OrganizationSelection) => {
      if (equalSelection(selectionRef.current, next)) return;
      const id = ++navigationId.current;
      if (
        (await allowDiscard()) &&
        !busyRef.current &&
        mounted.current &&
        id === navigationId.current
      ) {
        dirtyRef.current = false;
        commit(next);
      }
    },
    [allowDiscard, commit],
  );

  // Browser back/forward changes also pass through the same discard guard.
  useEffect(() => {
    const next = readSelection(params);
    if (equalSelection(next, selectionRef.current)) return;
    const id = ++navigationId.current;
    void (async () => {
      const allowed = await allowDiscard();
      if (!mounted.current || id !== navigationId.current) return;
      if (allowed && !busyRef.current) {
        dirtyRef.current = false;
        selectionRef.current = next;
        setSelection(next);
      } else {
        setParamsRef.current(
          selectionParams(paramsRef.current, selectionRef.current),
          { replace: true },
        );
      }
    })();
  }, [params, allowDiscard]);

  const onListLoaded = useCallback(
    async (
      rows: OrgRow[],
      preferredId: number | undefined,
      isCurrent: () => boolean,
    ) => {
      const current = selectionRef.current;
      const candidate = preferredId ?? current.orgId;
      if (candidate === 0) return;
      const nextId = rows.some((row) => row.org_id === candidate)
        ? candidate
        : (rows[0]?.org_id ?? null);
      if (nextId !== current.orgId) {
        if (
          (await allowDiscard()) &&
          mounted.current &&
          isCurrent() &&
          !busyRef.current
        ) {
          dirtyRef.current = false;
          commit({ orgId: nextId, tab: "property", branchId: null }, true);
        }
      }
    },
    [commit, allowDiscard],
  );
  const { orgs, setOrgs, loading, loadFailed, loadOrgs } =
    useOrganizationList(onListLoaded);

  useEffect(() => {
    mounted.current = true;
    void loadOrgs();
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current || busyRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      mounted.current = false;
      navigationId.current++;
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [loadOrgs]);

  const handleSaved = (org: OrgRow) => {
    const id = Number(org.org_id);
    dirtyRef.current = false;
    setOrgs((rows) =>
      rows.some((row) => row.org_id === id)
        ? rows.map((row) => (row.org_id === id ? { ...row, ...org } : row))
        : [...rows, { ...org, org_id: id }],
    );
    commit({ orgId: id, branchId: null, tab: "property" }, true);
    void loadOrgs(id);
  };

  const handleDelete = async () => {
    const id = selectionRef.current.orgId;
    if (!id || busyRef.current) return;
    const accepted = await modal.confirm({
      title: "删除当前机构？",
      content: `确定删除“${orgs.find((row) => row.org_id === id)?.org_name ?? id}”？`,
      okText: "删除",
      cancelText: "取消",
      okButtonProps: { danger: true },
    });
    if (
      !accepted ||
      !mounted.current ||
      busyRef.current ||
      selectionRef.current.orgId !== id
    )
      return;
    setDeleting(true);
    deletionBusyRef.current = true;
    busyRef.current = true;
    setBusy(true);
    try {
      await deleteOrg({ org_id: id });
      if (!mounted.current) return;
      dirtyRef.current = false;
      message.success("机构已删除");
      const remaining = orgs.filter((row) => row.org_id !== id);
      setOrgs(remaining);
      commit(
        {
          orgId: remaining[0]?.org_id ?? null,
          tab: "property",
          branchId: null,
        },
        true,
      );
      await loadOrgs();
    } catch (error) {
      if (error instanceof InvalidOrganizationResponse)
        message.error(error.message);
      // Shared request interceptor reports the failure; preserve the current selection.
    } finally {
      if (mounted.current) {
        setDeleting(false);
        deletionBusyRef.current = false;
        busyRef.current = editorBusyRef.current;
        setBusy(busyRef.current);
      }
    }
  };

  const selected = orgs.find((row) => row.org_id === selection.orgId);
  const existing = Boolean(selection.orgId && selection.orgId > 0);
  const common = { onDirtyChange, onBusyChange, disabled: deleting };
  const orgId = selection.orgId ?? 0;
  const tabs: {
    key: OrganizationTab;
    label: string;
    disabled?: boolean;
    children?: React.ReactNode;
  }[] = [
    {
      key: "property",
      label: "机构属性",
      children:
        selection.tab === "property" ? (
          <OrganizationForm
            key={orgId}
            orgId={orgId}
            onSaved={handleSaved}
            {...common}
          />
        ) : undefined,
    },
    {
      key: "branch",
      label: "院区",
      disabled: !existing,
      children:
        selection.tab === "branch" && existing ? (
          <BranchTab
            key={orgId}
            orgId={orgId}
            branchId={selection.branchId}
            onBranchChange={(branchId) => {
              if (!deletionBusyRef.current)
                commit({ ...selectionRef.current, branchId });
            }}
            {...common}
          />
        ) : undefined,
    },
    {
      key: "payment",
      label: "支付配置",
      disabled: !existing,
      children:
        selection.tab === "payment" && existing ? (
          <PaymentTab
            key={orgId}
            orgId={orgId}
            orgName={selected?.org_name ?? ""}
            {...common}
          />
        ) : undefined,
    },
    {
      key: "reader",
      label: "读卡器配置",
      disabled: !existing,
      children:
        selection.tab === "reader" && existing ? (
          <ReaderTab
            key={orgId}
            orgId={orgId}
            orgName={selected?.org_name ?? ""}
            {...common}
          />
        ) : undefined,
    },
  ];

  return (
    <div
      className="organization-page"
      style={
        {
          "--organization-border": token.colorBorderSecondary,
          "--organization-bg": token.colorBgContainer,
        } as React.CSSProperties
      }
    >
      <div className="organization-page__toolbar">
        <div className="organization-page__selection">
          <Select
            aria-label="选择机构"
            className="organization-page__select"
            showSearch
            placeholder={
              selection.orgId === 0 ? "新增机构（未保存）" : "请选择机构"
            }
            loading={loading}
            disabled={busy}
            value={existing ? orgId : undefined}
            notFoundContent={loading ? "正在加载机构" : "没有匹配的机构"}
            options={orgs.map((row) => ({
              value: row.org_id!,
              label: row.org_name || "未命名机构",
              searchText: [
                row.org_name,
                row.org_code,
                row.org_no,
                row.kb_code,
                row.org_id,
              ]
                .map((value) => String(value ?? ""))
                .join(" ")
                .toLocaleLowerCase(),
            }))}
            filterOption={(input, option) =>
              (option?.searchText ?? "").includes(
                input.trim().toLocaleLowerCase(),
              )
            }
            onChange={(id) =>
              void transition({ orgId: id, tab: "property", branchId: null })
            }
          />
        </div>
        <Space wrap>
          <Button disabled={busy || loading} onClick={() => void loadOrgs()}>
            刷新列表
          </Button>
          <Button
            type="primary"
            disabled={busy}
            onClick={() =>
              void transition({ orgId: 0, tab: "property", branchId: null })
            }
          >
            新增机构
          </Button>
          <Button
            danger
            disabled={!existing || busy}
            loading={deleting}
            onClick={() => void handleDelete()}
          >
            删除机构
          </Button>
        </Space>
      </div>
      {loadFailed && (
        <Alert
          type="error"
          showIcon
          title="机构列表加载失败"
          action={
            <Button size="small" onClick={() => void loadOrgs()}>
              重试
            </Button>
          }
        />
      )}
      <section className="organization-page__content">
        {selection.orgId === null ? (
          <Empty
            description={loading ? "正在加载机构" : "请选择机构或新增机构"}
          />
        ) : (
          <>
            <div className="organization-page__context">
              <Typography.Text strong>
                {orgId === 0 ? "新增机构" : (selected?.org_name ?? "机构详情")}
              </Typography.Text>
              {existing && (
                <Typography.Text type="secondary">
                  机构 ID：{orgId}
                </Typography.Text>
              )}
            </div>
            <Tabs
              activeKey={selection.tab}
              items={tabs}
              destroyOnHidden
              onChange={(tab) =>
                void transition({
                  ...selection,
                  tab: tab as OrganizationTab,
                  branchId: null,
                })
              }
            />
          </>
        )}
      </section>
    </div>
  );
}
