import { useCallback } from "react";
import { App, Button, Input, Modal, Select, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { getDiseaseDiagListAPI, saveDiseaseDiagListAPI } from "@/api/cohort";
import { retrieveDiagItemListAPI } from "@/api/diag";
import type { DiseaseDiagRow } from "@/types/cohort";
import type { DiagItemRow } from "@/types/diag";
import { DIAG_TYPE_OPTIONS } from "./constants";
import { createRowKey, omitRowKey } from "./utils";
import { useEditableRows } from "./useEditableRows";
import { useRemoteOptions } from "./useRemoteOptions";

interface DiagEditRow extends DiseaseDiagRow {
  rowKey: string;
}

export interface DiseaseDiagModalProps {
  open: boolean;
  diseaseId: number;
  diseaseName?: string;
  orgId?: number;
  onCancel: () => void;
}

const toEditRows = (list: DiseaseDiagRow[]): DiagEditRow[] =>
  list.map((item) => ({
    ...item,
    rowKey: item.row_id != null ? `id_${item.row_id}` : createRowKey(),
  }));

const DiseaseDiagModal = ({
  open,
  diseaseId,
  diseaseName,
  orgId,
  onCancel,
}: DiseaseDiagModalProps) => {
  const { message, modal } = App.useApp();

  const load = useCallback(async () => {
    const res = await getDiseaseDiagListAPI({
      disease_id: diseaseId,
      disease_version: 0,
    });
    return toEditRows(res.row_list ?? []);
  }, [diseaseId]);

  const save = useCallback(
    async (next: DiagEditRow[]) => {
      await saveDiseaseDiagListAPI({
        disease_id: diseaseId,
        delete_row: 0,
        row_list: next
          .filter((item) => item.diag_name || item.diag_code)
          .map((item) => omitRowKey(item)),
      });
      message.success("保存成功");
    },
    [diseaseId, message],
  );

  const createEmpty = useCallback(
    (): Omit<DiagEditRow, "rowKey"> => ({
      disease_id: diseaseId,
      diag_type: "主诊断",
      diag_name: "",
      diag_code: "",
      diag_code_system: "",
      diag_match: "INCLUDE",
      sort_no: "",
    }),
    [diseaseId],
  );

  const { rows, loading, saving, add, remove, patch, submit } = useEditableRows(
    { open, load, save, createEmpty },
  );

  const { options, onSearch } = useRemoteOptions<DiagItemRow>(
    async (keyword) => {
      if (orgId == null) return [];
      const res = await retrieveDiagItemListAPI({
        org_id: orgId,
        retrieve_input: keyword,
        retrieve_limit: 20,
      });
      return res.row_list ?? [];
    },
  );

  const handleRemove = (row: DiagEditRow) => {
    modal.confirm({
      title: "确认删除",
      content: "是否确认删除该诊断？",
      okButtonProps: { danger: true },
      onOk: () => remove(row.rowKey),
    });
  };

  const columns: ColumnsType<DiagEditRow> = [
    {
      title: "诊断类型",
      dataIndex: "diag_type",
      width: 130,
      render: (value: string | undefined, record) => (
        <Select
          value={value}
          options={DIAG_TYPE_OPTIONS}
          className="w-full"
          onChange={(diag_type) => patch(record.rowKey, { diag_type })}
        />
      ),
    },
    {
      title: "诊断名称",
      dataIndex: "diag_name",
      width: 220,
      render: (value: string | undefined, record) => (
        <Select
          showSearch
          allowClear
          placeholder="请选择诊断"
          className="w-full"
          filterOption={false}
          value={value || undefined}
          options={options.map((item) => ({
            label: item.item_name,
            value: item.item_id,
            item,
          }))}
          onSearch={onSearch}
          onChange={(_id, option) => {
            const item =
              option && !Array.isArray(option)
                ? (option as { item?: DiagItemRow }).item
                : undefined;
            patch(record.rowKey, {
              diag_name: item?.item_name ?? "",
              diag_code: item?.item_code ?? "",
              diag_code_system: item?.item_code_system ?? "",
            });
          }}
        />
      ),
    },
    {
      title: "诊断代码",
      dataIndex: "diag_code",
      width: 140,
      render: (value: string | undefined, record) => (
        <Input
          value={value}
          placeholder="请输入诊断代码"
          onChange={(e) => patch(record.rowKey, { diag_code: e.target.value })}
        />
      ),
    },
    {
      title: "代码系统",
      dataIndex: "diag_code_system",
      width: 140,
      render: (value: string | undefined, record) => (
        <Input
          value={value}
          placeholder="请输入代码系统"
          onChange={(e) =>
            patch(record.rowKey, { diag_code_system: e.target.value })
          }
        />
      ),
    },
    {
      title: "排序号",
      dataIndex: "sort_no",
      width: 100,
      render: (value: string | undefined, record) => (
        <Input
          value={value}
          placeholder="排序号"
          onChange={(e) => patch(record.rowKey, { sort_no: e.target.value })}
        />
      ),
    },
    {
      title: "操作",
      key: "action",
      width: 72,
      fixed: "right",
      render: (_value, record) => (
        <Button danger onClick={() => handleRemove(record)}>
          删除
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title={diseaseName ? `诊断 — ${diseaseName}` : "诊断"}
      open={open}
      onCancel={onCancel}
      onOk={() => void submit()}
      confirmLoading={saving}
      width={960}
      destroyOnHidden
    >
      <div className="mb-3 flex justify-end">
        <Button icon={<PlusOutlined />} onClick={add}>
          新增
        </Button>
      </div>
      <Table<DiagEditRow>
        size="small"
        pagination={false}
        loading={loading}
        rowKey="rowKey"
        columns={columns}
        dataSource={rows}
        scroll={{ x: 860 }}
      />
    </Modal>
  );
};

export default DiseaseDiagModal;
