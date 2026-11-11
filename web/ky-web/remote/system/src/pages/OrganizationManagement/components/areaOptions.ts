import type { AreaRow } from "../../../types/sys";
import type { AddressNode } from "./address.ts";

export interface AreaOption {
  value: number;
  label: string;
  isLeaf: boolean;
  loading?: boolean;
  children?: AreaOption[];
  raw: AreaRow;
}

export const toOption = (row: AreaRow): AreaOption => ({
  value: Number(row.area_id),
  label: row.area_name ?? String(row.area_id),
  isLeaf: (row.area_level ?? 0) >= 3,
  raw: row,
});

export const updateOption = (
  list: AreaOption[],
  ids: number[],
  patch: Partial<AreaOption>,
): AreaOption[] =>
  list.map((item) =>
    item.value !== ids[0]
      ? item
      : ids.length === 1
        ? { ...item, ...patch }
        : {
            ...item,
            children: updateOption(item.children ?? [], ids.slice(1), patch),
          },
  );

/** Keep the full stored label path even when the region catalog is unavailable. */
export const withSavedPath = (
  list: AreaOption[],
  nodes: AddressNode[],
  level = 1,
): AreaOption[] => {
  if (!nodes.length) return list;
  const [node, ...rest] = nodes;
  const existing = list.find((item) => item.value === node.id);
  const option =
    existing ??
    toOption({ area_id: node.id, area_name: node.name, area_level: level });
  const updated = rest.length
    ? {
        ...option,
        isLeaf: false,
        children: withSavedPath(option.children ?? [], rest, level + 1),
      }
    : option;
  return existing
    ? list.map((item) => (item.value === node.id ? updated : item))
    : [...list, updated];
};

/** Rebuild the selected path and its next choices after a controlled value change. */
export async function hydrateAreaOptions(
  roots: AreaOption[],
  nodes: AddressNode[],
  loadChildren: (id: number, signal?: AbortSignal) => Promise<AreaRow[]>,
  signal: AbortSignal,
): Promise<AreaOption[]> {
  let next = roots;
  let siblings = next;
  const ids: number[] = [];
  for (let index = 0; index < nodes.length; index++) {
    if (signal.aborted) throw new DOMException("区域加载已取消", "AbortError");
    const node = nodes[index];
    let current = siblings.find((item) => item.value === node.id);
    if (!current) {
      current = toOption({
        area_id: node.id,
        area_name: node.name,
        area_level: index + 1,
      });
      siblings = [...siblings, current];
      next = ids.length
        ? updateOption(next, ids, { children: siblings })
        : siblings;
    }
    ids.push(node.id);
    // changeOnSelect updates the value before loadData completes. Include the
    // selected node's children so the controlled update retains its next column.
    if (index < nodes.length - 1 || !current.isLeaf) {
      const rows = await loadChildren(node.id, signal);
      if (signal.aborted)
        throw new DOMException("区域加载已取消", "AbortError");
      siblings = rows.map(toOption);
      next = updateOption(next, ids, {
        children: siblings,
        loading: false,
        isLeaf: rows.length === 0,
      });
    }
  }
  return next;
}
