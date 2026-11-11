import { Radio } from "antd";
import type { PrepayType } from "@/types/account";
import { PREPAY_TYPE_OPTIONS } from "../PrepayDeposit";

export interface PrepayListTypeBarProps {
  prepayType: PrepayType;
  onTypeChange: (type: PrepayType) => void;
}

/** 列表侧类型切换（仅 prepay_type 未锁定时展示） */
const PrepayListTypeBar = ({
  prepayType,
  onTypeChange,
}: PrepayListTypeBarProps) => {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <span className="text-[14px] text-(--app-theme-text)">预交金类型</span>
      <Radio.Group
        size="small"
        value={prepayType}
        optionType="button"
        buttonStyle="solid"
        options={PREPAY_TYPE_OPTIONS}
        onChange={(e) => onTypeChange(e.target.value as PrepayType)}
      />
    </div>
  );
};

export default PrepayListTypeBar;
