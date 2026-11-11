import React from "react";
import {
  Alert,
  Button,
  Col,
  Divider,
  Form,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Typography,
} from "antd";
import {
  useOrganizationForm,
  type OrganizationFormOptions,
} from "../hooks/useOrganizationForm";
import AddressFields from "./AddressFields";

const LEVEL_OPTIONS = [
  { value: 0, label: "未知" },
  { value: 1, label: "一级" },
  { value: 2, label: "二级" },
  { value: 3, label: "三级" },
];

const GRADE_OPTIONS = [
  { value: 0, label: "未知" },
  { value: 3, label: "甲等" },
  { value: 2, label: "乙等" },
  { value: 1, label: "丙等" },
];

const OrganizationForm: React.FC<OrganizationFormOptions> = (props) => {
  const disabled = props.disabled ?? false;
  const { form, loading, loaded, loadError, saving, handleSave, retry } =
    useOrganizationForm(props);

  return (
    <Spin spinning={loading}>
      {loadError ? (
        <Alert
          type="error"
          showIcon
          title="机构信息加载失败"
          description="请重试后再编辑，避免覆盖尚未读取的机构信息。"
          action={
            <Button
              disabled={disabled || saving}
              onClick={retry}
            >
              重试
            </Button>
          }
          className="mb-4"
        />
      ) : null}
      <Form
        className="organization-form"
        form={form}
        layout="horizontal"
        colon={false}
        labelAlign="right"
        labelCol={{ flex: "88px" }}
        disabled={disabled || !loaded || saving}
        onFinish={handleSave}
      >
        <Divider titlePlacement="start" className="organization-form__section">
          基本信息
        </Divider>
        <Row gutter={[16, 0]}>
          <Col xs={24} md={12} xl={8}>
            <Form.Item
              name="org_name"
              label="机构名称"
              rules={[
                { required: true, whitespace: true, message: "请输入机构名称" },
              ]}
            >
              <Input placeholder="请输入机构名称" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12} xl={8}>
            <Form.Item name="org_name_abbr" label="名称缩写">
              <Input placeholder="请输入名称缩写" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12} xl={8}>
            <Form.Item name="org_name_full" label="全称">
              <Input placeholder="请输入机构全称" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12} xl={8}>
            <Form.Item name="org_name_alias" label="别名">
              <Input placeholder="请输入别名" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12} xl={8}>
            <Form.Item name="org_system" label="系统代码">
              <Input placeholder="请输入系统代码" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12} xl={8}>
            <Form.Item name="org_level" label="等级">
              <Select options={LEVEL_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12} xl={8}>
            <Form.Item name="org_grade" label="等次">
              <Select options={GRADE_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12} xl={8}>
            <Form.Item name="org_telno" label="电话">
              <Input placeholder="请输入联系电话" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="org_name_legend" label="描述">
              <Input.TextArea rows={2} placeholder="请输入机构描述" />
            </Form.Item>
          </Col>
        </Row>
        <Divider titlePlacement="start" className="organization-form__section">
          地址信息
        </Divider>
        <AddressFields prefix="org" disabled={disabled || !loaded || saving} />
        <Space className="organization-form__actions">
          <Typography.Text type="secondary">
            Alt + Enter 快速保存
          </Typography.Text>
          <Button
            type="primary"
            htmlType="submit"
            loading={saving}
            disabled={disabled || !loaded || saving}
          >
            保存机构
          </Button>
        </Space>
      </Form>
    </Spin>
  );
};

export default OrganizationForm;
