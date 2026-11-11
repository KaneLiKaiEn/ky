import React from "react";
import { Card, Typography } from "antd";

const Home: React.FC = () => {
  return (
    <div className="p-5">
      <Card>
        <Typography.Title level={4}>欢迎使用</Typography.Title>
        <Typography.Paragraph type="secondary" className="!mb-0">
          点击左侧「菜单」进入系统管理：用户、角色、菜单、部门、岗位。
        </Typography.Paragraph>
      </Card>
    </div>
  );
};

export default Home;
