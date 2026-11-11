import { Button, Radio } from "antd";
import type { PrepayType } from "@/types/account";
import { formatAmount } from "./utils/amount";
import { PREPAY_TYPE_OPTIONS } from "./utils/constants";

export interface PrepayTypeBalanceBarProps {
  prepayType: PrepayType;
  
  /** 为 false 时不展示类型 Radio（外部已锁定 prepay_type） */
  showTypeSelector?: boolean;
  onTypeChange: (type: PrepayType) => void;
}

const PrepayTypeBalanceBar = ({
  prepayType,
  
  showTypeSelector = true,
  onTypeChange,
}: PrepayTypeBalanceBarProps) => {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      {showTypeSelector && (
        <div className="flex items-center gap-2">
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
      )}

      
    </div>
  );
};

export default PrepayTypeBalanceBar;
