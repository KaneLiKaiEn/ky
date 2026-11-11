import type { ColumnsType } from "antd/es/table";
import { Table, Tag } from "antd";
import dayjs from "dayjs";
import type { EmrRow } from "../types";

interface EmrQcTableProps {
  dataSource: EmrRow[];
  loading?: boolean;
}

const formatCreateTime = (time?: string) =>
  time ? dayjs(time).format("YYYY-MM-DD HH:mm") : "-";

const isCommitted = (status?: string) => status === "COMMIT";

const EmrQcTable = ({ dataSource, loading }: EmrQcTableProps) => {
  const columns: ColumnsType<EmrRow> = [
    {
      title: "文档类型",
      dataIndex: "doc_type",
      width: 120,
      ellipsis: true,
      render: (value?: string) => value?.trim() || "-",
    },
    {
      title: "文档名称",
      dataIndex: "doc_name",
      width: 140,
      ellipsis: true,
      render: (value?: string) => value?.trim() || "-",
    },
    {
      title: "病历标题",
      dataIndex: "emr_title",
      ellipsis: true,
      render: (value?: string) => value?.trim() || "-",
    },
    {
      title: "病历时间",
      dataIndex: "emr_time",
      width: 150,
      render: (_: unknown, row: EmrRow) =>
        formatCreateTime(row.emr_time || row.input_time),
    },
    {
      title: "书写人",
      dataIndex: "user_name_list",
      width: 120,
      ellipsis: true,
      render: (value?: string) => value?.trim() || "-",
    },
    {
      title: "状态",
      dataIndex: "emr_status",
      width: 90,
      render: (value?: string) => (
        <Tag color={isCommitted(value) ? "success" : "default"}>
          {isCommitted(value) ? "已提交" : "未提交"}
        </Tag>
      ),
    },
  ];

  return (
    <Table<EmrRow>
      size="small"
      rowKey={(row) =>
        String(row.emr_id ?? `${row.doc_type}-${row.doc_name}-${row.emr_time}`)
      }
      loading={loading}
      columns={columns}
      dataSource={dataSource}
      pagination={false}
      scroll={{ y: "calc(100vh - 280px)" }}
    />
  );
};

export default EmrQcTable;
