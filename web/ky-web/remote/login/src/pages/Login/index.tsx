import { useState } from "react";
import { Alert, Typography } from "antd";
import { SafetyCertificateOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAppTheme } from "comm/theme";
import { setSessionId } from "comm/session";
import { login } from "@/api/auth";
import { rsaEncrypt } from "@/utils/rsa";
import PasswordForm, { type Credentials } from "./components/PasswordForm";
import "./Login.scss";

export default function Login() {
  const { resolvedMode } = useAppTheme();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const submit = async ({ username, password }: Credentials) => {
    setBusy(true);
    setError(undefined);
    try {
      const res = await login({
        username: username.trim(),
        password: rsaEncrypt(password),
      });
      if (!res?.token) throw new Error("登录失败：未返回令牌");
      setSessionId(res.token);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败，请重试");
      setBusy(false);
    }
  };

  return (
    <div className="login-page" data-theme={resolvedMode}>
      <div className="login-page__card" aria-busy={busy}>
        <div className="login-page__header">
          <div className="login-page__logo">
            <SafetyCertificateOutlined className="login-page__logo-icon" />
          </div>
          <Typography.Title level={3} className="login-page__title">
            智慧医院信息系统
          </Typography.Title>
          <Typography.Text className="login-page__subtitle">
            Hospital Information System
          </Typography.Text>
        </div>
        {error && (
          <Alert
            className="login-page__error"
            type="error"
            showIcon
            title={error}
          />
        )}
        <PasswordForm busy={busy} onSubmit={submit} />
        <div className="login-page__footer">
          <Typography.Text className="login-page__copyright">
            © 2023-{new Date().getFullYear()} 厦门齐诺软件科技有限公司
          </Typography.Text>
        </div>
      </div>
    </div>
  );
}
