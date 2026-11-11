import { ConfigProvider, Skeleton } from "antd";
import { previewContrast, usePreviewTheme } from "../theme";

export default function ValueSkeleton({
  kind = "value",
  contrast = false,
}: {
  kind?: "value" | "card" | "rate" | "unit";
  contrast?: boolean;
}) {
  const { appearance } = usePreviewTheme();
  return (
    <ConfigProvider
      theme={
        contrast || appearance === "dashboard"
          ? {
              components: {
                Skeleton: previewContrast.skeleton,
              },
            }
          : undefined
      }
    >
      <span
        className={`mp-value-skeleton mp-value-skeleton--${kind}`}
        role="status"
        aria-label="正在加载指标值"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="mp-value-skeleton__shape" aria-hidden="true">
          <Skeleton active title={{ width: "100%" }} paragraph={false} />
        </span>
      </span>
    </ConfigProvider>
  );
}
