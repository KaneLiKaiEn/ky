import { useEffect, useMemo, useState } from "react";
import type { ColumnsType } from "antd/es/table";
import { Button, Modal, Table, message } from "antd";
import { denyCohortAPI, enterCohortAPI } from "@/api/cohort";
import type { CohortDiseaseRow } from "@/types/cohort";

const DISEASE_TYPE_CLINICAL_PATH = "临床路径";

const formatAgeRange = (row: CohortDiseaseRow) => {
  const { age_min, age_max, age_unit } = row;
  if (age_min == null && age_max == null) return "-";
  const unit = age_unit || "";
  if (age_min != null && age_max != null) {
    return `${age_min}-${age_max}${unit}`;
  }
  if (age_min != null) return `≥${age_min}${unit}`;
  return `≤${age_max}${unit}`;
};

export interface CohortMatchModalProps {
  open: boolean;
  visitId: number;
  patientId?: number;
  rowList: CohortDiseaseRow[];
  onClose: () => void;
}

const CohortMatchModal = ({
  open,
  visitId,
  patientId,
  rowList,
  onClose,
}: CohortMatchModalProps) => {
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<number | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedDiseaseId(rowList[0]?.disease_id ?? null);
  }, [open, rowList]);

  const columns = useMemo<ColumnsType<CohortDiseaseRow>>(
    () => [
      {
        title: "病种名称",
        dataIndex: "disease_name",
        key: "disease_name",
        width: 160,
        ellipsis: true,
        render: (text: string) => text || "-",
      },
      {
        title: "病种编码",
        dataIndex: "disease_code",
        key: "disease_code",
        width: 110,
        ellipsis: true,
        render: (text: string) => text || "-",
      },
      {
        title: "病种编号",
        dataIndex: "disease_no",
        key: "disease_no",
        width: 110,
        ellipsis: true,
        render: (text: string) => text || "-",
      },
      {
        title: "版本",
        dataIndex: "disease_version",
        key: "disease_version",
        width: 64,
        render: (v: number) => (v == null ? "-" : v),
      },
      {
        title: "科室",
        dataIndex: "dept_name",
        key: "dept_name",
        width: 120,
        ellipsis: true,
        render: (text: string) => text || "-",
      },
      {
        title: "组名",
        dataIndex: "group_name",
        key: "group_name",
        width: 100,
        ellipsis: true,
        render: (text: string) => text || "-",
      },
      {
        title: "适用性别",
        dataIndex: "gender_name",
        key: "gender_name",
        width: 88,
        render: (text: string) => text || "-",
      },
      {
        title: "适用年龄",
        key: "age_range",
        width: 110,
        render: (_: unknown, record) => formatAgeRange(record),
      },
      {
        title: "疾病类型",
        dataIndex: "disease_type",
        key: "disease_type",
        width: 100,
        ellipsis: true,
        render: (text: string) => text || "-",
      },
    ],
    [],
  );

  const handleEnter = async () => {
    if (selectedDiseaseId == null) {
      message.warning("请选择病种");
      return;
    }
    setSubmitting(true);
    try {
      const res = await enterCohortAPI({
        visit_id: visitId,
        disease_id: selectedDiseaseId,
      });
      if (res.code === 0) {
        message.success("纳入成功");
        onClose();
      } else {
        message.error(res.message + res.hint);
      }
    } catch (error) {
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeny = async () => {
    if (rowList.length === 0) {
      onClose();
      return;
    }
    if (patientId == null || !Number.isFinite(patientId) || patientId <= 0) {
      message.warning("缺少患者信息，无法拒绝");
      return;
    }
    setSubmitting(true);
    try {
      for (const row of rowList) {
        const res = await denyCohortAPI({
          visit_id: visitId,
          patient_id: patientId,
          disease_type: DISEASE_TYPE_CLINICAL_PATH,
          disease_id: row.disease_id,
          disease_version: row.disease_version,
          disease_name: row.disease_name,
        });
        if (res.code !== 0) {
          message.error(res.message + res.hint);
          return;
        }
      }
      message.success("已拒绝纳入");
      onClose();
    } catch (error) {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="纳入临床路径"
      open={open}
      destroyOnHidden
      width={1200}
      onCancel={onClose}
      style={{
        height: "calc(60vh - 110px)",
      }}
      footer={
        <>
          <Button onClick={onClose} disabled={submitting}>
            暂不处理
          </Button>
          <Button danger loading={submitting} onClick={() => void handleDeny()}>
            拒绝
          </Button>
          <Button
            type="primary"
            loading={submitting}
            onClick={() => void handleEnter()}
          >
            进入
          </Button>
        </>
      }
    >
      <Table
        size="small"
        rowKey={(record) => String(record.disease_id)}
        dataSource={rowList}
        columns={columns}
        pagination={false}
        scroll={{ x: 960, y: 400 }}
        rowSelection={{
          type: "radio",
          selectedRowKeys:
            selectedDiseaseId == null ? [] : [String(selectedDiseaseId)],
          onChange: (keys) => {
            const key = keys[0];
            setSelectedDiseaseId(key == null ? null : Number(key));
          },
        }}
        onRow={(record) => ({
          onClick: () => setSelectedDiseaseId(record.disease_id),
        })}
      />
    </Modal>
  );
};

export default CohortMatchModal;
