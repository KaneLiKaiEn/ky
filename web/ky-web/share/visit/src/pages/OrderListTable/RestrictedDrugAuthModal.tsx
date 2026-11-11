import { useState } from "react";
import { App, Button, Form, Input, Modal, Spin } from "antd";
import { getSessionInfo, login } from "@/api/auth";
import { authOrderAPI } from "@/api/ordent";
import { retrieveUserList } from "@/api/user";
import type { UserRow } from "@/types/user";
import { getSessionId } from "comm/session";

interface RestrictedDrugAuthModalProps {
  orderId?: number;
  onAuthRestrictedDrug?: () => void;
}

/** 限制级药品：检索授权医师 → 密码登录 → AuthOrder */
const RestrictedDrugAuthModal = ({
  orderId,
  onAuthRestrictedDrug,
}: RestrictedDrugAuthModalProps) => {
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<{ user_pwd: string }>();
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [userList, setUserList] = useState<UserRow[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  const fetchUserList = async (retrieve_input = "*") => {
    const sessionRes = await getSessionInfo({
      session_id: getSessionId() ?? "",
    });
    const deptId = Number(sessionRes.session_info?.dept_id);
    if (!Number.isFinite(deptId) || deptId <= 0) {
      message.warning("缺少科室信息，无法检索医师");
      return;
    }
    setListLoading(true);
    try {
      const res = await retrieveUserList({
        dept_id: deptId,
        retrieve_input: retrieve_input || "*",
        retrieve_limit: 50,
        work_type: "DOCTOR",
        column_list: "*",
      });
      setUserList(res.user_list ?? []);
    } catch {
      // code !== 0 已由 request 拦截器提示
    } finally {
      setListLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setSelectedUser(null);
    form.resetFields();
    void fetchUserList("*");
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedUser(null);
    form.resetFields();
  };

  const handleLogin = async () => {
    try {
      const values = await form.validateFields();
      if (!orderId) {
        message.warning("缺少医嘱ID，无法授权");
        return;
      }
      if (!selectedUser?.user_no) {
        message.warning("请先选择授权医师");
        return;
      }
      setLoading(true);
      const loginRes = await login({
        user_no: selectedUser.user_no,
        user_pwd: values.user_pwd,
      });
      if (!loginRes.session_id) {
        message.warning("登录失败，未返回会话");
        return;
      }
      await authOrderAPI({
        order_id: orderId,
        session_id: loginRes.session_id,
      });
      message.success("授权成功");
      handleClose();
      onAuthRestrictedDrug?.();
    } catch {
      // 表单校验失败，或接口错误（code !== 0 已全局提示）
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-1 text-(--app-theme-error, #ff4d4f)">
        限制级药品需授权医师登录后才可提交。
      </div>
      <Button size="small" type="primary" onClick={handleOpen}>
        授权
      </Button>
      <Modal
        title="限制级药品授权"
        open={open}
        onCancel={handleClose}
        footer={null}
        width={480}
        zIndex={1100}
        destroyOnHidden
        afterClose={() => {
          setSelectedUser(null);
          setUserList([]);
          form.resetFields();
        }}
      >
        <Input.Search
          placeholder="检索医师（默认检索全部）"
          allowClear
          enterButton="检索"
          onSearch={(value) => void fetchUserList(value.trim() || "*")}
        />
        <Spin spinning={listLoading}>
          <div className="mt-3 max-h-70 overflow-auto rounded border border-(--app-theme-border)">
            {userList.length === 0 ? (
              <div className="px-3 py-6 text-center text-(--app-theme-text-secondary, #8c8c8c)">
                暂无医师
              </div>
            ) : (
              userList.map((item) => {
                const isSelected = selectedUser?.user_id === item.user_id;
                return (
                  <div
                    key={item.user_id ?? item.user_no}
                    className={`flex cursor-pointer justify-between px-3 py-2 ${
                      isSelected ? "bg-(--app-theme-primary)" : ""
                    }`}
                    onClick={() => setSelectedUser(item)}
                  >
                    <span>{item.user_name || "-"}</span>
                    <span className="text-(--app-theme-text-secondary, #8c8c8c)">
                      {item.user_no}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </Spin>
        {selectedUser ? (
          <div className="mt-3">
            <div className="mb-2">
              已选医师：{selectedUser.user_name}（{selectedUser.user_no}）
            </div>
            <Form form={form} layout="inline" className="flex items-center">
              <Form.Item
                name="user_pwd"
                rules={[{ required: true, message: "请输入密码" }]}
                className="mb-0!"
              >
                <Input.Password placeholder="密码" allowClear />
              </Form.Item>
              <Form.Item className="mb-0!">
                <Button
                  type="primary"
                  loading={loading}
                  onClick={() => void handleLogin()}
                >
                  登录
                </Button>
              </Form.Item>
            </Form>
          </div>
        ) : (
          <div className="mt-3 text-(--app-theme-text-secondary, #8c8c8c)">
            请从上方列表选择授权医师
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RestrictedDrugAuthModal;
