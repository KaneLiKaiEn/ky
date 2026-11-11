import { lazy, Suspense, useState } from "react";
import { preloadRemotes } from "../preloadRemotes";
import type { EmbeddedReportProps } from "./features/report-preview/Embedded";
export type {
  EmbeddedReportProps,
  PreviewTarget,
} from "./features/report-preview/Embedded";
export default function ReportPreview(props: EmbeddedReportProps) {
  if (props.active === false) return null;
  return <ActivePreview {...props} />;
}
function ActivePreview(props: EmbeddedReportProps) {
  // Re-mounting after a loading error must create a fresh lazy loader.
  const [Embedded] = useState(() =>
    lazy(() =>
      preloadRemotes().then(() => import("./features/report-preview/Embedded")),
    ),
  );
  return (
    <Suspense fallback={<div role="status">正在加载报表…</div>}>
      <Embedded {...props} />
    </Suspense>
  );
}
