import { updateInterval } from "../api";
import { Form, Modal, Select, message } from "antd";
import { useEffect } from "react";

interface UpdateIntervalProps {
  open: boolean;
  onCancel: () => void;
  visit_id: number;
  deviceInfo: any;
  onSuccess: () => void;
}
export default function UpdateInterval({
  open,
  onCancel,
  visit_id,
  deviceInfo,
  onSuccess,
}: UpdateIntervalProps) {
  const [form] = Form.useForm();
  //   显示当前采集周期
  useEffect(() => {
    if (open && deviceInfo?.push_interval) {
      form.setFieldsValue({
        push_interval: deviceInfo.push_interval,
      });
    }
    if (!open) {
      form.resetFields();
    }
  }, [open, deviceInfo, form]);
  const onOk = async () => {
    try {
      const values = await form.validateFields();
      //  修改采集周期
      const res = await updateInterval({
        device_id: deviceInfo?.device_id,
        device_no: deviceInfo?.device_no,
        visit_id,
        device_property: {
          push_interval: parseInt(values.push_interval), //整形数
        },
      });
      if (res.code === 0) {
        message.success("采集周期修改成功");
        onSuccess?.(); // 通知父组件刷新
        form.resetFields();
        onCancel(); // 关闭弹窗
      } else {
        message.error(res.message + res.hint);
      }
    } catch (error: any) {}
  };
  return (
    <Modal title="修改采集周期" open={open} onCancel={onCancel} onOk={onOk}>
      <Form form={form}>
        <Form.Item
          label="采集周期（分钟）"
          name="push_interval"
          className="w-full"
        >
          {/* 不自动采集/5分钟/10分钟/15分钟/30分钟/60分钟 */}
          <Select
            options={[
              { value: "0", label: "不自动采集" },
              { value: "5", label: "5" },
              { value: "10", label: "10" },
              { value: "15", label: "15" },
              { value: "30", label: "30" },
              { value: "60", label: "60" },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
