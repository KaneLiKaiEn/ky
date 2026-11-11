import { Button, Popconfirm, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Dict2Row } from "@/types/sys";

interface Handlers {
  onEdit: (record: Dict2Row) => void;
  onDelete: (record: Dict2Row) => void;
}

export const getDictColumns = ({
  onEdit,
  onDelete,
}: Handlers): ColumnsType<Dict2Row> => [
  {
    title: "名称",
    dataIndex: "dict_name",
    key: "dict_name",
    ellipsis: true,
  },
  {
    title: "编码",
    dataIndex: "dict_code",
    key: "dict_code",
    width: 140,
    ellipsis: true,
  },
  {
    title: "操作",
    key: "action",
    width: 96,
    fixed: "right",
    render: (_, record) => (
      <Space size={0} onClick={(event) => event.stopPropagation()}>
        <Button type="link" size="small" onClick={() => onEdit(record)}>
          编辑
        </Button>
        <Popconfirm
          title="确定删除该字典吗？"
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
