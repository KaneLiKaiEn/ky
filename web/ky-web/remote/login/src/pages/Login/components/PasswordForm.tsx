import { Button, Form, Input } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";

export interface Credentials {
  username: string;
  password: string;
}

export default function PasswordForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit(values: Credentials): Promise<void>;
}) {
  return (
    <Form<Credentials>
      name="password"
      onFinish={onSubmit}
      size="large"
      disabled={busy}
      autoComplete="off"
    >
      <Form.Item
        name="username"
        rules={[{ required: true, whitespace: true, message: "请输入账号" }]}
      >
        <Input
          className="login-page__input"
          aria-label="账号"
          prefix={<UserOutlined className="login-page__field-icon" />}
          placeholder="请输入账号"
          autoComplete="username"
        />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: "请输入密码" }]}
      >
        <Input.Password
          className="login-page__input"
          aria-label="密码"
          prefix={<LockOutlined className="login-page__field-icon" />}
          placeholder="请输入密码"
          autoComplete="current-password"
        />
      </Form.Item>
      <Form.Item className="login-page__submit-item">
        <Button
          type="primary"
          htmlType="submit"
          loading={busy}
          block
          className="login-page__submit-btn"
        >
          登 录
        </Button>
      </Form.Item>
    </Form>
  );
}
