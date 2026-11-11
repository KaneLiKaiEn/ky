import { useMemo, useState, type Key } from "react";
import { Empty, Input, Spin, Tree } from "antd";
import type { TreeDataNode } from "antd";
import type { DeptDTO } from "@/api/system/dept";
import { collectTreeKeys, toTree, type TreeNode } from "../shared";

const toTreeData = (
  nodes: TreeNode<DeptDTO>[],
  keyword: string,
): TreeDataNode[] =>
  nodes.flatMap((node) => {
    const children = node.children ? toTreeData(node.children, keyword) : [];
    if (keyword && !node.deptName.includes(keyword) && children.length === 0)
      return [];
    return [
      {
        key: node.id,
        title: node.deptName,
        children: children.length ? children : undefined,
      },
    ];
  });

export default function DeptTree({
  depts,
  loading,
  value,
  onChange,
}: {
  depts: DeptDTO[];
  loading: boolean;
  value?: number;
  onChange(deptId: number | undefined): void;
}) {
  const [keyword, setKeyword] = useState("");
  const tree = useMemo(
    () => toTree(depts, "id", "parentId", "orderNum"),
    [depts],
  );
  const treeData = useMemo(
    () => toTreeData(tree, keyword.trim()),
    [tree, keyword],
  );
  const [expandedKeys, setExpandedKeys] = useState<Key[]>();
  const allKeys = useMemo(() => collectTreeKeys(tree, "id"), [tree]);

  return (
    <div className="sys-page__panel">
      <div className="sys-page__toolbar">
        <span className="sys-page__title">部门列表</span>
      </div>
      <Input.Search
        allowClear
        placeholder="请输入部门名称"
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        style={{ marginBottom: 12 }}
      />
      <Spin spinning={loading}>
        {treeData.length ? (
          <Tree
            blockNode
            treeData={treeData}
            expandedKeys={keyword ? allKeys : (expandedKeys ?? allKeys)}
            onExpand={setExpandedKeys}
            selectedKeys={value == null ? [] : [value]}
            onSelect={(keys) =>
              onChange(keys.length ? Number(keys[0]) : undefined)
            }
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Spin>
    </div>
  );
}
