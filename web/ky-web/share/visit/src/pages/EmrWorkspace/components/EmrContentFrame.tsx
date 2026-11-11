import type { ReactNode } from "react";

type EmrContentFrameProps = {
  /**
   * 病程记录表单按内容增高，滚动放在这一层。
   * 中间不加高度，避免 EmrContent 的 h-full 被锁成面板高度。
   */
  grow: boolean;
  className?: string;
  children: ReactNode;
};

/** 非堆叠病程记录：外层滚动；其它文书仍锁在面板内。 */
const EmrContentFrame = ({
  grow,
  className,
  children,
}: EmrContentFrameProps) => (
  <div
    className={[
      "min-h-0",
      grow ? "overflow-y-auto" : "overflow-hidden",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
  >
    {/* 注意：关键是在 病程记录 的 病历内容 外层包裹一个 div！！！ ， 不然会出现全屏幕滚动 */}
    {grow ? <div>{children}</div> : children}
  </div>
);

export default EmrContentFrame;
