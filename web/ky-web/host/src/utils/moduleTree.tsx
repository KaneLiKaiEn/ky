import type { ModuleRow } from "@/types/federation";

export const buildModuleTree = (rows: ModuleRow[]): ModuleRow[] => {
  const map = new Map<number, ModuleRow>();
  const roots: ModuleRow[] = [];

  for (const row of rows) {
    const id = row.module_id ?? 0;
    map.set(id, { ...row, children: [] });
  }

  for (const row of map.values()) {
    const parentId = row.parent_id ?? 0;
    if (parentId && map.has(parentId)) {
      map.get(parentId)!.children!.push(row);
    } else {
      roots.push(row);
    }
  }

  return roots;
};
