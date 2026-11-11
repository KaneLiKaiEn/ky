import { useMemo } from "react";
import {
  AutoComplete,
  Button,
  Checkbox,
  Input,
  Select,
  Space,
  Table,
} from "antd";
import { MinusCircleOutlined, PlusCircleOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { ItemRow } from "@/types/allergy";
import {
  ALLERGY_LEVEL_NOT_FOUND,
  ALLERGY_LEVEL_OPTIONS,
  ALLERGY_REACTION_OPTIONS,
} from "./constants";
import type { AllergyTableRow } from "./types";

export interface AllergyFormTableProps {
  rows: AllergyTableRow[];
  typeOptions: { label: string; value: string }[];
  itemOptions: ItemRow[];
  loading?: boolean;
  onAdd: () => void;
  onRemove: (row: AllergyTableRow, index: number) => void;
  onPatch: (rowKey: string, patch: Partial<AllergyTableRow>) => void;
}

const AllergyFormTable = ({
  rows,
  typeOptions,
  itemOptions,
  loading,
  onAdd,
  onRemove,
  onPatch,
}: AllergyFormTableProps) => {
  const columns: ColumnsType<AllergyTableRow> = useMemo(
    () => [
    {
      title: (
        <Space size={4}>
          <span>过敏类型</span>
          <PlusCircleOutlined
            className="cursor-pointer text-green-600"
            onClick={onAdd}
          />
        </Space>
      ),
      dataIndex: "item_type",
      width: 140,
      render: (value: string | undefined, row) => (
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          className="w-full"
          placeholder="请选择"
          value={value || undefined}
          options={typeOptions}
          onChange={(itemType) =>
            onPatch(row.rowKey, { item_type: itemType ?? "" })
          }
        />
      ),
    },
    {
      title: "标准分类",
      dataIndex: "item_id",
      width: 160,
      render: (_value, row) => (
        <Select
          showSearch
          optionFilterProp="label"
          className="w-full"
          placeholder="请选择"
          value={row.item_id}
          options={itemOptions.map((item) => ({
            label: item.item_name,
            value: item.item_id,
          }))}
          onChange={(itemId: number) => {
            const selected = itemOptions.find((item) => item.item_id === itemId);
            const itemName = selected?.item_name ?? "";
            onPatch(row.rowKey, {
              item_id: itemId,
              item_name: itemName,
              allergy_name: itemName,
            });
          }}
        />
      ),
    },
    {
      title: "过敏名称",
      dataIndex: "allergy_name",
      width: 160,
      render: (value: string | undefined, row) => (
        <Input
          value={value}
          placeholder="请输入"
          onChange={(e) =>
            onPatch(row.rowKey, { allergy_name: e.target.value })
          }
        />
      ),
    },
    {
      title: "未发现",
      dataIndex: "allergy_level",
      width: 72,
      align: "center",
      render: (_value: number | undefined, row) => {
        const notFound = row.allergy_level === ALLERGY_LEVEL_NOT_FOUND;
        return (
          <Checkbox
            checked={notFound}
            onChange={(e) => {
              if (e.target.checked) {
                onPatch(row.rowKey, {
                  allergy_level: ALLERGY_LEVEL_NOT_FOUND,
                  allergy_reaction: "",
                });
              } else {
                // 注意：这里取消未发现时，需要设置过敏程度为未指定，不然无法更新后端字段，重新请求数据后页面又会显示为未发现
                onPatch(row.rowKey, { allergy_level: 0 });
              }
            }}
          />
        );
      },
    },
    {
      title: "过敏程度",
      dataIndex: "allergy_level",
      width: 120,
      render: (value: number | undefined, row) => {
        const notFound = row.allergy_level === ALLERGY_LEVEL_NOT_FOUND;
        return (
          <Select
            className="w-full"
            placeholder="请选择"
            disabled={notFound}
            value={notFound ? undefined : value}
            options={ALLERGY_LEVEL_OPTIONS}
            onChange={(allergyLevel) =>
              onPatch(row.rowKey, { allergy_level: allergyLevel })
            }
          />
        );
      },
    },
    {
      title: "过敏反应",
      dataIndex: "allergy_reaction",
      width: 160,
      render: (value: string | undefined, row) => {
        const notFound = row.allergy_level === ALLERGY_LEVEL_NOT_FOUND;
        return (
          <AutoComplete
            className="w-full"
            allowClear
            disabled={notFound}
            placeholder="请选择或输入"
            value={notFound ? undefined : value}
            options={ALLERGY_REACTION_OPTIONS}
            onChange={(allergyReaction) =>
              onPatch(row.rowKey, { allergy_reaction: allergyReaction })
            }
          />
        );
      },
    },
    {
      title: "备注",
      dataIndex: "allergy_note",
      render: (value: string | undefined, row) => (
        <Input
          value={value}
          placeholder="请输入"
          onChange={(e) =>
            onPatch(row.rowKey, { allergy_note: e.target.value })
          }
        />
      ),
    },
    {
      title: "操作",
      key: "opt",
      width: 72,
      render: (_value, row, index) => (
        <Button
          type="text"
          danger
          icon={<MinusCircleOutlined />}
          onClick={() => onRemove(row, index)}
        />
      ),
    },
  ],
    [
      itemOptions,
      onAdd,
      onPatch,
      onRemove,
      typeOptions,
    ],
  );

  return (
    <Table<AllergyTableRow>
      size="small"
      rowKey="rowKey"
      pagination={false}
      loading={loading}
      columns={columns}
      dataSource={rows}
      scroll={{ x: 980 }}
    />
  );
};

export default AllergyFormTable;
