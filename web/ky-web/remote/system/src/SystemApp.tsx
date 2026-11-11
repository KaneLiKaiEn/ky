import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { NotFoundRedirect } from "comm/theme";
import "@/index.css";

const UserPage = React.lazy(() => import("@/pages/sys/user"));
const RolePage = React.lazy(() => import("@/pages/sys/role"));
const MenuPage = React.lazy(() => import("@/pages/sys/menu"));
const DeptPage = React.lazy(() => import("@/pages/sys/dept"));
const PostPage = React.lazy(() => import("@/pages/sys/post"));

const SystemApp: React.FC = () => {
  return (
    <React.Suspense fallback={null}>
      <Routes>
        <Route index element={<Navigate to="user" replace />} />
        <Route path="user" element={<UserPage />} />
        <Route path="role" element={<RolePage />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="dept" element={<DeptPage />} />
        <Route path="post" element={<PostPage />} />
        <Route path="*" element={<NotFoundRedirect />} />
      </Routes>
    </React.Suspense>
  );
};

export default SystemApp;
