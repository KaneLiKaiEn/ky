import { useEffect, useState } from "react";
import { Modal, Radio } from "antd";
import EmrContent from "../EmrContent";

export type EvalFormTab = {
  key: string;
  label: string;
  form_id: number;
  form_version?: number;
};

interface BatchFormModalProps {
  open: boolean;
  visitId?: number | string;
  forms: EvalFormTab[];
  onCancel: () => void;
  /** 保存/提交/删除成功后刷新列表 */
  onSuccess?: () => void;
}

export default function BatchFormModal({
  open,
  visitId,
  forms,
  onCancel,
  onSuccess,
}: BatchFormModalProps) {
  const [activeKey, setActiveKey] = useState<string>();
  const [mountedKeys, setMountedKeys] = useState<string[]>([]);
  const [savedEmrIds, setSavedEmrIds] = useState<Record<string, number>>({});
  const visitIdNum =
    visitId != null && visitId !== "" ? Number(visitId) : undefined;

  useEffect(() => {
    if (!open) return;
    const firstKey = forms[0]?.key;
    setActiveKey(firstKey);
    setMountedKeys(firstKey ? [firstKey] : []);
    setSavedEmrIds({});
  }, [open, forms]);

  const handleSelect = (key: string) => {
    setActiveKey(key);
    setMountedKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
  };

  const handleSaved = (key: string, emrId: number) => {
    if (!emrId) return;
    setSavedEmrIds((prev) =>
      prev[key] === emrId ? prev : { ...prev, [key]: emrId },
    );
    onSuccess?.();
  };

  return (
    <Modal
      title="一键评估"
      open={open}
      onCancel={onCancel}
      width="90vw"
      footer={null}
      destroyOnHidden
      styles={{
        body: {
          height: "80vh",
          width: "86vw",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
      }}
    >
      {forms.length > 0 ? (
        <div className="mb-2 shrink-0 overflow-x-auto">
          <Radio.Group
            size="small"
            optionType="button"
            value={activeKey}
            className="[&_.ant-radio-button-wrapper-checked]:!bg-transparent [&_.ant-radio-button-wrapper-checked:hover]:!bg-transparent [&_.ant-radio-button-wrapper-checked:active]:!bg-transparent"
            onChange={(e) => handleSelect(String(e.target.value))}
          >
            {forms.map((form) => (
              <Radio.Button key={form.key} value={form.key}>
                {form.label}
              </Radio.Button>
            ))}
          </Radio.Group>
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1">
        {open && visitIdNum != null
          ? mountedKeys.map((key) => {
              const form = forms.find((item) => item.key === key);
              if (!form) return null;
              const active = key === activeKey;
              const emrId = savedEmrIds[form.key];
              return (
                <div
                  key={form.key}
                  className={
                    active ? "absolute inset-0 overflow-hidden" : "hidden"
                  }
                >
                  <EmrContent
                    emr_id={emrId}
                    visit_id={emrId ? undefined : visitIdNum}
                    form_id={emrId ? undefined : form.form_id}
                    form_version={emrId ? undefined : form.form_version}
                    emr_title={emrId ? undefined : form.label}
                    onSaved={(id) => handleSaved(form.key, id)}
                    onCommitted={(id) => handleSaved(form.key, id)}
                    onCommitCancelled={onSuccess}
                    onDeleted={onSuccess}
                  />
                </div>
              );
            })
          : null}
      </div>
    </Modal>
  );
}
