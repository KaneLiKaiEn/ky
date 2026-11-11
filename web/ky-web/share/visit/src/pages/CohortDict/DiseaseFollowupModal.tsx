import { useCallback, useEffect, useState } from "react";
import {
  App,
  Button,
  DatePicker,
  Input,
  InputNumber,
  Modal,
  Select,
  Table,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getDiseaseFollowupListAPI,
  saveDiseaseFollowupListAPI,
} from "@/api/cohort";
import { getFormList } from "@/api/form";
import type { DiseaseFollowupRow } from "@/types/cohort";
import type { FormRow } from "@/types/form";
import { TIME_REF_OPTIONS, TIME_UNIT_OPTIONS } from "./constants";
import { createRowKey, omitRowKey } from "./utils";
import { useEditableRows } from "./useEditableRows";

interface FollowupEditRow extends DiseaseFollowupRow {
  rowKey: string;
}

export interface DiseaseFollowupModalProps {
  open: boolean;
  diseaseId: number;
  diseaseName?: string;
  onCancel: () => void;
}

const toEditRows = (list: DiseaseFollowupRow[]): FollowupEditRow[] =>
  list.map((item) => ({
    ...item,
    rowKey:
      item.followup_id != null ? `id_${item.followup_id}` : createRowKey(),
  }));

const DiseaseFollowupModal = ({
  open,
  diseaseId,
  diseaseName,
  onCancel,
}: DiseaseFollowupModalProps) => {
  const { message, modal } = App.useApp();
  const [formOptions, setFormOptions] = useState<FormRow[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await getFormList({
          owner_type: "CLINIC",
          owner_id: diseaseId,
        });
        if (!cancelled) setFormOptions(res.row_list ?? []);
      } catch {
        if (!cancelled) setFormOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [diseaseId, open]);

  const load = useCallback(async () => {
    const res = await getDiseaseFollowupListAPI({
      disease_id: diseaseId,
      disease_version: 0,
    });
    return toEditRows(res.row_list ?? []);
  }, [diseaseId]);

  const save = useCallback(
    async (next: FollowupEditRow[]) => {
      await saveDiseaseFollowupListAPI({
        disease_id: diseaseId,
        delete_row: 0,
        row_list: next.map((item) => omitRowKey(item)),
      });
      message.success("保存成功");
    },
    [diseaseId, message],
  );

  const createEmpty = useCallback(
    (): Omit<FollowupEditRow, "rowKey"> => ({
      disease_id: diseaseId,
      followup_name: "",
      followup_message: "",
      followup_tag: "",
      followup_note: "",
      time_ref: undefined,
      time_offset: undefined,
      time_unit: undefined,
      time_note: "",
      form_id: undefined,
      form_name: "",
      sort_no: "",
      valid_status: "",
      valid_start: "",
      valid_end: "",
    }),
    [diseaseId],
  );

  const { rows, loading, saving, add, remove, patch, submit } = useEditableRows(
    { open, load, save, createEmpty },
  );

  const handleRemove = (row: FollowupEditRow) => {
    modal.confirm({
      title: "确认删除",
      content: "是否确认删除该随访步骤？",
      okButtonProps: { danger: true },
      onOk: () => remove(row.rowKey),
    });
  };

  const columns: ColumnsType<FollowupEditRow> = [
    {
      title: "步骤ID",
      dataIndex: "followup_id",
      width: 100,
      render: (value?: number) => <Input value={value} disabled />,
    },
    {
      title: "名称",
      dataIndex: "followup_name",
      width: 140,
      render: (value: string | undefined, record) => (
        <Input
          value={value}
          placeholder="请输入名称"
          onChange={(e) =>
            patch(record.rowKey, { followup_name: e.target.value })
          }
        />
      ),
    },
    {
      title: "给患者提醒",
      dataIndex: "followup_message",
      width: 160,
      render: (value: string | undefined, record) => (
        <Input
          value={value}
          placeholder="请输入提醒"
          onChange={(e) =>
            patch(record.rowKey, { followup_message: e.target.value })
          }
        />
      ),
    },
    {
      title: "标识",
      dataIndex: "followup_tag",
      width: 100,
      render: (value: string | undefined, record) => (
        <Input
          value={value}
          placeholder="标识"
          onChange={(e) =>
            patch(record.rowKey, { followup_tag: e.target.value })
          }
        />
      ),
    },
    {
      title: "备注",
      dataIndex: "followup_note",
      width: 140,
      render: (value: string | undefined, record) => (
        <Input
          value={value}
          placeholder="备注"
          onChange={(e) =>
            patch(record.rowKey, { followup_note: e.target.value })
          }
        />
      ),
    },
    {
      title: "参照时间",
      dataIndex: "time_ref",
      width: 120,
      render: (value: string | undefined, record) => (
        <Select
          allowClear
          placeholder="参照时间"
          className="w-full"
          value={value || undefined}
          options={TIME_REF_OPTIONS}
          onChange={(time_ref) => patch(record.rowKey, { time_ref })}
        />
      ),
    },
    {
      title: "位移时长",
      dataIndex: "time_offset",
      width: 110,
      render: (value: number | undefined, record) => (
        <InputNumber
          className="w-full"
          controls={false}
          placeholder="时长"
          value={value}
          onChange={(time_offset) =>
            patch(record.rowKey, { time_offset: time_offset ?? undefined })
          }
        />
      ),
    },
    {
      title: "时间单位",
      dataIndex: "time_unit",
      width: 110,
      render: (value: string | undefined, record) => (
        <Select
          allowClear
          placeholder="单位"
          className="w-full"
          value={value || undefined}
          options={TIME_UNIT_OPTIONS}
          onChange={(time_unit) => patch(record.rowKey, { time_unit })}
        />
      ),
    },
    {
      title: "时间备注",
      dataIndex: "time_note",
      width: 140,
      render: (value: string | undefined, record) => (
        <Input
          value={value}
          placeholder="时间备注"
          onChange={(e) => patch(record.rowKey, { time_note: e.target.value })}
        />
      ),
    },
    {
      title: "使用表单",
      dataIndex: "form_id",
      width: 180,
      render: (value: number | undefined, record) => (
        <Select
          allowClear
          placeholder="请选择表单"
          className="w-full"
          value={value || undefined}
          options={formOptions.map((item) => ({
            label: item.form_name,
            value: item.form_id,
          }))}
          onChange={(form_id, option) => {
            const label =
              option && !Array.isArray(option)
                ? String(option.label ?? "")
                : "";
            patch(record.rowKey, { form_id, form_name: label });
          }}
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
      title: "有效状态",
      dataIndex: "valid_status",
      width: 120,
      render: (value: string | undefined, record) => (
        <Input
          value={value}
          placeholder="有效状态"
          onChange={(e) =>
            patch(record.rowKey, { valid_status: e.target.value })
          }
        />
      ),
    },
    {
      title: "有效期开始",
      dataIndex: "valid_start",
      width: 150,
      render: (value: string | undefined, record) => (
        <DatePicker
          className="w-full"
          format="YYYY-MM-DD"
          value={value ? dayjs(value) : undefined}
          onChange={(_date, dateString) =>
            patch(record.rowKey, {
              valid_start: Array.isArray(dateString)
                ? dateString[0]
                : dateString,
            })
          }
        />
      ),
    },
    {
      title: "有效期结束",
      dataIndex: "valid_end",
      width: 150,
      render: (value: string | undefined, record) => (
        <DatePicker
          className="w-full"
          format="YYYY-MM-DD"
          value={value ? dayjs(value) : undefined}
          onChange={(_date, dateString) =>
            patch(record.rowKey, {
              valid_end: Array.isArray(dateString) ? dateString[0] : dateString,
            })
          }
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
      title={diseaseName ? `随访 — ${diseaseName}` : "随访"}
      open={open}
      onCancel={onCancel}
      onOk={() => void submit()}
      confirmLoading={saving}
      width="90%"
      destroyOnHidden
    >
      <div className="mb-3 flex justify-end">
        <Button icon={<PlusOutlined />} onClick={add}>
          新增
        </Button>
      </div>
      <Table<FollowupEditRow>
        size="small"
        pagination={false}
        loading={loading}
        rowKey="rowKey"
        columns={columns}
        dataSource={rows}
        scroll={{ x: 2000 }}
      />
    </Modal>
  );
};

export default DiseaseFollowupModal;
