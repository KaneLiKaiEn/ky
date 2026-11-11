import { lazy, Suspense, useState } from "react";
import { preloadRemotes } from "../preloadRemotes";
import type { EmbeddedMetricProps } from "./features/metric-preview/Embedded";
export type { EmbeddedMetricProps } from "./features/metric-preview/Embedded";
export default function MetricPreview(props: EmbeddedMetricProps) {
  return props.active === false ? null : <ActivePreview {...props} />;
}
function ActivePreview(props: EmbeddedMetricProps) {
  const [Embedded] = useState(() =>
    lazy(() =>
      preloadRemotes().then(() => import("./features/metric-preview/Embedded")),
    ),
  );
  return (
    <Suspense fallback={<div role="status">正在加载指标…</div>}>
      <Embedded {...props} />
    </Suspense>
  );
}
