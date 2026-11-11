import React, { Suspense } from "react";
import { preloadRemotes } from "./preloadRemotes";

const LoginApp = React.lazy(() =>
  preloadRemotes().then(() => import("./LoginApp")),
);

const LoginExpose: React.FC = () => (
  <Suspense fallback={null}>
    <LoginApp />
  </Suspense>
);

export default LoginExpose;
