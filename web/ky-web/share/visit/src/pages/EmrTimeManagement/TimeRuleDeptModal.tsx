import { useCallback } from "react";
import { App, Button, Input, Modal, Select, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined } from "@ant-design/icons";
import {
  getTimeRuleDeptListAPI,
  saveTimeRuleDeptListAPI,
} from "@/api/emr";
import { retrieveDeptList } from "@/api/org";
import type { TimeRuleDeptRow } from "@/types/emr";
import type { DeptRow } from "@/types/org";
import { useEditableRows } from "../CohortDict/useEditableRows";
import { useRemoteOptions } from "../CohortDict/useRemoteOptions";
import { createRowKey, omitRowKey } from "../CohortDict/utils";

interface DeptEditRow extends TimeRuleDeptRow {
  rowKey: string;
}

export interface TimeRuleDeptModalProps {
  open: boolean;
  ruleId: number;
  ruleName?: string;
  onCancel: () => void;
}

const toEditRows = (list: TimeRuleDeptRow[]): DeptEditRow[] =>
  list.map((item) => ({
    ...item,
    rowKey:
      item.dept_id != null
        ? `dept_${item.dept_id}`
        : createRowKey(),
  }));

const TimeRuleDeptModal = ({
  open,
  ruleId,
  ruleName,
  onCancel,
}: TimeRuleDeptModalProps) => {
  const { message, modal } = App.useApp();

  const load = useCallback(async () => {
    const res = await getTimeRuleDeptListAPI({ rule_id: ruleId });
    return toEditRows(res.row_list ?? []);
  }, [ruleId]);

  const save = useCallback(
    async (next: DeptEditRow[]) => {
      await saveTimeRuleDeptListAPI({
        rule_id: ruleId,
        row_list: next
          .filter((item) => item.dept_id != null)
          .map((item) => omitRowKey(item)),
      });
      message.success("保存成功");
    },
    [message, ruleId],
  );

  const createEmpty = useCallback(
    (): Omit<DeptEditRow, "rowKey"> => ({
      rule_id: ruleId,
      dept_id: undefined,
      dept_name: "",
      sort_no: "",
    }),
    [ruleId],
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
      title={ruleName ? `授权 — ${ruleName}` : "授权科室"}
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

export default TimeRuleDeptModal;
