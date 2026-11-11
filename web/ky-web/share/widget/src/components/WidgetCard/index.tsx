import React from "react";
import "./index.scss";

interface WidgetCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  /** react-grid-layout 在布局项尚未同步时读取的兜底尺寸，不透传到 DOM */
  "data-grid"?: Record<string, unknown>;
}

const WidgetCard = React.forwardRef<HTMLDivElement, WidgetCardProps>(
  ({ name, children, className, "data-grid": _dataGrid, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={`grid-item${className ? ` ${className}` : ""}`}
        {...rest}
      >
        <div className="grid-item__handle">{name}</div>
        <div className="grid-item__body">{children}</div>
      </div>
    );
  },
);

WidgetCard.displayName = "WidgetCard";

export default WidgetCard;
