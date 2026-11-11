import { Button, DatePicker, Radio } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import { useState } from "react";
import type { ShiftType } from "../types";

interface TimeAreaProps {
  date: Dayjs;
  shift: ShiftType;
  onDateChange: (date: Dayjs) => void;
  onShiftChange: (shift: ShiftType) => void;
}

export default function TimeArea({
  date,
  shift,
  onDateChange,
  onShiftChange,
}: TimeAreaProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <Button
        size="small"
        icon={<LeftOutlined />}
        onClick={() => onDateChange(date.subtract(1, "day"))}
      />
      <DatePicker
        variant="borderless"
        open={open}
        onOpenChange={setOpen}
        value={date}
        format="YYYY-MM-DD"
        onChange={(next) => {
          if (next) onDateChange(next);
          setOpen(false);
        }}
      />
      <Button
        size="small"
        icon={<RightOutlined />}
        onClick={() => onDateChange(date.add(1, "day"))}
      />
      <Radio.Group
        value={shift}
        optionType="button"
        buttonStyle="solid"
        onChange={(event) => onShiftChange(event.target.value)}
      >
        <Radio.Button value="day">白班</Radio.Button>
        <Radio.Button value="night">晚班</Radio.Button>
        <Radio.Button value="all">全天</Radio.Button>
      </Radio.Group>
    </div>
  );
}
