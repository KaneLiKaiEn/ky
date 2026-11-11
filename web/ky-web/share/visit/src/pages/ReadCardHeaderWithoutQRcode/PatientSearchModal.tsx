import { Modal, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { PatientRow } from "./types/patient";

export interface PatientSearchModalProps {
  open: boolean;
  loading?: boolean;
  selecting?: boolean;
  keyword?: string;
  dataSource?: PatientRow[];
  onClose: () => void;
  onSelect: (patient: PatientRow) => void | Promise<void>;
}

const calcAge = (birthDate?: string): number | null => {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
};

const columns: ColumnsType<PatientRow> = [
  {
    title: "姓名",
    dataIndex: "patient_name",
    width: 200,
    ellipsis: true,
  },
  {
    title: "性别",
    dataIndex: "patient_gender",
    width: 70,
  },
  {
    title: "年龄",
    key: "age",
    width: 70,
    render: (_, row) => {
      const age = calcAge(row.birth_date);
      return age != null ? `${age}岁` : "-";
    },
  },
  {
    title: "证件号",
    dataIndex: "patient_idno",
    ellipsis: true,
  },
  {
    title: "手机号",
    dataIndex: "patient_telno",
    width: 130,
  },
  {
    title: "患者ID",
    dataIndex: "patient_id",
    width: 120,
  },
];

const PatientSearchModal: React.FC<PatientSearchModalProps> = ({
  open,
  loading = false,
  selecting = false,
  keyword,
  dataSource = [],
  onClose,
  onSelect,
}) => {
  return (
    <Modal
      open={open}
      title={keyword ? `患者检索：${keyword}` : "患者检索"}
      onCancel={onClose}
      footer={null}
      width="60%"
      styles={{
        body: {
          maxHeight: "calc(100vh - 160px)",
          overflow: "hidden",
        },
      }}
      destroyOnHidden
      centered
      mask={{ closable: !selecting }}
      closable={!selecting}
    >
      <Table<PatientRow>
        size="small"
        rowKey={(row, index) =>
          String(row.patient_id ?? row.patient_xid ?? `row-${index}`)
        }
        loading={loading || selecting}
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        scroll={{ y: "calc(100vh - 260px)" }}
        locale={{ emptyText: "未检索到患者" }}
        onRow={(record) => ({
          className: selecting ? "cursor-wait" : "cursor-pointer",
          onClick: () => {
            if (selecting || record.patient_id == null) return;
            void onSelect(record);
          },
        })}
      />
    </Modal>
  );
};

export default PatientSearchModal;
