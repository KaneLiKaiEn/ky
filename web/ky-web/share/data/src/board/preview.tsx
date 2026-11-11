import { lazy, Suspense, useState } from "react";
import { preloadRemotes } from "../preloadRemotes";
import type { EmbeddedBoardProps } from "./features/board-preview/Embedded";
export type { EmbeddedBoardProps } from "./features/board-preview/Embedded";
export default function BoardPreview(props: EmbeddedBoardProps) {
  if (props.active === false) return null;
  return <ActivePreview {...props} />;
}
function ActivePreview(props: EmbeddedBoardProps) {
  // Re-mounting after a loading error must create a fresh lazy loader.
  const [Embedded] = useState(() =>
    lazy(() =>
      preloadRemotes().then(() => import("./features/board-preview/Embedded")),
    ),
  );
  return (
    <Suspense fallback={<div role="status">正在加载看板…</div>}>
      <Embedded {...props} />
    </Suspense>
  );
}
