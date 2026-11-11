import { lazy, Suspense, type FC } from "react";
import { Alert, Empty, Modal, Spin } from "antd";
import { useFormEvent } from "@/pages/CustomForm/contexts/FormEventContext";
import { useExtraFormDefinition } from "@/pages/CustomForm/hooks/useExtraFormDefinition";
import type { ExtraFormDocInfo } from "@/pages/CustomForm/utils/elemCore";

const NestedForm = lazy(() => import("@/pages/CustomForm/components/Form"));

export interface ExtraFormModalProps {
  open: boolean;
  doc: ExtraFormDocInfo | null;
  visit_id: number;
  baby_id?: number;
  onClose: () => void;
}

const ExtraFormModal: FC<ExtraFormModalProps> = ({
  open,
  doc,
  visit_id,
  baby_id,
  onClose,
}) => {
  const { formId, loading, error } = useExtraFormDefinition(doc, open);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={850}
      destroyOnHidden
    >
      <Spin spinning={loading}>
        {error ? <Alert type="error" title={error} showIcon /> : formId != null ? (
          <Suspense fallback={<Spin />}>
            <NestedForm
              formProp={{
                form_id: formId,
                visit_id,
                baby_id,
              }}
            />
          </Suspense>
        ) : !loading ? (
          <Empty description="未找到对应表单" />
        ) : (
          <div className="min-h-40" />
        )}
      </Spin>
    </Modal>
  );
};

export default ExtraFormModal;

export const FormEventExtraForm: FC = () => {
  const formEvent = useFormEvent();
  if (!formEvent) return null;
  return (
    <ExtraFormModal
      open={formEvent.extraForm != null}
      doc={formEvent.extraForm}
      visit_id={formEvent.visit_id}
      baby_id={formEvent.baby_id}
      onClose={formEvent.closeExtraForm}
    />
  );
};
