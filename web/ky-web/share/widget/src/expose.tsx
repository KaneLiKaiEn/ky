import React, { Suspense } from "react";
import { preloadRemotes } from "./preloadRemotes";

const WidgetApp = React.lazy(() =>
  preloadRemotes().then(() => import("./WidgetApp")),
);

/** Host 通过 MF 加载的入口：先预热 remote 再挂载业务 App，避免静态 import 抛 pending Promise。 */
const WidgetExpose: React.FC = () => (
  <Suspense fallback={null}>
    <WidgetApp />
  </Suspense>
);

export default WidgetExpose;
export { default as menuConfig } from "./menuConfig";
export type { SubMenuItem } from "./menuConfig";
