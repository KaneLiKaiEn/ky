import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { usePreview } from "../context";
import { catalogTree } from "../model";
import LegacyIcon from "./LegacyIcon";

export default function Navigation({
  expanded: controlled,
  onExpandedChange,
}: {
  expanded?: Set<number>;
  onExpandedChange?: Dispatch<SetStateAction<Set<number>>>;
} = {}) {
  const { catalogs, catalogId, selectCatalog, busy } = usePreview();
  const [localExpanded, setLocalExpanded] = useState(new Set<number>());
  const expanded = controlled ?? localExpanded;
  const setExpanded = onExpandedChange ?? setLocalExpanded;
  const select = (id: number) => {
    if (busy) return;
    selectCatalog(id);
  };
  useEffect(() => {
    const parents = new Set<number>();
    let parent = catalogs.find(
      (row) => row.catalog_id === catalogId,
    )?.parent_id;
    while (parent && !parents.has(parent)) {
      parents.add(parent);
      parent = catalogs.find((row) => row.catalog_id === parent)?.parent_id;
    }
    if (parents.size)
      setExpanded((previous) => new Set([...previous, ...parents]));
  }, [catalogs, catalogId, setExpanded]);
  const nodes = catalogTree(catalogs);
  const toggle = (id: number) =>
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const render = (items: typeof nodes, depth = 0): React.ReactNode =>
    items.map((node) => (
      <div key={node.key}>
        <div
          className={`mp-catalog ${catalogId === node.key ? "mp-selected" : ""}`}
          style={{ paddingLeft: 12 + depth * 20 }}
        >
          <button
            className="mp-catalog-main"
            aria-label={node.title}
            disabled={busy}
            onClick={() => select(node.key)}
            onDoubleClick={() => toggle(node.key)}
          >
            <LegacyIcon name={node.row.icon_name || node.row.tree_icon} />
            <span>{node.title}</span>
          </button>
          {node.children.length > 0 && (
            <button
              className="mp-catalog-expand"
              disabled={busy}
              aria-expanded={expanded.has(node.key)}
              aria-label={`${expanded.has(node.key) ? "收起" : "展开"}${node.title}`}
              onClick={() => toggle(node.key)}
            >
              {expanded.has(node.key) ? "⌄" : "›"}
            </button>
          )}
        </div>
        {expanded.has(node.key) && render(node.children, depth + 1)}
      </div>
    ));
  return (
    <nav className="mp-navigation" aria-label="指标目录">
      {render(nodes)}
      <button
        className={`mp-catalog ${catalogId === 0 ? "mp-selected" : ""}`}
        aria-label="搜索"
        onClick={() => select(0)}
        disabled={busy}
      >
        <SearchOutlined />
        <span>搜索</span>
      </button>
    </nav>
  );
}
