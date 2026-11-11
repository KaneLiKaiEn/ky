import { useEffect, useState } from "react";
import { DatePicker, Modal, Typography } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";

const TIME_FORMAT = "YYYY-MM-DD HH:mm";

interface StopOrderModalProps {
  open: boolean;
  confirmLoading?: boolean;
  onCancel: () => void;
  onOk: (stopTime: string) => void;
}

/** 停止单条医嘱：录入停止时间，默认当前时间，精确到分 */
const StopOrderModal = ({
  open,
  confirmLoading,
  onCancel,
  onOk,
}: StopOrderModalProps) => {
  const [stopTime, setStopTime] = useState<Dayjs>(() =>
    dayjs().startOf("minute"),
  );

  useEffect(() => {
    if (open) setStopTime(dayjs().startOf("minute"));
  }, [open]);

  return (
    <Modal
      title="停止医嘱"
      open={open}
      destroyOnHidden
      okText="确定"
      cancelText="取消"
      confirmLoading={confirmLoading}
      onCancel={onCancel}
      onOk={() =>
        onOk(stopTime.startOf("minute").format("YYYY-MM-DD HH:mm:ss"))
      }
    >
      <Typography.Paragraph type="secondary" className="mb-3!">
        请选择停止时间。
      </Typography.Paragraph>
      <DatePicker
        showTime={{ format: "HH:mm" }}
        format={TIME_FORMAT}
        value={stopTime}
        onChange={(value) => {
          if (value) setStopTime(value.startOf("minute"));
        }}
        className="w-full"
        allowClear={false}
      />
    </Modal>
  );
};

export default StopOrderModal;
