import type { ReactNode, MouseEvent } from "react";
import { Button, Collapse, Typography } from "antd";

interface SectionFrameProps {
  title?: string;
  compact?: boolean;
  onReinit?: (event: MouseEvent) => void;
  children: ReactNode;
}

/** Display shell shared by a section's grid and table renderers. */
const SectionFrame = ({ title, compact, onReinit, children }: SectionFrameProps) => {
  if (!title?.trim()) return children;
  return (
    <Collapse
      styles={compact ? { body: { padding: 0 } } : {}}
      expandIconPlacement="end"
      defaultActiveKey={["1"]}
      items={[{
        key: "1",
        label: (
          <div className="flex items-center">
            <div className="w-1 h-[18px] bg-[#1677ff] rounded mr-2" />
            <Typography.Text strong>{title}</Typography.Text>
            {onReinit ? (
              <Button type="link" size="small" className="ml-2 px-0" onClick={onReinit}>
                重新初始化
              </Button>
            ) : null}
          </div>
        ),
        children,
      }]}
    />
  );
};

export default SectionFrame;
