import { useEffect, useState } from "react";
import {
  Button,
  Collapse,
  Empty,
  Modal,
  Space,
  Spin,
  Table,
  message,
} from "antd";
import { getFormList } from "@/api/form";
import type { FormRow, GetFormListRes } from "@/types/form";
import type { ElemOptionRow } from "@/types/elem";
import type { EmrRow } from "@/types/emr";
import type { VisitPatientRow } from "@/types/visit";
import EmrContent from "../../EmrContent";
import EmrScoreChart from "./EmrScoreChart";
import { matchFormByPatientAge } from "../matchForm";
import { notifyApi } from "../notify";

interface EmrFormDialogProps {
  open: boolean;
  visitId: number;
  emrId: number;
  docName: string;
  emrTime: string;
  patient?: VisitPatientRow;
  elemOptions?: ElemOptionRow[];
  history: EmrRow[];
  onClose: () => void;
  onEmrChange: (emrId: number) => void;
  onChanged: () => void;
}

export default function EmrFormDialog({
  open,
  visitId,
  emrId,
  docName,
  emrTime,
  patient,
  elemOptions,
  history,
  onClose,
  onEmrChange,
  onChanged,
}: EmrFormDialogProps) {
  const [forms, setForms] = useState<FormRow[]>([]);
  const [formId, setFormId] = useState<number>();
  const [formVersion, setFormVersion] = useState<number>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || emrId > 0 || !docName) {
      setForms([]);
      setFormId(undefined);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void getFormList({
      doc_type: "患者评估",
      doc_name: docName,
    })
      .then((res: GetFormListRes) => {
        if (cancelled) return;
        if (!notifyApi(res)) {
          setForms([]);
          return;
        }
        const list = res.row_list ?? [];
        if (!list.length) {
          message.warning(`未找到${docName}表单`);
          setForms([]);
          return;
        }
        const matched = matchFormByPatientAge(list, patient);
        setForms(list);
        setFormId(matched?.form_id);
        setFormVersion(matched?.form_version);
      })
      .catch(() => {
        if (!cancelled) message.error("加载表单失败");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [docName, emrId, open, patient]);

  const historyRows = history.filter(
    (item) => item.doc_name === docName && item.doc_type === "患者评估",
  );
  const title = [
    docName,
    patient?.patient_name,
    patient?.patient_gender,
    patient?.age_full,
  ]
    .filter(Boolean)
    .join(" - ");

  const adoptEmr = (id: number) => {
    onEmrChange(id);
    onChanged();
  };

  return (
    <Modal
      title={title || docName}
      open={open}
      onCancel={onClose}
      footer={false}
      width="100vw"
      destroyOnHidden
      style={{ top: 44, maxWidth: "100vw", padding: 0 }}
      styles={{ body: { height: "calc(100vh - 8rem)", overflow: "hidden" } }}
    >
      <div className="flex h-full min-h-0 flex-col">
        {historyRows.length > 0 ? (
          <Collapse
            className="mb-2 shrink-0"
            items={[
              {
                key: "history",
                label: `历史评估单（共 ${historyRows.length} 条）`,
                children: (
                  <div className="flex h-[250px] gap-2">
                    <div className="min-w-0 flex-1">
                      <Table
                        size="small"
                        rowKey={(row) => String(row.emr_id)}
                        pagination={false}
                        scroll={{ y: 210 }}
                        dataSource={historyRows}
                        onRow={(row) => ({
                          onClick: () => {
                            if (row.emr_id) onEmrChange(row.emr_id);
                          },
                        })}
                        rowClassName={(row) =>
                          row.emr_id === emrId
                            ? "cursor-pointer bg-blue-50"
                            : "cursor-pointer"
                        }
                        columns={[
                          { title: "时间", dataIndex: "emr_time", width: 160 },
                          {
                            title: "得分",
                            dataIndex: "assess_score",
                            width: 70,
                          },
                          { title: "结果", dataIndex: "assess_result" },
                        ]}
                      />
                    </div>
                    <div className="h-full min-w-0 flex-[2]">
                      <EmrScoreChart
                        emrList={historyRows}
                        elemOptions={elemOptions}
                      />
                    </div>
                  </div>
                ),
              },
            ]}
          />
        ) : null}

        {emrId > 0 ? (
          <div className="min-h-0 flex-1 overflow-hidden">
            <EmrContent
              key={emrId}
              emr_id={emrId}
              visit_id={visitId}
              onSaved={adoptEmr}
              onCommitted={adoptEmr}
              onDeleted={() => {
                onChanged();
                onClose();
              }}
            />
          </div>
        ) : loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Spin />
          </div>
        ) : formId ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {forms.length > 1 ? (
              <Space className="mb-2 shrink-0" wrap>
                {forms.map((form) => (
                  <Button
                    key={form.form_id}
                    size="small"
                    type={form.form_id === formId ? "primary" : "default"}
                    onClick={() => {
                      setFormId(form.form_id);
                      setFormVersion(form.form_version);
                    }}
                  >
                    {form.doc_tag || form.form_name}
                  </Button>
                ))}
              </Space>
            ) : null}
            <div className="min-h-0 flex-1 overflow-hidden">
              <EmrContent
                key={`form-${formId}`}
                visit_id={visitId}
                form_id={formId}
                form_version={formVersion}
                emr_time={emrTime}
                emr_title={docName}
                onSaved={adoptEmr}
                onCommitted={adoptEmr}
                onDeleted={() => {
                  onChanged();
                  onClose();
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <Empty description="暂无表单" />
          </div>
        )}
      </div>
    </Modal>
  );
}
