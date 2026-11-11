import { DatePicker, Form, Modal, message } from "antd";
import { useCallback, useEffect } from "react";
import dayjs from "dayjs";
import { bindPatientDevice, unbindPatientDevice } from "../api";

interface DeviceInfo {
  device_id: number | string;
  device_name?: string;
  device_no?: string;
  start_time?: string; // 当前绑定时间
  service_id?: string;
}

interface UpdateTimeProps {
  open: boolean;
  onCancel: () => void;
  visit_id: number;
  deviceInfo?: DeviceInfo;
  onSuccess?: () => void; // 修改成功后的回调
}

export default function UpdateTime({
  open,
  onCancel,
  visit_id,
  deviceInfo,
  onSuccess,
}: UpdateTimeProps) {
  const [form] = Form.useForm();

  //回填当前绑定时间
  useEffect(() => {
    if (open && deviceInfo?.start_time) {
      form.setFieldsValue({
        start_time: dayjs(deviceInfo.start_time),
      });
    }
    if (!open) {
      form.resetFields();
    }
  }, [open, deviceInfo, form]);
  // 确认修改
  const handleOk = useCallback(async () => {
    try {
      const values = await form.validateFields();
      //  先结束绑定
      const res = await unbindPatientDevice({
        service_id: deviceInfo?.service_id,
      });
      if (res.code === 0) {
        // 绑定接口
        const bindRes = await bindPatientDevice({
          device_id: deviceInfo?.device_id,
          visit_id,
          start_time: dayjs(values.start_time).format("YYYY-MM-DD HH:mm:ss"),
        });
        if (bindRes.code === 0) {
          message.success("绑定时间修改成功");
          onSuccess?.(); // 通知父组件刷新
          onCancel(); // 关闭弹窗
        } else {
          message.error(bindRes.message + bindRes.hint);
        }
      } else {
        message.error(res.message + res.hint);
      }
    } catch (error: any) {}
  }, [form, deviceInfo, visit_id, onSuccess, onCancel]);

  return (
    <Modal
      title={`修改绑定时间 - ${deviceInfo?.device_name || ""}`}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="确认修改"
      cancelText="取消"
      width={400}
      destroyOnHidden={true}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="绑定时间"
          name="start_time"
          rules={[{ required: true, message: "请选择绑定时间" }]}
        >
          <DatePicker
            showTime={{ format: "HH:mm:ss" }}
            format="YYYY-MM-DD HH:mm:ss"
            style={{ width: "100%" }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
