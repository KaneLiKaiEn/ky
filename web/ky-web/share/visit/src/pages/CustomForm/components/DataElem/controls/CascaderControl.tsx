import { useEffect, useRef, useState } from "react";
import { Button, Cascader, type CascaderProps } from "antd";
import type { ElemOptionRow } from "@/types/elem";
import areaOptions from "../../../assets/area-cascader.json";
import areaOptionsFull from "../../../assets/area-cascader-full.json";
import { cascaderValue, optionLabel } from "../../../model/optionValue";
import { loadElemOptionSubList } from "../../../repositories/elemOptions";
import type { FieldControlProps } from "./types";

interface CascaderNode {
  value: string;
  label: string;
  isLeaf?: boolean;
  loading?: boolean;
  children?: CascaderNode[];
}

const updateNode = (
  nodes: CascaderNode[],
  path: string[],
  patch: Partial<CascaderNode>,
  depth = 0,
): CascaderNode[] => nodes.map((node) => {
  if (node.value !== path[depth]) return node;
  return depth === path.length - 1
    ? { ...node, ...patch }
    : { ...node, children: updateNode(node.children ?? [], path, patch, depth + 1) };
});

const handleValueChange = (onPatch: FieldControlProps["onPatch"]): NonNullable<
  CascaderProps<CascaderNode, "value", false>["onChange"]
> => (values, nodes) => {
  onPatch(cascaderValue(values ?? [], (nodes ?? []).map((node) => node?.label ?? "")));
};

export const AddressControl = ({
  full,
  value,
  behavior,
  onPatch,
}: FieldControlProps & { full: boolean }) => (
  <Cascader<CascaderNode, "value">
    multiple={false}
    style={{ flex: 1 }}
    disabled={behavior.isReadOnly}
    allowClear={!behavior.isMustSelect}
    options={(full ? areaOptionsFull : areaOptions) as CascaderNode[]}
    value={value.value_code ? value.value_code.split(",") : []}
    onChange={handleValueChange(onPatch)}
  />
);

export const DynamicCascaderControl = ({
  rows,
  elemProp,
  value,
  behavior,
  onPatch,
}: FieldControlProps & { rows: ElemOptionRow[] }) => {
  const [options, setOptions] = useState<CascaderNode[]>([]);
  const [failedPath, setFailedPath] = useState<string[] | null>(null);
  const requestVersion = useRef(0);

  useEffect(() => {
    requestVersion.current += 1;
    setOptions(rows.map((row) => ({
      value: row.option_code ?? "",
      label: optionLabel(row),
    })));
    setFailedPath(null);
    return () => { requestVersion.current += 1; };
  }, [elemProp.elem_id, rows]);

  const loadBranch = async (path: string[]) => {
    const code = path[path.length - 1];
    if (code === undefined) return;
    const version = requestVersion.current;
    setOptions((current) => updateNode(current, path, { loading: true }));
    setFailedPath(null);
    try {
      const subRows = await loadElemOptionSubList(elemProp.elem_id, code);
      if (version !== requestVersion.current) return;
      const children = subRows.map((row) => ({
        value: row.sub_code ?? "",
        label: row.sub_text ?? row.sub_code ?? "",
      }));
      setOptions((current) => updateNode(current, path, {
        children,
        isLeaf: children.length === 0,
        loading: false,
      }));
    } catch {
      if (version !== requestVersion.current) return;
      setFailedPath(path);
      // 加载失败仍可重试，只有成功返回空列表才标记为叶子。
      setOptions((current) => updateNode(current, path, { loading: false }));
    }
  };

  const control = (
    <Cascader<CascaderNode, "value">
      multiple={false}
      style={{ flex: 1 }}
      disabled={behavior.isReadOnly}
      allowClear={!behavior.isMustSelect}
      options={options}
      value={value.value_code ? value.value_code.split(",") : []}
      loadData={(nodes) => { void loadBranch(nodes.map((node) => node.value)); }}
      displayRender={(labels) => {
        const joined = labels.filter((label) => label != null && label !== "").join("/");
        return joined || value.value_text || "";
      }}
      onChange={handleValueChange(onPatch)}
    />
  );
  return failedPath ? (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      {control}
      <Button type="link" size="small" className="shrink-0" onClick={() => void loadBranch(failedPath)}>
        子选项加载失败，重试
      </Button>
    </div>
  ) : control;
};
