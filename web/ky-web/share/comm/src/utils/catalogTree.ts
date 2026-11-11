import { id, text } from "./value";
export interface CatalogRowLike {
  catalog_id?: number;
  parent_id?: number;
  catalog_name?: string;
  sort_no?: string;
}

export interface CatalogNode<T extends CatalogRowLike = CatalogRowLike> {
  key: number;
  row: T;
  children: CatalogNode<T>[];
}
export function catalogTree<T extends CatalogRowLike>(
  rows: T[],
  query = "",
): CatalogNode<T>[] {
  const nodes = new Map<number, CatalogNode<T>>();
  rows.forEach((row) => {
    const key = id(row.catalog_id);
    if (key) nodes.set(key, { key, row, children: [] });
  });
  const roots: CatalogNode<T>[] = [];
  nodes.forEach((node) => {
    const seen = new Set([node.key]);
    let parent = nodes.get(id(node.row.parent_id) || 0),
      ancestor = parent;
    while (ancestor && !seen.has(ancestor.key)) {
      seen.add(ancestor.key);
      ancestor = nodes.get(id(ancestor.row.parent_id) || 0);
    }
    if (ancestor || !parent) roots.push(node);
    else parent.children.push(node);
  });
  const search = query.trim().toLocaleLowerCase();
  const filter = (items: CatalogNode<T>[]): CatalogNode<T>[] =>
    items
      .sort(
        (a, b) =>
          text(a.row.sort_no).localeCompare(text(b.row.sort_no), "zh-CN", {
            numeric: true,
          }) ||
          text(a.row.catalog_name).localeCompare(
            text(b.row.catalog_name),
            "zh-CN",
          ),
      )
      .flatMap((node) => {
        const children = filter(node.children);
        return !search ||
          text(node.row.catalog_name).toLocaleLowerCase().includes(search) ||
          children.length
          ? [{ ...node, children }]
          : [];
      });
  return filter(roots);
}
