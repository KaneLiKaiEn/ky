import { useDataThemeStyle } from "../../../../theme";
import { getDatasetList } from "../../../api/dataset";
import { useResource } from "comm/resource";
import { id, sameId, text } from "comm/utils";
import type { SourceRow } from "../../../types/source.d.ts";
import type { CatalogRow } from "../../../types/sys.d.ts";
import { Alert, Button, Empty, Modal, Table, Tree } from "antd";
import { useEffect, useState } from "react";

export interface PickedOption {
  value: number;
  label: string;
}
interface CatalogOption {
  key: number;
  title: string;
  children: CatalogOption[];
}
interface Props {
  kind: "source" | "dataset";
  open: boolean;
  identity: string;
  orgId: number;
  catalogs: CatalogRow[];
  sources: SourceRow[];
  value?: PickedOption;
  onSelect: (option: PickedOption) => void;
  onCancel: () => void;
}
/** Read-only option browser. It deliberately imports no resource mutation APIs. */
export default function OptionPicker(props: Props) {
  const themeStyle = useDataThemeStyle();
  const {
    kind,
    open,
    identity,
    orgId,
    catalogs,
    sources,
    value,
    onSelect,
    onCancel,
  } = props;
  const [catalogId, setCatalogId] = useState<number | null>(null);
  const [selected, setSelected] = useState<PickedOption>();
  useEffect(() => {
    setSelected(value);
    setCatalogId(null);
  }, [open, identity, value?.value]);
  const resource = useResource(
    open && kind === "dataset" && catalogId
      ? `picker:${identity}:${orgId}:${catalogId}`
      : null,
    async () =>
      (
        await getDatasetList({
          org_id: orgId,
          catalog_id: catalogId!,
          column_list: "dataset_id,dataset_name,dataset_code",
        })
      ).row_list ?? [],
  );
  const options =
    kind === "source"
      ? sources.map((row) => ({
          value: id(row.source_id)!,
          label: text(row.source_name),
          code: text(row.source_code),
        }))
      : (resource.data ?? []).map((row) => ({
          value: id(row.dataset_id)!,
          label: text(row.dataset_name),
          code: text(row.dataset_code),
        }));
  const validOptions = options.filter((row) => row.value);
  // Build a cycle-safe tree without reusing the management component or its menus.
  const nodes = (
    parent: number | null,
    ancestors = new Set<number>(),
  ): CatalogOption[] =>
    catalogs
      .filter((row) => {
        const parentId = id(row.parent_id);
        return parent
          ? parentId === parent
          : !parentId ||
              !catalogs.some((candidate) =>
                sameId(candidate.catalog_id, parentId),
              );
      })
      .flatMap((row) => {
        const key = id(row.catalog_id);
        return !key || ancestors.has(key)
          ? []
          : [
              {
                key,
                title: text(row.catalog_name),
                children: nodes(key, new Set([...ancestors, key])),
              },
            ];
      });
  return (
    <Modal
      title={kind === "source" ? "选择数据源" : "选择数据集"}
      open={open}
      onCancel={onCancel}
      destroyOnHidden
      width={780}
      footer={
        <>
          <Button onClick={onCancel}>取消</Button>
          <Button
            type="primary"
            disabled={!selected}
            onClick={() => selected && onSelect(selected)}
          >
            确认选择
          </Button>
        </>
      }
      style={themeStyle}
    >
      <div
        className={`de-option-picker ${kind === "dataset" ? "with-catalogs" : ""}`}
      >
        {kind === "dataset" && (
          <Tree
            aria-label="数据集目录选项"
            treeData={nodes(null)}
            selectedKeys={catalogId ? [catalogId] : []}
            onSelect={(keys) => setCatalogId(id(keys[0]))}
          />
        )}
        <div>
          {resource.error && (
            <Alert
              type="error"
              title="选项加载失败"
              description={resource.error}
              action={
                <Button onClick={() => void resource.reload().catch(() => {})}>
                  重试读取
                </Button>
              }
            />
          )}
          {kind === "dataset" && !catalogId ? (
            <Empty description="请选择目录" />
          ) : (
            <Table
              size="small"
              rowKey="value"
              dataSource={validOptions}
              loading={resource.loading}
              pagination={false}
              scroll={{ y: 360 }}
              rowSelection={{
                type: "radio",
                selectedRowKeys: selected ? [selected.value] : [],
                onChange: (_, rows) => setSelected(rows[0]),
              }}
              onRow={(row) => ({ onClick: () => setSelected(row) })}
              columns={[
                { title: "名称", dataIndex: "label" },
                { title: "编码", dataIndex: "code" },
              ]}
            />
          )}
        </div>
      </div>
    </Modal>
  );
}
