import React, { useEffect, useMemo } from "react";
import { BrowserRouter, useNavigate, useLocation, Routes, Route } from "react-router-dom";
import { App as AntdApp, Layout, Menu, theme } from "antd";
import * as AntdIcons from "@ant-design/icons";
import zhCN from "antd/locale/zh_CN";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
dayjs.locale("zh-cn");
import { setMessageApi } from "comm/request";
import { AppThemeProvider, AppThemeRoot, NotFound } from "comm/theme";
import WidgetApp from "@/WidgetApp";
import menuConfig from "@/menuConfig";

const { Sider, Content } = Layout;

const renderIcon = (iconName: string): React.ReactNode => {
  const Icon = (AntdIcons as unknown as Record<string, React.ComponentType>)[
    iconName
  ];
  return Icon ? <Icon /> : null;
};

const MessageApiSetter: React.FC = () => {
  const { message } = AntdApp.useApp();
  useEffect(() => {
    setMessageApi(message);
  }, [message]);
  return null;
};

const StandaloneLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  const menuItems = useMemo(
    () =>
      [...menuConfig]
        .sort((a, b) => a.order - b.order)
        .map((item) => ({
          key: `/${item.key}`,
          icon: renderIcon(item.icon),
          label: item.label,
        })),
    [],
  );

  const selectedKey =
    "/" +
    (location.pathname.split("/").filter(Boolean)[0] ?? menuConfig[0]?.key);

  return (
    <Layout style={{ height: "var(--app-vh)", overflow: "hidden" }}>
      <Sider style={{ background: token.colorBgContainer, overflowY: "auto" }}>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ border: "none" }}
        />
      </Sider>
      <Content style={{ height: "var(--app-vh)", overflowY: "auto" }}>
        <Routes>
          <Route path="/404" element={<NotFound homePath="/user-home" />} />
          <Route path="*" element={<WidgetApp />} />
        </Routes>
      </Content>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AppThemeProvider
      locale={zhCN}
      button={{ autoInsertSpace: false }}
    >
      <AntdApp>
        <AppThemeRoot>
          <MessageApiSetter />
          <BrowserRouter>
            <StandaloneLayout />
          </BrowserRouter>
        </AppThemeRoot>
      </AntdApp>
    </AppThemeProvider>
  );
};

export default App;
