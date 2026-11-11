import { useEffect } from "react";
import { updateVisitProperty } from "../api";
import { DatePicker, Form, Modal, message } from "antd";
import dayjs from "dayjs";

interface UpdateAdmissionTimeModalProps {
  open: boolean;
  onCancel: () => void;
  bed: any;
  onSuccess: () => void;
}

export function UpdateAdmissionTimeModal({
  open,
  onCancel,
  bed,
  onSuccess,
}: UpdateAdmissionTimeModalProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) return;
    const admissionTime = bed?.admission_time
      ? dayjs(bed.admission_time)
      : null;
    form.setFieldsValue({
      admission_time: admissionTime?.isValid() ? admissionTime : null,
    });
  }, [open, bed?.admission_time, form]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      const res = await updateVisitProperty({
        visit_id: bed.visit_id,
        ip_property: {
          admission_time: dayjs(values.admission_time).format(
            "YYYY-MM-DD HH:mm:ss",
          ),
        },
      });
      if (res.code !== 0) {
        message.error(res.message + res.hint);
        return;
      }
      message.success("修改入科时间成功");
      onSuccess?.();
      onCancel();
      form.resetFields();
    } catch (error) {}
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="修改入科时间"
      open={open}
      onCancel={handleCancel}
      onOk={() => handleSubmit()}
      destroyOnHidden
    >
      <Form form={form}>
        <Form.Item
          name="admission_time"
          label="入科时间"
          rules={[{ required: true, message: "请选择入科时间" }]}
        >
          <DatePicker
            className="w-full"
            format="YYYY-MM-DD HH:mm"
            showTime={{ format: "HH:mm" }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
