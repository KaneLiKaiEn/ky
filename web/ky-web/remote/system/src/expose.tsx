import React, { Suspense } from "react";
import { preloadRemotes } from "./preloadRemotes";

const SystemApp = React.lazy(() =>
  preloadRemotes().then(() => import("./SystemApp")),
);

/** Host 通过 MF 加载的入口：先预热 remote 再挂载业务 App，避免静态 import 抛 pending Promise。 */
const SystemExpose: React.FC = () => (
  <Suspense fallback={null}>
    <SystemApp />
  </Suspense>
);

export default SystemExpose;
export { default as menuConfig } from "./menuConfig";
export type { SubMenuItem } from "./menuConfig";
