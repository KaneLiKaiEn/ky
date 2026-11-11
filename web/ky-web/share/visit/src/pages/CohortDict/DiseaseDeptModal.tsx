import { useCallback } from "react";
import { App, Button, Input, Modal, Select, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { getDiseaseDeptListAPI, saveDiseaseDeptListAPI } from "@/api/cohort";
import { retrieveDeptList } from "@/api/org";
import type { DiseaseDeptRow } from "@/types/cohort";
import type { DeptRow } from "@/types/org";
import { createRowKey, omitRowKey } from "./utils";
import { useEditableRows } from "./useEditableRows";
import { useRemoteOptions } from "./useRemoteOptions";

interface DeptEditRow extends DiseaseDeptRow {
  rowKey: string;
}

export interface DiseaseDeptModalProps {
  open: boolean;
  diseaseId: number;
  diseaseName?: string;
  onCancel: () => void;
}

const toEditRows = (list: DiseaseDeptRow[]): DeptEditRow[] =>
  list.map((item) => ({
    ...item,
    rowKey: item.row_id != null ? `id_${item.row_id}` : createRowKey(),
  }));

const DiseaseDeptModal = ({
  open,
  diseaseId,
  diseaseName,
  onCancel,
}: DiseaseDeptModalProps) => {
  const { message, modal } = App.useApp();

  const load = useCallback(async () => {
    const res = await getDiseaseDeptListAPI({ disease_id: diseaseId });
    return toEditRows(res.row_list ?? []);
  }, [diseaseId]);

  const save = useCallback(
    async (next: DeptEditRow[]) => {
      await saveDiseaseDeptListAPI({
        disease_id: diseaseId,
        delete_row: 0,
        row_list: next
          .filter((item) => item.dept_id != null)
          .map((item) => omitRowKey(item)),
      });
      message.success("保存成功");
    },
    [diseaseId, message],
  );

  const createEmpty = useCallback(
    (): Omit<DeptEditRow, "rowKey"> => ({
      disease_id: diseaseId,
      dept_id: undefined,
      dept_name: "",
      sort_no: "",
    }),
    [diseaseId],
  );

  const { rows, loading, saving, add, remove, patch, submit } = useEditableRows(
    { open, load, save, createEmpty },
  );

  const { options, onSearch } = useRemoteOptions<DeptRow>(async (keyword) => {
    const res = await retrieveDeptList({
      retrieve_input: keyword,
      retrieve_limit: 20,
    });
    return res.dept_list ?? [];
  });

  const handleRemove = (row: DeptEditRow) => {
    modal.confirm({
      title: "确认删除",
      content: "是否确认删除该授权科室？",
      okButtonProps: { danger: true },
      onOk: () => remove(row.rowKey),
    });
  };

  const columns: ColumnsType<DeptEditRow> = [
    {
      title: "科室名称",
      dataIndex: "dept_name",
      render: (value: string | undefined, record) => (
        <Select
          showSearch
          allowClear
          placeholder="请选择科室"
          className="w-full"
          filterOption={false}
          value={value || undefined}
          options={options.map((item) => ({
            label: item.dept_name,
            value: item.dept_id,
            item,
          }))}
          onSearch={onSearch}
          onChange={(_id, option) => {
            const item =
              option && !Array.isArray(option)
                ? (option as { item?: DeptRow }).item
                : undefined;
            patch(record.rowKey, {
              dept_id: item?.dept_id,
              dept_name: item?.dept_name ?? "",
            });
          }}
        />
      ),
    },
    {
      title: "排序号",
      dataIndex: "sort_no",
      width: 140,
      render: (value: string | undefined, record) => (
        <Input
          value={value}
          placeholder="请输入排序号"
          onChange={(e) => patch(record.rowKey, { sort_no: e.target.value })}
        />
      ),
    },
    {
      title: "操作",
      key: "action",
      width: 72,
      render: (_value, record) => (
        <Button danger onClick={() => handleRemove(record)}>
          删除
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title={diseaseName ? `授权 — ${diseaseName}` : "授权"}
      open={open}
      onCancel={onCancel}
      onOk={() => void submit()}
      confirmLoading={saving}
      width={720}
      destroyOnHidden
    >
      <div className="mb-3 flex justify-end">
        <Button icon={<PlusOutlined />} onClick={add}>
          新增
        </Button>
      </div>
      <Table<DeptEditRow>
        size="small"
        pagination={false}
        loading={loading}
        rowKey="rowKey"
        columns={columns}
        dataSource={rows}
      />
    </Modal>
  );
};

export default DiseaseDeptModal;
