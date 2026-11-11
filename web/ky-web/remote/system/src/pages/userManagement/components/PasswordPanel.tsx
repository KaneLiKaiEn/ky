import { getSessionId } from "comm/session";
import { App, Button, Form, Input, Typography } from "antd";
import { resetPwd } from "@/api/auth";
import type { EditorProps } from "../types";
import { useEditor } from "@/hooks/useEditor";
import { assertResult } from "@/utils/result";
import { SaveError } from "@/components/Feedback";

export default function PasswordPanel(props: EditorProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<{ password: string; confirm: string }>();
  const editor = useEditor(props);
  return (
    <Form
      form={form}
      className="user-panel user-panel--narrow"
      layout="vertical"
      disabled={props.disabled || editor.saving}
      onValuesChange={() => editor.dirty(true)}
      onFinish={({ password }) =>
        editor.run(async () => {
          const requestSessionId = getSessionId();
          assertResult(
            await resetPwd({ user_id: props.user.user_id, user_pwd: password }),
          );
          if (!editor.mounted.current || getSessionId() !== requestSessionId) return;
          form.resetFields();
          editor.dirty(false);
          message.success("密码已重置");
        })
      }
    >
      <SaveError prefix="user-page" error={editor.error} />
      <div className="user-panel__intro">
        <Typography.Title level={5}>重置密码</Typography.Title>
        <Typography.Text type="secondary">
          为当前用户设置新的登录密码。
        </Typography.Text>
      </div>
      <Form.Item
        label="新密码"
        name="password"
        rules={[{ required: true, message: "请输入新密码" }]}
      >
        <Input.Password autoComplete="new-password" />
      </Form.Item>
      <Form.Item
        label="确认新密码"
        name="confirm"
        dependencies={["password"]}
        rules={[
          { required: true, message: "请再次输入新密码" },
          ({ getFieldValue }) => ({
            validator: (_, value) =>
              !value || value === getFieldValue("password")
                ? Promise.resolve()
                : Promise.reject(new Error("两次输入的密码不一致")),
          }),
        ]}
      >
        <Input.Password autoComplete="new-password" />
      </Form.Item>
      <div className="user-form__actions">
        <Button
          type="primary"
          htmlType="submit"
          loading={editor.saving}
        >
          保存密码
        </Button>
      </div>
    </Form>
  );
}
