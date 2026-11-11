import { useCallback } from "react";
import {
  App,
  Button,
  Checkbox,
  Input,
  InputNumber,
  Modal,
  Select,
  Table,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { getDiseaseOpsListAPI, saveDiseaseOpsListAPI } from "@/api/cohort";
import { retrieveOpsItemListAPI } from "@/api/ops";
import type { DiseaseOpsRow } from "@/types/cohort";
import type { OpsItemRow } from "@/types/ops";
import {
  ANES_TYPE_OPTIONS,
  MATCH_OPTIONS,
  OPS_TYPE_OPTIONS,
} from "./constants";
import {
  createRowKey,
  omitRowKey,
  parseBracketTags,
  toBracketTags,
} from "./utils";
import { useEditableRows } from "./useEditableRows";
import { useRemoteOptions } from "./useRemoteOptions";

interface OpsEditRow extends Omit<DiseaseOpsRow, "ops_type" | "anes_type"> {
  rowKey: string;
  ops_type: string[];
  anes_type: string[];
}

export interface DiseaseOpsModalProps {
  open: boolean;
  diseaseId: number;
  diseaseName?: string;
  orgId?: number;
  onCancel: () => void;
}

const toEditRows = (list: DiseaseOpsRow[]): OpsEditRow[] =>
  list.map((item) => ({
    ...item,
    ops_type: parseBracketTags(item.ops_type),
    anes_type: parseBracketTags(item.anes_type),
    rowKey: item.row_id != null ? `id_${item.row_id}` : createRowKey(),
  }));

const toSaveRows = (list: OpsEditRow[]): DiseaseOpsRow[] =>
  list
    .filter((item) => item.ops_name || item.ops_code)
    .map((item) => {
      const rest = omitRowKey(item);
      return {
        ...rest,
        ops_type: toBracketTags(item.ops_type),
        anes_type: toBracketTags(item.anes_type),
      };
    });

const DiseaseOpsModal = ({
  open,
  diseaseId,
  diseaseName,
  orgId,
  onCancel,
}: DiseaseOpsModalProps) => {
  const { message, modal } = App.useApp();

  const load = useCallback(async () => {
    const res = await getDiseaseOpsListAPI({
      disease_id: diseaseId,
      disease_version: 0,
    });
    return toEditRows(res.row_list ?? []);
  }, [diseaseId]);

  const save = useCallback(
    async (next: OpsEditRow[]) => {
      await saveDiseaseOpsListAPI({
        disease_id: diseaseId,
        delete_row: 0,
        row_list: toSaveRows(next),
      });
      message.success("保存成功");
    },
    [diseaseId, message],
  );

  const createEmpty = useCallback(
    (): Omit<OpsEditRow, "rowKey"> => ({
      disease_id: diseaseId,
      ops_name: "",
      ops_code: "",
      ops_code_system: "",
      ops_match: "INCLUDE",
      sort_no: "",
      ops_type: [],
      anes_type: [],
      anes_code: "",
      anes_name: "",
    }),
    [diseaseId],
  );

  const { rows, loading, saving, add, remove, patch, submit } = useEditableRows(
    { open, load, save, createEmpty },
  );

  const { options, onSearch } = useRemoteOptions<OpsItemRow>(
    async (keyword) => {
      const res = await retrieveOpsItemListAPI({
        org_id: orgId,
        retrieve_input: keyword,
        retrieve_limit: 20,
      });
      return res.row_list ?? [];
    },
  );

  const handleRemove = (row: OpsEditRow) => {
    modal.confirm({
      title: "确认删除",
      content: "是否确认删除该手术？",
      okButtonProps: { danger: true },
      onOk: () => remove(row.rowKey),
    });
  };

  const columns: ColumnsType<OpsEditRow> = [
    {
      title: "手术名称",
      dataIndex: "ops_name",
      width: 200,
      render: (value: string | undefined, record) => (
        <Select
          showSearch
          allowClear
          placeholder="请选择手术"
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
                ? (option as { item?: OpsItemRow }).item
                : undefined;
            patch(record.rowKey, {
              ops_name: item?.item_name ?? "",
              ops_code: item?.item_code ?? "",
              ops_code_system: item?.item_code_system ?? "",
            });
          }}
        />
      ),
    },
    {
      title: "是否匹配",
      dataIndex: "ops_match",
      width: 120,
      render: (value: string | undefined, record) => (
        <Select
          value={value}
          options={MATCH_OPTIONS}
          className="w-full"
          onChange={(ops_match) => patch(record.rowKey, { ops_match })}
        />
      ),
    },
    {
      title: "手术类型",
      dataIndex: "ops_type",
      width: 200,
      render: (value: string[] | undefined, record) => (
        <Checkbox.Group
          value={value}
          options={OPS_TYPE_OPTIONS}
          onChange={(ops_type) =>
            patch(record.rowKey, { ops_type: ops_type.map(String) })
          }
        />
      ),
    },
    {
      title: "NNIS最小",
      dataIndex: "nnis_min",
      width: 110,
      render: (value: number | undefined, record) => (
        <InputNumber
          value={value}
          className="w-full"
          placeholder="最小"
          onChange={(nnis_min) =>
            patch(record.rowKey, { nnis_min: nnis_min ?? undefined })
          }
        />
      ),
    },
    {
      title: "NNIS最大",
      dataIndex: "nnis_max",
      width: 110,
      render: (value: number | undefined, record) => (
        <InputNumber
          value={value}
          className="w-full"
          placeholder="最大"
          onChange={(nnis_max) =>
            patch(record.rowKey, { nnis_max: nnis_max ?? undefined })
          }
        />
      ),
    },
    {
      title: "麻醉类型",
      dataIndex: "anes_type",
      width: 200,
      render: (value: string[] | undefined, record) => (
        <Checkbox.Group
          value={value}
          options={ANES_TYPE_OPTIONS}
          onChange={(anes_type) =>
            patch(record.rowKey, { anes_type: anes_type.map(String) })
          }
        />
      ),
    },
    {
      title: "麻醉编码",
      dataIndex: "anes_code",
      width: 130,
      render: (value: string | undefined, record) => (
        <Input
          value={value}
          placeholder="麻醉编码"
          onChange={(e) => patch(record.rowKey, { anes_code: e.target.value })}
        />
      ),
    },
    {
      title: "麻醉名称",
      dataIndex: "anes_name",
      width: 140,
      render: (value: string | undefined, record) => (
        <Input
          value={value}
          placeholder="麻醉名称"
          onChange={(e) => patch(record.rowKey, { anes_name: e.target.value })}
        />
      ),
    },
    {
      title: "ASA最小",
      dataIndex: "asa_min",
      width: 110,
      render: (value: number | undefined, record) => (
        <InputNumber
          value={value}
          className="w-full"
          placeholder="最小"
          onChange={(asa_min) =>
            patch(record.rowKey, { asa_min: asa_min ?? undefined })
          }
        />
      ),
    },
    {
      title: "ASA最大",
      dataIndex: "asa_max",
      width: 110,
      render: (value: number | undefined, record) => (
        <InputNumber
          value={value}
          className="w-full"
          placeholder="最大"
          onChange={(asa_max) =>
            patch(record.rowKey, { asa_max: asa_max ?? undefined })
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
      title={diseaseName ? `手术 — ${diseaseName}` : "手术"}
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
      <Table<OpsEditRow>
        size="small"
        pagination={false}
        loading={loading}
        rowKey="rowKey"
        columns={columns}
        dataSource={rows}
        scroll={{ x: 1800 }}
      />
    </Modal>
  );
};

export default DiseaseOpsModal;
