import { Button, Popconfirm, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Dict2ItemRow } from "@/types/sys";

interface Handlers {
  onEdit: (record: Dict2ItemRow) => void;
  onDelete: (record: Dict2ItemRow) => void;
}

export const getDictItemColumns = ({
  onEdit,
  onDelete,
}: Handlers): ColumnsType<Dict2ItemRow> => [
  { title: "名称", dataIndex: "item_name", key: "item_name", width: 160 },
  { title: "编码", dataIndex: "item_code", key: "item_code", width: 160 },
  { title: "编号", dataIndex: "item_no", key: "item_no", width: 120 },
  {
    title: "值",
    dataIndex: "item_value",
    key: "item_value",
    width: 140,
    ellipsis: true,
  },
  { title: "单位", dataIndex: "item_unit", key: "item_unit", width: 80 },
  { title: "排序", dataIndex: "sort_no", key: "sort_no", width: 80 },
  {
    title: "备注",
    dataIndex: "item_note",
    key: "item_note",
    width: 140,
    ellipsis: true,
  },
  {
    title: "操作",
    key: "action",
    width: 96,
    fixed: "right",
    render: (_, record) => (
      <Space size={0}>
        <Button type="link" size="small" onClick={() => onEdit(record)}>
          编辑
        </Button>
        <Popconfirm
          title="确定删除该字典项吗？"
          onConfirm={() => onDelete(record)}
        >
          <Button type="link" size="small" danger>
            删除
          </Button>
        </Popconfirm>
      </Space>
    ),
  },
];
