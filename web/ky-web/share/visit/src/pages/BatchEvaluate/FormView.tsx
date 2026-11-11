import { Modal } from "antd";
import EmrContent from "../EmrContent";

type EmrRecord = {
  emr_id?: number;
  doc_name?: string;
};

export interface FormViewProps {
  open: boolean;
  emr?: EmrRecord | null;
  visitId?: number | string;
  onCancel: () => void;
  /** 保存/提交/删除成功后刷新列表 */
  onSuccess?: () => void;
}

export default function FormView({
  open,
  emr,
  onCancel,
  onSuccess,
}: FormViewProps) {
  const emrId = emr?.emr_id != null ? Number(emr.emr_id) : undefined;

  const handleChanged = () => {
    onSuccess?.();
  };

  const handleDeleted = () => {
    onSuccess?.();
    onCancel();
  };

  return (
    <Modal
      title={emr?.doc_name || "评估详情"}
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
      {open && emrId != null ? (
        <div className="min-h-0 flex-1 overflow-hidden">
          <EmrContent
            key={emrId}
            emr_id={emrId}
            onSaved={handleChanged}
            onCommitted={handleChanged}
            onCommitCancelled={handleChanged}
            onDeleted={handleDeleted}
          />
        </div>
      ) : null}
    </Modal>
  );
}
