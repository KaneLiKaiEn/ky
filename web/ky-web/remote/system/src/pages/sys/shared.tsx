import { useCallback, useEffect, useRef, useState, type Key } from "react";
import { Tag } from "antd";
import type { TablePaginationConfig } from "antd";
import dayjs from "dayjs";
import type { PageDTO, PageQuery } from "@/api/system/common";

export interface Option<V = number> {
  label: string;
  value: V;
  color?: string;
}

/** StatusEnum：角色 / 岗位 / 部门 / 菜单 */
export const STATUS_OPTIONS: Option[] = [
  { label: "正常", value: 1, color: "success" },
  { label: "停用", value: 0, color: "error" },
];

/** UserStatusEnum：仅 1 可登录 */
export const USER_STATUS_OPTIONS: Option[] = [
  { label: "正常", value: 1, color: "success" },
  { label: "禁用", value: 2, color: "error" },
  { label: "冻结", value: 3, color: "warning" },
];

/** GenderEnum */
export const SEX_OPTIONS: Option[] = [
  { label: "男", value: 1 },
  { label: "女", value: 2 },
  { label: "未知", value: 0 },
];

export function OptionTag({
  options,
  value,
}: {
  options: Option[];
  value?: number;
}) {
  const option = options.find((item) => item.value === value);
  if (!option) return value == null ? null : <Tag>{value}</Tag>;
  return <Tag color={option.color}>{option.label}</Tag>;
}

export const formatTime = (value?: string) =>
  value ? dayjs(value).format("YYYY-MM-DD HH:mm:ss") : "";

export const errorText = (error: unknown) =>
  error instanceof Error ? error.message : "操作失败，请重试";

export type TreeNode<T> = T & { children?: TreeNode<T>[] };

/** TreeSelect 选项 */
export interface TreeOption {
  value: number;
  title: string;
  disabled?: boolean;
  children?: TreeOption[];
}

/** 平铺列表 → 树；找不到父节点的元素作为根节点 */
export function toTree<T extends object>(
  list: T[],
  idKey: keyof T,
  parentKey: keyof T,
  sortKey?: keyof T,
): TreeNode<T>[] {
  const nodes = new Map<unknown, TreeNode<T>>();
  for (const item of list) nodes.set(item[idKey], { ...item });
  const roots: TreeNode<T>[] = [];
  for (const node of nodes.values()) {
    const parent = nodes.get(node[parentKey]);
    if (parent && parent !== node) (parent.children ??= []).push(node);
    else roots.push(node);
  }
  if (sortKey) {
    const sort = (items: TreeNode<T>[]) => {
      items.sort((a, b) => Number(a[sortKey] ?? 0) - Number(b[sortKey] ?? 0));
      items.forEach((item) => item.children && sort(item.children));
    };
    sort(roots);
  }
  return roots;
}

/** 收集树内所有节点 id，用于默认展开 */
export function collectTreeKeys<T>(
  nodes: TreeNode<T>[],
  idKey: keyof T,
): Key[] {
  const keys: Key[] = [];
  const walk = (items: TreeNode<T>[]) => {
    for (const item of items) {
      if (item.children?.length) {
        keys.push(item[idKey] as Key);
        walk(item.children);
      }
    }
  };
  walk(nodes);
  return keys;
}

/**
 * 分页列表：维护查询条件、分页与加载状态。
 * 只有最后一次请求的结果会被采用。
 */
export function usePagedList<Q extends PageQuery, T>(
  fetcher: (query: Q) => Promise<PageDTO<T>>,
  initialQuery: Q,
) {
  const [query, setQuery] = useState<Q>({
    pageNum: 1,
    pageSize: 10,
    ...initialQuery,
  });
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const sequence = useRef(0);

  const load = useCallback(async (q: Q) => {
    const id = ++sequence.current;
    setLoading(true);
    try {
      const page = await fetcherRef.current(q);
      if (id !== sequence.current) return;
      setRows(page?.rows ?? []);
      setTotal(Number(page?.total ?? 0));
    } catch {
      if (id === sequence.current) setRows([]);
    } finally {
      if (id === sequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(query);
  }, [query, load]);

  /** 用新条件查询并回到第一页 */
  const search = useCallback(
    (conditions: Partial<Q>) =>
      setQuery((prev) => ({ ...prev, ...conditions, pageNum: 1 })),
    [],
  );

  const reload = useCallback(() => load(query), [load, query]);

  const pagination: TablePaginationConfig = {
    current: query.pageNum,
    pageSize: query.pageSize,
    total,
    showSizeChanger: true,
    showTotal: (count) => `共 ${count} 条`,
    onChange: (pageNum, pageSize) =>
      setQuery((prev) => ({ ...prev, pageNum, pageSize })),
  };

  return { query, rows, loading, pagination, search, reload };
}
