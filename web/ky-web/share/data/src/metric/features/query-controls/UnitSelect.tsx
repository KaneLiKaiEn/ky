import { PreviewModal } from "../metric-preview/theme";
import { useEffect, useRef, useState } from "react";
import { Alert, Button, Select, Space, TreeSelect } from "antd";
import { CaretDownOutlined, SearchOutlined } from "@ant-design/icons";
import LegacyIcon from "../metric-preview/components/LegacyIcon";
import { errorText, useRead } from "../metric-preview/hooks/useRead";
import type { UnitNode, UnitSelectProps } from "./types";
import "./style.scss";

const names: Record<string, string> = {
  ORG: "fa-building",
  BRANCH: "fa-code-branch",
  CATALOG: "fa-folder-tree",
  UNIT: "fa-cube",
  DEPT: "fa-users",
  GROUP: "fa-user-group",
  USER: "fa-user",
};
const merge = (...lists: UnitNode[][]) => [
  ...new Map(
    lists
      .flat()
      .filter((row) => !!row.unit_id)
      .map((row) => [row.unit_id, row]),
  ).values(),
];

export default function UnitSelect(props: UnitSelectProps) {
  const [scope, setScope] = useState({ source: props.source, version: 0 });
  if (scope.source !== props.source)
    setScope({ source: props.source, version: scope.version + 1 });
  return <UnitControl key={scope.version} {...props} />;
}

function UnitControl({
  value,
  valueName,
  onChange,
  roots: suppliedRoots,
  source,
  disabled = false,
  allowClear = false,
  "aria-label": label = "绩效单元",
  style,
  id,
}: UnitSelectProps) {
  const [extra, setExtra] = useState<UnitNode[]>([]),
    [treeError, setTreeError] = useState<string>(),
    [retryParent, setRetryParent] = useState<number>();
  const controller = useRef<AbortController | undefined>(undefined);
  useEffect(() => {
    const current = new AbortController();
    controller.current = current;
    return () => current.abort();
  }, []);
  const roots = useRead(suppliedRoots ? null : "unit-roots", source.roots);
  const nodes = merge(
    (suppliedRoots ?? roots.data ?? []).map((row) => ({
      ...row,
      parent_id: 0,
    })),
    extra,
  );
  const known = nodes.find((row) => row.unit_id === value);
  const detail = useRead(
    value && !known?.unit_name && !valueName && !roots.loading
      ? `unit:${value}`
      : null,
    (signal) => source.detail(value!, signal),
  );
  const rows = merge(
    nodes,
    detail.data ? [{ ...detail.data, parent_id: 0 }] : [],
  );
  if (value && !rows.some((row) => row.unit_id === value))
    rows.push({
      unit_id: value,
      parent_id: 0,
      unit_name: valueName || `单元 ${value}`,
    });
  const treeData = rows.map((row) => ({
    id: row.unit_id,
    pId: row.parent_id || 0,
    value: row.unit_id,
    title: (
      <Space size={4}>
        <LegacyIcon name={names[row.unit_type || ""] || "fa-flask"} />
        {row.unit_name ||
          (row.unit_id === value && valueName) ||
          `单元 ${row.unit_id}`}
      </Space>
    ),
    isLeaf: row.child_count === 0,
  }));
  const loadChildren = async (parentId: number) => {
    const signal = controller.current?.signal;
    if (!signal || signal.aborted) return;
    try {
      const children = await source.children(parentId, signal);
      if (signal.aborted) return;
      setExtra((previous) =>
        merge(
          previous,
          children.map((row) => ({ ...row, parent_id: parentId })),
        ),
      );
      setTreeError(undefined);
      setRetryParent(undefined);
    } catch (error) {
      if (signal.aborted) return;
      setTreeError(errorText(error));
      setRetryParent(parentId);
      throw error;
    }
  };
  const [search, setSearch] = useState(false),
    [keyword, setKeyword] = useState(""),
    [debounced, setDebounced] = useState(""),
    [chosen, setChosen] = useState<UnitNode>();
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(keyword), 300);
    return () => clearTimeout(timer);
  }, [keyword]);
  const results = useRead(
    search && !chosen ? `unit-search:${debounced}` : null,
    (signal) => source.search(debounced.trim() || "*", signal),
  );
  const error = roots.error || detail.error || treeError;
  return (
    <span className="mq-unit-fields" style={style}>
      <Button
        aria-label={label === "绩效单元" ? "检索单元" : `检索${label}`}
        icon={<SearchOutlined />}
        disabled={disabled}
        onClick={() => {
          setSearch(true);
          setKeyword("");
          setDebounced("");
          setChosen(undefined);
        }}
      />
      <TreeSelect
        id={id}
        aria-label={label}
        disabled={disabled}
        style={{ width: 150, flex: "1 1 150px", minWidth: 0 }}
        treeDataSimpleMode
        treeData={treeData}
        value={value}
        allowClear={allowClear}
        showSearch={false}
        treeLine
        loading={roots.loading || detail.loading}
        switcherIcon={<CaretDownOutlined />}
        classNames={{ popup: { root: "mq-unit-popup" } }}
        loadData={(node) => loadChildren(Number(node.value))}
        onChange={(next) => {
          if (!disabled)
            onChange?.(
              next ?? undefined,
              rows.find((row) => row.unit_id === next),
            );
        }}
      />
      {error && (
        <span role="alert">
          {error}
          <Button
            size="small"
            type="link"
            disabled={disabled}
            onClick={() => {
              if (roots.error) void roots.reload().catch(() => {});
              if (detail.error) void detail.reload().catch(() => {});
              if (retryParent !== undefined)
                void loadChildren(retryParent).catch(() => {});
            }}
          >
            重试单元
          </Button>
        </span>
      )}
      <PreviewModal
        title="检索单元"
        open={search}
        onCancel={() => setSearch(false)}
        okText="确定"
        cancelText="取消"
        okButtonProps={{
          disabled:
            disabled ||
            !chosen?.unit_id ||
            results.loading ||
            !!results.error ||
            keyword !== debounced,
        }}
        onOk={() => {
          if (
            disabled ||
            results.loading ||
            results.error ||
            keyword !== debounced
          )
            return;
          const row = chosen;
          if (!row?.unit_id) return;
          setExtra((previous) => merge(previous, [{ ...row, parent_id: 0 }]));
          onChange?.(row.unit_id, row);
          setSearch(false);
        }}
      >
        <Select
          aria-label="检索单元关键词"
          showSearch
          filterOption={false}
          searchValue={keyword}
          onSearch={(next) => {
            setKeyword(next);
            // Select clears its search text after selection. Keep that explicit
            // selection; subsequent typing starts a new cancellable search.
            if (next) setChosen(undefined);
          }}
          value={chosen?.unit_id}
          onChange={(id) => {
            if (disabled || results.loading || keyword !== debounced) return;
            setChosen(results.data?.find((row) => row.unit_id === id));
            setKeyword("");
            setDebounced("");
          }}
          disabled={disabled}
          options={(chosen ? [chosen] : (results.data ?? [])).map((row) => ({
            value: row.unit_id,
            label: row.unit_name,
          }))}
          loading={results.loading}
          style={{ width: "100%" }}
          placeholder="请输入关键词并选择单元"
        />
        {results.error && (
          <Alert
            type="error"
            title={results.error}
            action={
              <Button onClick={() => void results.reload().catch(() => {})}>
                重试读取
              </Button>
            }
          />
        )}
      </PreviewModal>
    </span>
  );
}
