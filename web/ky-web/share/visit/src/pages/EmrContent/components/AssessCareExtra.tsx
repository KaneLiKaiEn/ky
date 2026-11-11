import type { FC } from "react";
import { Input } from "antd";

export interface AssessCareExtraProps {
  showCareContent: boolean;
  showCareOrder: boolean;
  careContent: string;
  careOrder: string;
  onCareContentChange: (value: string) => void;
  onCareOrderChange: (value: string) => void;
  readOnly?: boolean;
}

const AssessCareExtra: FC<AssessCareExtraProps> = ({
  showCareContent,
  showCareOrder,
  careContent,
  careOrder,
  onCareContentChange,
  onCareOrderChange,
  readOnly = false,
}) => {
  if (!showCareContent && !showCareOrder) return null;

  return (
    <div className="flex flex-col gap-3 px-3 py-2">
      {showCareContent && (
        <div className="flex flex-col gap-1">
          <span className="text-sm text-(--app-theme-text-secondary)">
            护理措施
          </span>
          <Input.TextArea
            value={careContent}
            onChange={(e) => onCareContentChange(e.target.value)}
            readOnly={readOnly}
            rows={4}
            placeholder="请输入护理措施"
          />
        </div>
      )}
      {showCareOrder && (
        <div className="flex flex-col gap-1">
          <span className="text-sm text-(--app-theme-text-secondary)">
            执行医嘱
          </span>
          <Input.TextArea
            value={careOrder}
            onChange={(e) => onCareOrderChange(e.target.value)}
            readOnly={readOnly}
            rows={4}
            placeholder="请输入执行医嘱"
          />
        </div>
      )}
    </div>
  );
};

export default AssessCareExtra;
