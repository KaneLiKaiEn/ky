import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { App, Button, ConfigProvider, Drawer, Modal, Table, theme } from "antd";
import { BrowserRouter } from "react-router-dom";
import {
  AppThemeProvider,
  AppThemeRoot,
  AppThemeScope,
  useAppTheme,
  type AppThemeMode,
} from "comm/theme";
import {
  DataThemeScope,
  managementTheme,
  useDataThemeStyle,
} from "../../src/theme";
import {
  PreviewThemeProvider,
  PreviewModal,
} from "../../src/metric/features/metric-preview/theme";
import Login from "../../../../remote/login/src/pages/Login";
import EmrEmptyCreate from "../../../visit/src/pages/EmrWorkspace/components/EmrEmptyCreate";
import "../../../comm/src/styles/shell.css";
import "../../../visit/src/index.css";
import "../../../../remote/medical-record/src/pages/Receive/style.scss";

function Probe({ name }: { name: string }) {
  const { token } = theme.useToken();
  const { resolvedMode } = useAppTheme();
  return (
    <div
      data-testid={name}
      data-mode={resolvedMode}
      data-bg={token.colorBgContainer}
      data-text={token.colorText}
      data-primary={token.colorPrimary}
      data-radius={token.borderRadius}
      style={{
        color: "var(--app-theme-text)",
        background: "var(--mw-surface)",
        padding: 12,
      }}
    >
      {name}{" "}
      <span
        style={{ color: "var(--app-theme-text-disabled)" }}
        data-testid={`${name}-disabled`}
      >
        禁用文字
      </span>
    </div>
  );
}

function LocalPortals() {
  const style = useDataThemeStyle();
  const [modal, setModal] = useState(false),
    [drawer, setDrawer] = useState(false);
  return (
    <>
      <Button onClick={() => setModal(true)}>打开局部弹窗</Button>
      <Button onClick={() => setDrawer(true)}>打开局部抽屉</Button>
      <Modal
        title="局部弹窗"
        open={modal}
        style={{ top: 60, ...style }}
        onCancel={() => setModal(false)}
        footer={null}
      >
        <Probe name="local-modal" />
      </Modal>
      <Drawer
        title="局部抽屉"
        open={drawer}
        rootStyle={style}
        onClose={() => setDrawer(false)}
      >
        <Probe name="local-drawer" />
      </Drawer>
    </>
  );
}

function Dashboard() {
  const [open, setOpen] = useState(false),
    [nested, setNested] = useState(false);
  return (
    <PreviewThemeProvider appearance="dashboard">
      <DataThemeScope>
        <Probe name="dashboard" />
        <Button onClick={() => setOpen(true)}>打开宿主弹窗</Button>
      </DataThemeScope>
      <PreviewModal
        title="宿主弹窗"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
      >
        <Probe name="host-modal" />
        <PreviewThemeProvider appearance="dashboard">
          <Button onClick={() => setNested(true)}>打开嵌套宿主弹窗</Button>
          <PreviewModal
            title="嵌套宿主弹窗"
            open={nested}
            onCancel={() => setNested(false)}
            footer={null}
          >
            <Probe name="nested-modal" />
          </PreviewModal>
        </PreviewThemeProvider>
      </PreviewModal>
    </PreviewThemeProvider>
  );
}

function Fixture() {
  const [mode, setMode] = useState<AppThemeMode>("system");
  const [primary, setPrimary] = useState("#1677ff");
  const [loaded, setLoaded] = useState(false);
  const login = new URLSearchParams(location.search).has("login");
  return (
    <AppThemeProvider mode={mode} primaryColor={primary}>
      <AppThemeRoot />
      <App style={{ height: "100%", overflow: "auto" }}>
        {login ? (
          <BrowserRouter>
            <Login />
          </BrowserRouter>
        ) : (
          <main style={{ padding: 24 }}>
            <select
              aria-label="明暗模式"
              value={mode}
              onChange={(event) => setMode(event.target.value as AppThemeMode)}
            >
              <option value="system">跟随系统</option>
              <option value="light">浅色</option>
              <option value="dark">深色</option>
            </select>
            <select
              aria-label="品牌色"
              value={primary}
              onChange={(event) => setPrimary(event.target.value)}
            >
              <option value="#1677ff">蓝</option>
              <option value="#389e0d">绿</option>
              <option value="#d46b08">橙</option>
            </select>
            <ConfigProvider theme={managementTheme}>
              <DataThemeScope>
                <Probe name="host" />
              </DataThemeScope>
              <AppThemeScope
                mode="dark"
                theme={{
                  token: { colorBgBase: "#0c1220", colorPrimary: "#389e0d" },
                }}
              >
                <DataThemeScope>
                  <Probe name="local" />
                  <LocalPortals />
                </DataThemeScope>
              </AppThemeScope>
              <Dashboard />
            </ConfigProvider>
            <section className="medical-record-receive">
              <Table
                rowKey="id"
                pagination={false}
                columns={[{ title: "签收", dataIndex: "label" }]}
                dataSource={[{ id: 1, label: "已签收" }]}
                rowClassName="receive-row-signed"
              />
            </section>
            <div data-testid="visit">
              <EmrEmptyCreate disabled onCreate={() => {}} />
            </div>
            <Button
              onClick={async () => {
                await Promise.all([
                  import("../../../../remote/nurse-station/src/index.css"),
                  import("../../../../remote/medical-record/src/index.css"),
                  import("../../../widget/src/index.css"),
                ]);
                setLoaded(true);
              }}
            >
              加载子应用样式
            </Button>
            <output data-testid="loaded">{String(loaded)}</output>
          </main>
        )}
      </App>
    </AppThemeProvider>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Fixture />
  </StrictMode>,
);
