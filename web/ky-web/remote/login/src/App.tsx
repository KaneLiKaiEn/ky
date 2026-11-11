import React, { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { App as AntdApp } from "antd";
import zhCN from "antd/locale/zh_CN";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
dayjs.locale("zh-cn");
import { setMessageApi } from "comm/request";
import { AppThemeProvider, AppThemeRoot } from "comm/theme";
import LoginApp from "@/LoginApp";

const MessageApiSetter: React.FC = () => {
  const { message } = AntdApp.useApp();
  useEffect(() => {
    setMessageApi(message);
  }, [message]);
  return null;
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
            <LoginApp />
          </BrowserRouter>
        </AppThemeRoot>
      </AntdApp>
    </AppThemeProvider>
  );
};

export default App;
