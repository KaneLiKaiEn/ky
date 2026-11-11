import { useEffect, useState } from "react";
import { App, Button, Modal, Progress, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { mergePatientListAPI } from "./api/patient";
import type { EmpiMatchRow } from "./types/patient";

interface MatchPatientModalProps {
  open: boolean;
  list: EmpiMatchRow[];
  onCancel: () => void;
  /** 跳过查重，继续 NewPatient */
  onContinue: () => void;
  /** 合并成功后由外层重新走保存（会再次查重） */
  onMerged: () => void;
}

const genderColor = (gender?: string) => {
  if (gender === "男") return "blue";
  if (gender === "女") return "red";
  return "cyan";
};

const matchColor = (value: number) => {
  if (value >= 80) return "#ff4d4f";
  if (value >= 40) return "#faad14";
  return "#52c41a";
};

/** 统一成字符串。接口里的 uuid 常是数字，和 selectedRowKeys 类型不一致时勾选不会显示 */
const rowKeyOf = (row: EmpiMatchRow, index?: number) =>
  String(row.patient_uuid ?? row.patient_id ?? index ?? "");

const columns: ColumnsType<EmpiMatchRow> = [
  { title: "UUID", dataIndex: "patient_uuid", width: 140, ellipsis: true },
  { title: "姓名", dataIndex: "patient_name", width: 100, ellipsis: true },
  {
    title: "性别",
    dataIndex: "patient_gender",
    width: 72,
    render: (gender?: string) =>
      gender ? <Tag color={genderColor(gender)}>{gender}</Tag> : "-",
  },
  {
    title: "身份证号",
    dataIndex: "patient_idno",
    width: 180,
    render: (value?: string) => value || "-",
  },
  {
    title: "电话",
    dataIndex: "patient_telno",
    width: 130,
    render: (value?: string) => value || "-",
  },
  {
    title: "匹配度",
    dataIndex: "match_value",
    width: 120,
    render: (value?: number) =>
      value != null && value > 0 ? (
        <Progress
          percent={Math.min(100, value)}
          showInfo={false}
          size="small"
          strokeColor={matchColor(value)}
        />
      ) : null,
  },
];

/** 建档查重命中列表：可合并、取消，或继续注册 */
const MatchPatientModal: React.FC<MatchPatientModalProps> = ({
  open,
  list,
  onCancel,
  onContinue,
  onMerged,
}) => {
  const { message } = App.useApp();
  const [selected, setSelected] = useState<string[]>([]);
  const [merging, setMerging] = useState(false);

  useEffect(() => {
    if (!open) setSelected([]);
  }, [open]);

  const handleMerge = async () => {
    if (selected.length === 0) {
      message.warning("暂未选择任何ID");
      return;
    }
    setMerging(true);
    try {
      await mergePatientListAPI({
        patient_uuid: selected[0],
        merge_uuid: selected,
      });
      message.success("合并成功");
      setSelected([]);
      onMerged();
    } catch {
      // 请求层已提示失败原因
    } finally {
      setMerging(false);
    }
  };

  return (
    <Modal
      title="病人列表"
      open={open}
      width={800}
      destroyOnHidden
      maskClosable={!merging}
      onCancel={onCancel}
      footer={
        <Space>
          <Button onClick={onCancel} disabled={merging}>
            取消
          </Button>
          <Button type="primary" onClick={onContinue} disabled={merging}>
            继续注册
          </Button>
        </Space>
      }
    >
      {selected.length > 0 ? (
        <div className="mb-3">
          <Button type="primary" loading={merging} onClick={() => void handleMerge()}>
            合并
          </Button>
        </div>
      ) : null}
      <Table<EmpiMatchRow>
        size="small"
        rowKey={rowKeyOf}
        columns={columns}
        dataSource={list}
        pagination={false}
        scroll={{ y: 360 }}
        rowSelection={{
          selectedRowKeys: selected,
          onChange: (keys) => setSelected(keys.map((key) => String(key))),
          getCheckboxProps: (row) => ({
            disabled: row.patient_uuid == null || row.patient_uuid === "" || merging,
          }),
        }}
      />
    </Modal>
  );
};

export default MatchPatientModal;
