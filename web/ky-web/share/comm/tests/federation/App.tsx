import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { App as AntdApp, Button } from "antd";
import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";
import { useResource } from "comm/resource";
import { useManagementSession, useWorkspaceNavigation } from "comm/management";
import { base64Blob, catalogTree, id } from "comm/utils";
import { setSessionId } from "comm/session";

const utilitiesWork =
  id("42") === 42 &&
  base64Blob("AP8=", "image/png").size === 2 &&
  catalogTree([
    { catalog_id: 1, parent_id: 2 },
    { catalog_id: 2, parent_id: 1 },
  ]).length === 2;

function Smoke() {
  const session = useManagementSession(true);
  const resource = useResource(
    session.data ? String(session.data.orgId) : null,
    async () => "resource ready",
  );
  const guard = useWorkspaceNavigation();
  const location = useLocation(),
    navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (session.data?.sessionId === "comm-smoke-first")
      setSessionId("comm-smoke-next");
  }, [session.data?.sessionId]);
  const ready = utilitiesWork && resource.ready && session.data?.orgId === 202;
  const passed = ready && saved && location.pathname === "/saved";
  return (
    <main style={{ padding: 32, fontFamily: "sans-serif" }}>
      <h1>Comm 联邦验证</h1>
      <p>工具入口：{utilitiesWork ? "通过" : "失败"}</p>
      <p>会话事件与认证读取：{session.data?.orgId === 202 ? "通过" : "等待"}</p>
      <p>共享 React hooks：{resource.ready ? "通过" : "等待"}</p>
      <p>Host Router 路径：{location.pathname}</p>
      {session.error && <p role="alert">{session.error}</p>}
      <Button
        disabled={!ready}
        onClick={() => {
          guard.onDirtyChange(true);
          guard.registerSave(async () => {
            setSaved(true);
            return true;
          });
          navigate("/saved");
        }}
      >
        验证保存并离开
      </Button>
      <p role="status">{passed ? "联邦验证通过" : "等待导航验证"}</p>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AntdApp>
      <BrowserRouter>
        <Smoke />
      </BrowserRouter>
    </AntdApp>
  </StrictMode>,
);
