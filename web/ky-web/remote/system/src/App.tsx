import React, { useEffect, useMemo } from "react";
import {
  BrowserRouter,
  useNavigate,
  useLocation,
  Routes,
  Route,
} from "react-router-dom";
import { App as AntdApp, Layout, Menu, theme } from "antd";
import {
  UserOutlined,
  TeamOutlined,
  MenuOutlined,
  ApartmentOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import zhCN from "antd/locale/zh_CN";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
dayjs.locale("zh-cn");
import { setMessageApi } from "comm/request";
import { AppThemeProvider, AppThemeRoot, NotFound } from "comm/theme";
import SystemApp from "@/SystemApp";
import menuConfig from "@/menuConfig";

const { Sider, Content } = Layout;

const menuIcons: Record<string, React.ComponentType> = {
  UserOutlined,
  TeamOutlined,
  MenuOutlined,
  ApartmentOutlined,
  IdcardOutlined,
};

const renderIcon = (iconName: string): React.ReactNode => {
  const Icon = menuIcons[iconName];
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
      <Sider
        breakpoint="lg"
        collapsedWidth={0}
        zeroWidthTriggerStyle={{ top: "auto", bottom: 16 }}
        styles={{ body: { overflowY: "auto" } }}
        style={{ background: token.colorBgContainer }}
      >
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
          <Route path="/404" element={<NotFound homePath="/user" />} />
          <Route path="*" element={<SystemApp />} />
        </Routes>
      </Content>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AppThemeProvider locale={zhCN} button={{ autoInsertSpace: false }}>
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
