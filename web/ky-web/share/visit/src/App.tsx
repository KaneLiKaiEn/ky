import React, { useEffect } from "react";
import { App as AntdApp } from "antd";
import zhCN from "antd/locale/zh_CN";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
dayjs.locale("zh-cn");
import { setMessageApi } from "comm/request";
import { AppThemeProvider, AppThemeRoot, NotFound } from "comm/theme";
import VisitApp from "@/VisitApp";
import InPatientListApp from "./InPatientListApp";
import { BrowserRouter, Route } from "react-router-dom";
import { Routes } from "react-router-dom";
import EmrPreview from "./pages/EmrPreview";
import EmrContent from "./pages/EmrContent";
import EmrView from "./pages/EmrView";
import EmrEdit from "./pages/EmrEdit";
import EmrDiscuss from "./pages/EmrDiscuss";
import UserMultipleList from "./pages/UserMultipleList";
import CohortDict from "./pages/CohortDict";

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
          {/* 路由切换页面来测试公共组件 */}
          <BrowserRouter>
            <Routes>
              <Route path="/404" element={<NotFound homePath="/user" />} />
              <Route path="inpatient-list" element={<InPatientListApp />} />
              <Route path="visit-app" element={<VisitApp />} />
              <Route path="emr-preview" element={<EmrPreview emr_id={840474} />} />
              <Route path="emr-content" element={<EmrContent emr_id={930051} />} />
              <Route path="emr-view" element={<EmrView emr_id={840474} />} />
              <Route path="emr-edit" element={<EmrEdit emr_id={840474} />} />
              {/* <Route path="emr-edit" element={<EmrEdit form_id={180003} visit_id={202600000150047} form_version={1} />} /> */}
              <Route path="emr-discuss" element={<EmrDiscuss emr_id={840474} />} />
              <Route path="user-multiple-list" element={<UserMultipleList open={true} onCancel={() => {}} onOk={() => {}} />} />
              <Route
                path="cohort-dict"
                element={<CohortDict disease_type="病种" work_type="DOCTOR" />}
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AppThemeRoot>
      </AntdApp>
    </AppThemeProvider>
  );
};

export default App;
