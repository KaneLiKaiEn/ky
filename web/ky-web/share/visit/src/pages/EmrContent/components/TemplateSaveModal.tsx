import { useEffect, useState } from "react";
import { Form, Modal, message } from "antd";
import { saveAsPrefab } from "@/api/emr";
import TemplateSaveForm, {
  DEFAULT_TEMPLATE_SAVE_FORM_VALUES,
  type TemplateSaveFormValues,
} from "@/pages/TemplateSaveForm";
import { encodePrefabTagList } from "@/pages/TemplateSaveForm/enum";

export interface TemplateSaveModalProps {
  open: boolean;
  emrId?: number;
  defaultName?: string;
  onCancel: () => void;
}

const TemplateSaveModal: React.FC<TemplateSaveModalProps> = ({
  open,
  emrId,
  defaultName,
  onCancel,
}) => {
  const [form] = Form.useForm<TemplateSaveFormValues>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      ...DEFAULT_TEMPLATE_SAVE_FORM_VALUES,
      prefab_name: defaultName,
    });
  }, [open, form, defaultName]);

  const handleOk = async () => {
    const values = await form.validateFields();
    if (!emrId) {
      message.warning("请先保存病历");
      return;
    }

    setLoading(true);
    try {
      await saveAsPrefab({
        emr_id: emrId,
        prefab_name: values.prefab_name.trim(),
        prefab_note: values.prefab_note?.trim() || undefined,
        age_min: values.age_min,
        age_max: values.age_max,
        age_unit: values.age_unit || undefined,
        share_tag: encodePrefabTagList(values.share_tag) || undefined,
        gender_name: encodePrefabTagList(values.gender_name) || undefined,
        visit_type: encodePrefabTagList(values.visit_type) || undefined,
        op_type: encodePrefabTagList(values.op_type) || undefined,
        disease_id: values.disease_id,
        disease_name: values.disease_name?.trim() || undefined,
      });
      message.success("模板保存成功");
      onCancel();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "存为模板失败，请稍后重试",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="存为模板"
      open={open}
      width="50%"
      destroyOnHidden
      confirmLoading={loading}
      okText="确定"
      cancelText="取消"
      onCancel={onCancel}
      onOk={() => void handleOk()}
    >
      <TemplateSaveForm form={form} type="EMR" disabled={loading} />
    </Modal>
  );
};

export default TemplateSaveModal;
