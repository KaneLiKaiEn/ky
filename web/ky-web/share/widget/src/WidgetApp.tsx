import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { NotFoundRedirect } from "comm/theme";
import "@/index.css";

const UserHome = React.lazy(() => import("@/pages/userHome"));

export { default as menuConfig } from "./menuConfig";
export type { SubMenuItem } from "./menuConfig";

const WidgetApp: React.FC = () => {
  return (
    <React.Suspense fallback={null}>
      <Routes>
        <Route index element={<Navigate to="user-home" replace />} />
        <Route path="user-home" element={<UserHome />} />
        <Route path="*" element={<NotFoundRedirect />} />
      </Routes>
    </React.Suspense>
  );
};

export default WidgetApp;
